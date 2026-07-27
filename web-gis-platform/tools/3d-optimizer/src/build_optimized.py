#!/usr/bin/env python3
"""
build_optimized.py — Bộ công cụ tối ưu hóa xử lý dữ liệu GIS offline hoàn chỉnh.
Tự động chuyển đổi Point Cloud sang COPC/3D Tiles, nén GLB, và convert TIF sang JPG địa lý.
"""

import os
import sys

# Thiết lập mã hóa UTF-8 cho stdout/stderr để tránh lỗi Unicode trên Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

import json
import struct
import re
import subprocess
import shutil
import argparse
from pathlib import Path
from typing import Optional

# Tự động kiểm tra và cài đặt các thư viện phụ thuộc bằng pip
REQUIRED_LIBS = {
    'py3dtiles': 'py3dtiles',
    'pyproj': 'pyproj',
    'PIL': 'pillow',
    'trimesh': 'trimesh',
    'shapefile': 'pyshp',
    'tifffile': 'tifffile',
    'imagecodecs': 'imagecodecs'
}

def auto_install_dependencies():
    print("Checking dependencies...")
    for module_name, pip_name in REQUIRED_LIBS.items():
        try:
            __import__(module_name)
        except ImportError:
            print(f"  Installing missing dependency: {pip_name}...")
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", pip_name], check=True)
                print(f"  Successfully installed {pip_name}!")
            except Exception as e:
                print(f"  WARNING: Failed to auto-install {pip_name}: {e}")

# Chạy cài đặt trước khi import các thư viện bên thứ ba
auto_install_dependencies()

# Import các thư viện sau khi đã cài đặt thành công
try:
    from PIL import Image
    # Tăng giới hạn kích thước ảnh tối đa của PIL để mở được file TIF dung lượng lớn (1.4GB)
    Image.MAX_IMAGE_PIXELS = None
except ImportError:
    Image = None

try:
    from pyproj import Transformer
except ImportError:
    Transformer = None

try:
    import trimesh
except ImportError:
    trimesh = None

try:
    import shapefile
except ImportError:
    shapefile = None


def windows_to_local(project_dir: Path, win_path: str) -> Optional[str]:
    path = win_path.replace('\\', '/')
    if project_dir.name in path:
        idx = path.index(project_dir.name)
        return str(project_dir / path[idx + len(project_dir.name) + 1:])
    for sub in ['Reconstruction', 'Results', 'Vector']:
        if sub in path:
            return str(project_dir / path[path.index(sub):])
    return None


# ─── finders ────────────────────────────────────────────────────────

def find_las_dir(project_dir: Path) -> Optional[Path]:
    """Tìm thư mục chứa file LAS gốc."""
    for cfg_path in project_dir.glob('Reconstruction/Model_Temp/*/Model/model_config.json'):
        try:
            cfg = json.loads(cfg_path.read_text())
            las = cfg.get('LAS_FILES', [])
            if las:
                local = windows_to_local(project_dir, las[0])
                if local:
                    p = Path(local).parent
                    if p.exists():
                        return p
        except Exception:
            pass

    at_dirs = sorted(project_dir.glob('Reconstruction/AT_Temp/AT_*/LasFile/'), reverse=True)
    if at_dirs:
        return at_dirs[0]
    return None


def find_model_objs(project_dir: Path) -> list:
    """Tìm các file OBJ thô từ DJI Terra."""
    for obj_dir in project_dir.glob('Results/Model/*/OBJ/Data'):
        objs = list(obj_dir.glob('*_+*/Tile_*.obj'))
        if objs:
            return sorted(objs)
        objs = list(obj_dir.glob('*.obj'))
        if objs:
            return sorted(objs)

    for obj_dir in project_dir.glob('Reconstruction/Model_Temp/*/Model/Reconstruction'):
        objs = list(obj_dir.glob('Tile_*/Tile_*.obj'))
        if objs:
            return sorted(objs)
    return []


def find_dom_tiff(project_dir: Path) -> Optional[Path]:
    """Tìm tệp TDOM TIFF."""
    for dom_dir in sorted(project_dir.glob('Results/DOM/*'), reverse=True):
        tiffs = list(dom_dir.glob('*_tdom.tif'))
        if not tiffs:
            tiffs = list(dom_dir.glob('*_dsm.tif'))
        if not tiffs:
            tiffs = list(dom_dir.glob('*.tif'))
        if tiffs:
            return tiffs[0]
    return None


def find_model_srs_origin(project_dir: Path) -> tuple:
    """Lấy gốc tọa độ phẳng từ metadata."""
    for xml_path in project_dir.glob('Results/Model/*/OBJ/metadata.xml'):
        try:
            import xml.etree.ElementTree as ET
            tree = ET.parse(xml_path)
            srs = tree.find('.//SRSOrigin')
            if srs is not None and srs.text:
                parts = srs.text.split(',')
                return float(parts[0]), float(parts[1])
        except Exception:
            pass
    return 615846, 1199202


# ─── processors ─────────────────────────────────────────────────────

def find_model_polygon_wkt(project_dir: Path) -> Optional[str]:
    """Trích xuất ranh giới Polygon WKT từ file Line1.shp của dự án."""
    shp_files = list(project_dir.glob('Vector/Line1.shp'))
    if not shp_files:
        return None

    try:
        import shapefile
        with shapefile.Reader(str(shp_files[0])) as sf:
            for shape in sf.shapes():
                pts = shape.points
                if len(pts) >= 3:
                    unique_pts = []
                    for pt in pts:
                        if not unique_pts or pt != unique_pts[-1]:
                            unique_pts.append(pt)
                    if len(unique_pts) >= 3:
                        if unique_pts[0] != unique_pts[-1]:
                            unique_pts.append(unique_pts[0])
                        coords = ', '.join(f'{x:.4f} {y:.4f}' for x, y in unique_pts)
                        return f'POLYGON(({coords}))'
    except Exception as e:
        print(f"  ⚠️ Cảnh báo đọc Line1.shp: {e}")

    return None

def _patch_evlr(path: Path):
    """Patch EVLR in COPC file if needed."""
    try:
        with open(path, 'r+b') as f:
            f.seek(235)
            off = struct.unpack('<Q', f.read(8))[0]
            cnt = struct.unpack('<I', f.read(4))[0]
            if cnt > 0 and off > 0:
                f.seek(off)
                hdr = f.read(60)
                if len(hdr) == 60:
                    uid = hdr[2:18].decode('ascii', 'replace').strip('\x00')
                    if uid == 'copc':
                        return
            f.seek(235)
            f.write(struct.pack('<Q', 0))
            f.write(struct.pack('<I', 0))
    except Exception as e:
        print(f"  ⚠️ Cảnh báo _patch_evlr: {e}")

def process_pointcloud(project_dir: Path, output_dir: Path, epsg: int = 32648) -> bool:
    """Gộp toàn bộ file LAS -> file LAS trung gian (đã cắt ranh giới), sau đó convert thành 3D Tiles chuẩn."""
    print("\n━━━ Point Cloud (LAS -> 3D Tiles tileset.json) ━━━")
    
    las_dir = find_las_dir(project_dir)
    if not las_dir:
        print("  SKIP: Không tìm thấy file LAS nào.")
        return False

    las_files = sorted(las_dir.glob('*.las'))
    if not las_files:
        print("  SKIP: Thư mục LasFile trống.")
        return False

    print(f"  Tìm thấy {len(las_files)} file LAS thô trong {las_dir.name}.")
    print(f"  Hệ tọa độ đầu vào: EPSG:{epsg}")

    clip_wkt = find_model_polygon_wkt(project_dir)

    out_pc_dir = output_dir / 'pointcloud'
    if out_pc_dir.exists():
        shutil.rmtree(out_pc_dir)
    out_pc_dir.mkdir(parents=True, exist_ok=True)
    
    temp_las = output_dir / 'temp_cropped.las'

    pdal_bin = Path("C:/Users/duong/anaconda3/envs/gis_env/Library/bin/pdal.exe")
    if not pdal_bin.exists():
        pdal_bin = shutil.which('pdal') or 'pdal'

    # 1. Tạo pipeline gộp tất cả LAS file và cắt theo ranh giới mô hình 3D
    print(f"  Đang tạo PDAL Pipeline gộp {len(las_files)} file LAS...")
    pipeline = []
    tags = []
    for i, las_file in enumerate(las_files):
        tag = f"r{i}"
        tags.append(tag)
        pipeline.append({
            "type": "readers.las",
            "filename": str(las_file).replace('\\', '/'),
            "tag": tag
        })
    
    pipeline.append({"type": "filters.merge", "inputs": tags, "tag": "m"})

    last_tag = "m"
    if clip_wkt:
        print(f"  ✂️ Áp dụng bộ lọc cắt xén ranh giới mô hình 3D (Polygon Crop)...")
        pipeline.append({
            "type": "filters.crop",
            "inputs": ["m"],
            "polygon": clip_wkt,
            "tag": "c"
        })
        last_tag = "c"

    pipeline.append({
        "type": "writers.las",
        "inputs": [last_tag],
        "filename": str(temp_las).replace('\\', '/'),
        "a_srs": f"EPSG:{epsg}"
    })

    pipeline_path = output_dir / '.pipeline.json'
    pipeline_path.write_text(json.dumps(pipeline, indent=2), encoding='utf-8')

    cmd = [str(pdal_bin), "pipeline", str(pipeline_path)]
    print(f"  Đang thực thi PDAL Pipeline...")
    pdal_ok = False
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', timeout=600)
        if res.returncode == 0 and temp_las.exists():
            size_mb = temp_las.stat().st_size / (1024 * 1024)
            print(f"  ✅ Đã tạo thành công file LAS trung gian (đã cắt ranh giới): {size_mb:.1f} MB")
            pdal_ok = True
        else:
            print(f"  ⚠️ Lỗi khi gộp PDAL pipeline: {res.stderr[:300]}")
    except Exception as e:
        print(f"  ⚠️ Exception khi chạy PDAL pipeline: {e}")

    # Map EPSG đặc biệt (VN2000) sang UTM 48N
    if epsg in (9214, 5899, 10575):
        srs_in = "32648"
    else:
        srs_in = str(epsg)

    # 2. Chạy py3dtiles convert
    if pdal_ok:
        inputs_to_convert = [str(temp_las)]
    else:
        print("  ⚠️ PDAL thất bại, chuyển sang convert trực tiếp các file LAS thô không qua bộ lọc...")
        inputs_to_convert = [str(f) for f in las_files]

    print(f"  ⏳ Đang chạy py3dtiles để convert sang 3D Tiles...")
    convert_cmd = [
        "py", "-3.12", "-m", "py3dtiles.command_line", "convert",
        *inputs_to_convert,
        "--out", str(out_pc_dir),
        "--srs_in", srs_in,
        "--srs_out", "4978", # ECEF cho Cesium
        "--jobs", "4",
        "--color_scale", "256",
        "--overwrite"
    ]
    
    print(f"  Lệnh convert: {' '.join(convert_cmd[:6])} ...")
    try:
        res_convert = subprocess.run(convert_cmd, capture_output=True, text=True, encoding='utf-8', timeout=1800)
        # Xóa file LAS tạm
        if temp_las.exists():
            try:
                temp_las.unlink(missing_ok=True)
            except Exception as e:
                print(f"  ⚠️ Cảnh báo không thể xóa file tạm {temp_las.name} ngay lập tức (Windows File Lock): {e}")
            
        tileset_file = out_pc_dir / 'tileset.json'
        if res_convert.returncode == 0 and tileset_file.exists():
            print(f"  ✅ py3dtiles: Đã chuyển đổi thành công sang 3D Tiles chuẩn (tileset.json)!")
            return True
        else:
            print(f"  ❌ py3dtiles convert thất bại (exit code: {res_convert.returncode}): {res_convert.stderr[:500]}")
            return False
    except Exception as e:
        print(f"  ❌ Lỗi khi chạy py3dtiles convert: {e}")
        if temp_las.exists():
            try:
                temp_las.unlink(missing_ok=True)
            except Exception:
                pass
        return False


    

def fallback_trimesh_glb(objs: list, out_path: Path) -> bool:
    if trimesh is None:
        print("  ERROR: trimesh chưa được cài đặt, không thể chạy fallback.")
        return False
    print("  Đang tải meshes qua trimesh...")
    meshes = []
    for obj_path in objs:
        try:
            m = trimesh.load(str(obj_path), force='mesh', process=True)
            meshes.append(m)
        except Exception as e:
            print(f"  Lỗi load tile {obj_path.name}: {e}")
    if not meshes:
        return False
    scene = trimesh.Scene()
    for i, m in enumerate(meshes):
        scene.add_geometry(m, node_name=f'tile_{i}')
    data = scene.export(file_type='glb')
    out_path.write_bytes(data)
    print(f"  ✅ Fallback GLB tạo thành công! Dung lượng: {out_path.stat().st_size / (1024**2):.2f} MB")
    return True


def process_model_glb(project_dir: Path, output_dir: Path, srs_origin: tuple, compress: bool = False, simplify_ratio: Optional[float] = None) -> bool:
    """Gộp OBJ thành GLB và nén."""
    print("\n━━━ 3D Model Mesh (OBJ -> GLB) ━━━")
    
    out_glb_dir = output_dir / 'glb'
    out_glb_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_glb_dir / 'model.glb'
    merged_obj = out_glb_dir / 'merged.obj'

    objs = find_model_objs(project_dir)
    if not objs:
        print("  SKIP: Không tìm thấy mảnh OBJ nào.")
        return False

    print(f"  Tìm thấy {len(objs)} mảnh OBJ.")

    # 1. Merge các OBJ tile bằng phương pháp text-based
    print(f"  Đang merge {len(objs)} tiles...")
    vertex_offset = 0
    uv_offset = 0
    normal_offset = 0
    merged_lines = ['# Merged OBJ from Web GIS pipeline\n']
    
    max_texture_res = 2048 # Độ phân giải tối ưu cho Web
    
    for obj_idx, obj_path in enumerate(objs):
        obj_dir_local = obj_path.parent
        tile_prefix = f"t{obj_idx}_{obj_path.stem}"
        vertices = []
        uvs = []
        normals = []
        body_lines = []
        
        for line in obj_path.read_text(errors='ignore').splitlines():
            clean = line.strip()
            if clean.startswith('mtllib '):
                raw_mtl_name = clean.split(maxsplit=1)[1]
                mtl_name = Path(raw_mtl_name).name
                mtl_file = obj_dir_local / mtl_name
                if mtl_file.exists():
                    dest_mtl_name = f"{tile_prefix}_{mtl_name}"
                    dest_mtl = out_glb_dir / dest_mtl_name
                    mtl_lines = []
                    for mtl_line in mtl_file.read_text(errors='ignore').splitlines():
                        m_clean = mtl_line.strip()
                        if m_clean.lower().startswith('newmtl '):
                            mat_name = m_clean.split(maxsplit=1)[1]
                            mtl_lines.append(f"newmtl {tile_prefix}_{mat_name}")
                        elif m_clean.lower().startswith('map_kd'):
                            tex_name = Path(m_clean.split()[-1]).name
                            tex_src = obj_dir_local / tex_name
                            if tex_src.exists():
                                dest_tex_name = f"{tile_prefix}_{tex_name}"
                                dest_tex = out_glb_dir / dest_tex_name
                                try:
                                    with Image.open(tex_src) as img:
                                        w, h = img.size
                                        if w > max_texture_res or h > max_texture_res:
                                            ratio = min(max_texture_res / w, max_texture_res / h)
                                            new_w, new_h = int(w * ratio), int(h * ratio)
                                            print(f"  [Opt] Nén texture {tex_name}: {w}x{h} -> {new_w}x{new_h}")
                                            img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                                            img_resized.save(dest_tex, 'JPEG', quality=75)
                                        else:
                                            shutil.copy2(tex_src, dest_tex)
                                    mtl_lines.append(f"map_Kd {dest_tex_name}")
                                except Exception as e:
                                    print(f"  [Opt Warning] Lỗi nén texture {tex_name}: {e}, dùng ảnh gốc.")
                                    shutil.copy2(tex_src, dest_tex)
                                    mtl_lines.append(f"map_Kd {dest_tex_name}")
                            else:
                                mtl_lines.append(mtl_line)
                        else:
                            mtl_lines.append(mtl_line)
                    dest_mtl.write_text('\n'.join(mtl_lines))
                    merged_lines.append(f'mtllib {dest_mtl_name}\n')
            elif clean.startswith('usemtl '):
                mat_name = clean.split(maxsplit=1)[1]
                body_lines.append(f'usemtl {tile_prefix}_{mat_name}')
            elif clean.startswith('v '):
                parts = clean.split()
                x = float(parts[1])
                y = float(parts[2])
                z = float(parts[3])
                vertices.append(f"v {x:.6f} {z:.6f} {-y:.6f}")
            elif clean.startswith('vt '):
                uvs.append(line)
            elif clean.startswith('vn '):
                parts = clean.split()
                nx = float(parts[1])
                ny = float(parts[2])
                nz = float(parts[3])
                normals.append(f"vn {nx:.6f} {nz:.6f} {-ny:.6f}")
            elif clean.startswith('f '):
                parts = clean.split()[1:]
                new_parts = []
                for p in parts:
                    indices = p.split('/')
                    vi = int(indices[0]) + vertex_offset
                    vt = (int(indices[1]) + uv_offset) if len(indices) > 1 and indices[1] else ''
                    vn = (int(indices[2]) + normal_offset) if len(indices) > 2 and indices[2] else ''
                    if vt and vn:
                        new_parts.append(f'{vi}/{vt}/{vn}')
                    elif vt:
                        new_parts.append(f'{vi}/{vt}')
                    else:
                        new_parts.append(str(vi))
                body_lines.append('f ' + ' '.join(new_parts))
        
        merged_lines.extend(vertices)
        merged_lines.extend(uvs)
        merged_lines.extend(normals)
        merged_lines.extend(body_lines)
        vertex_offset += len(vertices)
        uv_offset += len(uvs)
        normal_offset += len(normals)
        
    merged_obj.write_text('\n'.join(merged_lines) + '\n')
    print(f"  ✅ Merge OBJ xong: {merged_obj.name}")

    # 2. Chạy gltfpack qua npx
    npx_bin = shutil.which('npx') or 'npx'
    ratio = simplify_ratio if simplify_ratio is not None else 0.5
    
    cmd = [npx_bin, 'gltfpack', '-i', str(merged_obj), '-o', str(out_path)]
    if compress:
        cmd.extend(['-cc', '-si', str(ratio), '-sa'])
    
    print(f"  Đang chạy gltfpack nén: {' '.join(cmd)}")
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, shell=True, encoding='utf-8')
        merged_obj.unlink(missing_ok=True)
        # Clear temporary mtl and image files
        for f in out_glb_dir.glob('*'):
            if f.is_file() and f.name != 'model.glb':
                f.unlink(missing_ok=True)
                
        if res.returncode == 0 and out_path.exists():
            size_mb = out_path.stat().st_size / (1024**2)
            print(f"  ✅ gltfpack: Nén và tối ưu hóa Mesh thành công! Dung lượng: {size_mb:.2f} MB")
            return True
        else:
            print(f"  ❌ gltfpack thất bại (exit code: {res.returncode}): {res.stderr}")
            return fallback_trimesh_glb(objs, out_path)
    except Exception as e:
        print(f"  ❌ Lỗi khi chạy gltfpack: {e}")
        return fallback_trimesh_glb(objs, out_path)


def process_dom_tif(project_dir: Path, output_dir: Path, epsg: int = 32648, max_size: int = 4096) -> bool:
    """Đọc tiff + tfw (không cần GDAL), xuất dom.png (giữ độ trong suốt xóa nền đen) và tính tọa độ WGS84 cho metadata.json."""
    print("\n━━━ DOM (TIF -> PNG + Địa lý) ━━━")
    if Image is None or Transformer is None:
        print("  ERROR: pillow hoặc pyproj chưa được cài đặt.")
        return False

    out_dom_dir = output_dir / 'dom'
    out_dom_dir.mkdir(parents=True, exist_ok=True)

    tiff_path = find_dom_tiff(project_dir)
    if not tiff_path:
        print("  SKIP: Không tìm thấy file TDOM TIF.")
        return False

    tfw_path = tiff_path.with_suffix('.tfw')
    if not tfw_path.exists():
        tfw_candidates = list(tiff_path.parent.glob('*.tfw')) + list(tiff_path.parent.glob('*.TFW'))
        if tfw_candidates:
            tfw_path = tfw_candidates[0]
        else:
            print("  SKIP: Không tìm thấy file World File .tfw tương ứng.")
            return False

    print(f"  Đang đọc ảnh: {tiff_path.name}")
    print(f"  Đang đọc tọa độ: {tfw_path.name}")

    try:
        with open(tfw_path, 'r') as f:
            lines = [float(line.strip()) for line in f if line.strip()]
        pixel_x = lines[0]
        pixel_y = lines[3]
        origin_x = lines[4]
        origin_y = lines[5]
    except Exception as e:
        print(f"  ❌ Lỗi đọc file .tfw: {e}")
        return False

    try:
        img_resized = None
        orig_w, orig_h = 0, 0
        
        try:
            import tifffile
            print("  Đang giải mã TIFF bằng thư viện tifffile...")
            with tifffile.TiffFile(tiff_path) as tif:
                orig_h, orig_w = tif.pages[0].shape[:2]
                print(f"  Kích thước ảnh gốc: {orig_w}x{orig_h} pixels")
                
                target_page = tif.pages[0]
                for page in tif.pages:
                    if len(page.shape) >= 2 and page.shape[1] <= max_size:
                        target_page = page
                        break
                
                new_h, new_w = target_page.shape[:2]
                print(f"  Load overview tối ưu cho web: {new_w}x{new_h}")
                image_data = target_page.asarray()
                img_resized = Image.fromarray(image_data)
        except Exception as e:
            print(f"  [WARNING] Không thể đọc bằng tifffile: {e}. Thử fallback bằng Pillow...")
            
        if img_resized is None:
            with Image.open(tiff_path) as img:
                orig_w, orig_h = img.size
                print(f"  Kích thước ảnh gốc: {orig_w}x{orig_h} pixels")
                
                if orig_w > max_size or orig_h > max_size:
                    ratio = min(max_size / orig_w, max_size / orig_h)
                    new_w = int(orig_w * ratio)
                    new_h = int(orig_h * ratio)
                    print(f"  Đang nén tỷ lệ ảnh phục vụ Web: {orig_w}x{orig_h} -> {new_w}x{new_h}...")
                    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                else:
                    img_resized = img.copy()

        w, h = orig_w, orig_h
        
        xmin = origin_x
        ymax = origin_y
        xmax = origin_x + w * pixel_x
        ymin = origin_y + h * pixel_y
        
        print(f"  Đang chuyển đổi hệ tọa độ từ EPSG:{epsg} sang WGS84...")
        crs_in = f"EPSG:{epsg}"
        
        # Thử đọc PRJ file
        prj_path = tiff_path.with_suffix('.prj')
        if prj_path.exists():
            try:
                prj_text = prj_path.read_text().lower()
                if "105.75" in prj_text or "vn-2000" in prj_text or "vn2000" in prj_text:
                    crs_in = "+proj=tmerc +lat_0=0 +lon_0=105.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +units=m +no_defs"
                    print("  Sử dụng hệ tọa độ VN2000 TP.HCM (Kinh tuyến trục 105.75) trích xuất từ PRJ file")
            except Exception as e:
                print(f"  ⚠️ Lỗi khi phân tích PRJ: {e}")

        if epsg in (9214, 5899, 10575) or "+proj=tmerc" in crs_in:
            crs_in = "+proj=tmerc +lat_0=0 +lon_0=105.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +units=m +no_defs"
            print("  Sử dụng hệ tọa độ VN2000 TP.HCM (Kinh tuyến trục 105.75)")
            
        transformer = Transformer.from_crs(crs_in, "EPSG:4326", always_xy=True)
        lon_min, lat_min = transformer.transform(xmin, ymin)
        lon_max, lat_max = transformer.transform(xmax, ymax)

        # Loại bỏ mảng đen bao quanh ảnh (Black border margins) bằng cách đặt Alpha = 0 cho pixel (0, 0, 0)
        try:
            import numpy as np
            print("  Đang loại bỏ mảng viền đen (Nodata margin) bằng NumPy...")
            img_rgba = img_resized.convert('RGBA')
            img_np = np.array(img_rgba)
            black_mask = (img_np[:, :, 0] == 0) & (img_np[:, :, 1] == 0) & (img_np[:, :, 2] == 0)
            img_np[black_mask, 3] = 0
            img_resized = Image.fromarray(img_np)
        except Exception as e:
            print(f"  ⚠️ Cảnh báo: Không thể dùng NumPy để xóa viền đen: {e}")

        png_out = out_dom_dir / 'dom.png'
        img_resized.save(png_out, 'PNG')
        print(f"  Lưu thành công ảnh Web: {png_out.name} ({png_out.stat().st_size / 1024 / 1024:.2f} MB)")
        
        metadata = {
            "west": lon_min,
            "east": lon_max,
            "south": lat_min,
            "north": lat_max,
            "center": [(lon_min + lon_max) / 2, (lat_min + lat_max) / 2],
            "centerLon": [(lon_min + lon_max) / 2][0],
            "centerLat": [(lat_min + lat_max) / 2][0],
            "original_width": w,
            "original_height": h,
            "pixel_size": abs(pixel_x),
            "epsg": epsg
        }
        meta_out = out_dom_dir / 'metadata.json'
        meta_out.write_text(json.dumps(metadata, indent=2))
        print(f"  Tạo thành công metadata: {meta_out.name}")
        return True
    except Exception as e:
        print(f"  ❌ Lỗi khi xử lý hình ảnh TIFF: {e}")
        return False


# ─── main ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Tối ưu hóa và build dữ liệu GIS offline hoàn chỉnh.")
    parser.add_argument("project_dir", help="Đường dẫn đến thư mục dự án DJI Terra gốc")
    parser.add_argument("-o", "--output", required=True, help="Đường dẫn thư mục lưu kết quả xử lý")
    parser.add_argument("--epsg", type=int, default=32648, help="Mã EPSG của hệ tọa độ gốc (Mặc định: 32648 - UTM Zone 48N)")
    parser.add_argument("--skip-pointcloud", action="store_true", help="Bỏ qua xử lý mây điểm")
    parser.add_argument("--skip-model", action="store_true", help="Bỏ qua xử lý 3D Model mesh")
    parser.add_argument("--skip-dom", action="store_true", help="Bỏ qua xử lý ảnh phẳng hàng không DOM")
    parser.add_argument("--compress-model", action="store_true", help="Nén Draco mô hình GLB qua gltfpack")
    parser.add_argument("--simplify-ratio", type=float, default=0.5, help="Tỷ lệ đơn giản hóa mesh model (mặc định 0.5)")
    parser.add_argument("--max-dom-size", type=int, default=4096, help="Kích thước tối đa ảnh DOM (mặc định 4096)")
    
    args = parser.parse_args()

    project_path = Path(args.project_dir)
    output_path = Path(args.output)

    if not project_path.exists():
        print(f"❌ Lỗi: Thư mục dự án '{project_path}' không tồn tại!")
        sys.exit(1)

    # Tự động tìm thư mục chứa Results / Reconstruction
    def resolve_dji_terra_root(path: Path) -> Path:
        if (path / 'Results').exists() or (path / 'Reconstruction').exists():
            return path
        for sub in path.rglob('Results'):
            if sub.is_dir() and not sub.name.startswith('.'):
                return sub.parent
        for sub in path.rglob('Reconstruction'):
            if sub.is_dir() and not sub.name.startswith('.'):
                return sub.parent
        return path

    resolved_path = resolve_dji_terra_root(project_path)
    if resolved_path != project_path:
        print(f"🔍 Tự động phát hiện cấu trúc DJI Terra gốc tại: {resolved_path.resolve()}")
        project_path = resolved_path

    output_path.mkdir(parents=True, exist_ok=True)
    print(f"==================================================")
    print(f"⚙️ KHỞI ĐỘNG TIẾN TRÌNH BUILD DỮ LIỆU GIS OFFLINE")
    print(f"   Dự án nguồn: {project_path.resolve()}")
    print(f"   Thư mục đích: {output_path.resolve()}")
    print(f"   Hệ tọa độ (EPSG): {args.epsg}")
    print(f"==================================================")

    # 1. Xử lý ảnh trực giao DOM
    if not args.skip_dom:
        process_dom_tif(project_path, output_path, args.epsg, args.max_dom_size if hasattr(args, 'max_dom_size') else 4096)
    else:
        print("\n⏩ Bỏ qua xử lý DOM.")

    # 2. Xử lý mô hình 3D Mesh
    if not args.skip_model:
        srs_origin = find_model_srs_origin(project_path)
        process_model_glb(project_path, output_path, srs_origin, args.compress_model, args.simplify_ratio)
    else:
        print("\n⏩ Bỏ qua xử lý 3D Model.")

    # 3. Xử lý Đám mây điểm Point Cloud
    if not args.skip_pointcloud:
        process_pointcloud(project_path, output_path, args.epsg)
    else:
        print("\n⏩ Bỏ qua xử lý Point Cloud.")

    print(f"\n==================================================")
    print(f"🎉 HOÀN TẤT TIẾN TRÌNH XỬ LÝ OFFLINE!")
    print(f"==================================================")


if __name__ == "__main__":
    main()
