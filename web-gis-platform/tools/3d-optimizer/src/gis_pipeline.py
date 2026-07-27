#!/usr/bin/env python3
"""
gis_pipeline.py — Pipeline hoàn chỉnh xử lý dữ liệu GIS từ DJI Terra đến Cloud
===================================================================================
Thực hiện 4 bước tự động:
  1. DOM:         TIF (1.4GB) → dom.jpg (web) + metadata.json (tọa độ WGS84)
  2. 3D Model:    OBJ tiles   → model.glb nén Draco (~33MB)
  3. Point Cloud: LAS files   → 3D Tiles (tileset.json + .pnts)
  4. Upload:      Tất cả      → Cloudflare R2 + Tạo Project trên Database

Yêu cầu: Python 3.12+, gltfpack (PATH), py3dtiles, pyproj, Pillow, tifffile, boto3

Chạy:
  py -3.12 gis_pipeline.py <project_folder> <output_folder> [options]

Ví dụ:
  py -3.12 gis_pipeline.py "C:/Users/duong/Web GIS/Vuon_Uom_26062026" "C:/Users/duong/Web GIS/Processed_Output" --epsg 9214 --project-name "Khu Vườn Ươm SHTP" --upload
"""

import os
import sys
import json
import shutil
import struct
import subprocess
import argparse
import requests
from pathlib import Path
from typing import Optional

# ═══════════════════════════════════════════════════════
#   AUTO-INSTALL DEPENDENCIES
# ═══════════════════════════════════════════════════════

REQUIRED = {
    'PIL': 'Pillow',
    'pyproj': 'pyproj',
    'tifffile': 'tifffile',
    'imagecodecs': 'imagecodecs',
    'py3dtiles': 'py3dtiles',
    'boto3': 'boto3',
    'requests': 'requests',
}

def auto_install():
    print("⚙️  Kiểm tra thư viện phụ thuộc...")
    for module, pkg in REQUIRED.items():
        try:
            __import__(module)
            print(f"   ✅ {pkg}")
        except ImportError:
            print(f"   📦 Đang cài {pkg}...")
            subprocess.run([sys.executable, "-m", "pip", "install", pkg, "-q"], check=True)
            print(f"   ✅ {pkg} đã cài xong!")

auto_install()

# Import sau khi đã cài xong
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
from pyproj import Transformer
import tifffile
import boto3
from botocore.config import Config

# ═══════════════════════════════════════════════════════
#   R2 UPLOAD
# ═══════════════════════════════════════════════════════

def get_r2_client():
    """Tạo S3 client trỏ tới Cloudflare R2 từ biến môi trường."""
    endpoint = os.environ.get('R2_ENDPOINT', '')
    access_key = os.environ.get('R2_ACCESS_KEY_ID', '')
    secret_key = os.environ.get('R2_SECRET_ACCESS_KEY', '')

    if not all([endpoint, access_key, secret_key]):
        return None

    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

def upload_to_r2(local_path: Path, r2_key: str, bucket: str, client) -> Optional[str]:
    """Upload một file lên R2, trả về public URL."""
    public_base = os.environ.get('R2_PUBLIC_URL', '')
    size_mb = local_path.stat().st_size / 1024 / 1024
    
    content_types = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.glb': 'model/gltf-binary', '.json': 'application/json',
        '.pnts': 'application/octet-stream',
    }
    content_type = content_types.get(local_path.suffix.lower(), 'application/octet-stream')
    
    print(f"   ☁️  Đang upload: {local_path.name} ({size_mb:.1f} MB) → {r2_key}")
    with open(local_path, 'rb') as f:
        client.put_object(
            Bucket=bucket,
            Key=r2_key,
            Body=f,
            ContentType=content_type
        )
    
    url = f"{public_base}/{r2_key}" if public_base else f"r2://{bucket}/{r2_key}"
    print(f"   ✅ Upload xong: {url}")
    return url

def upload_folder_to_r2(folder: Path, r2_prefix: str, bucket: str, client) -> list[str]:
    """Upload toàn bộ thư mục lên R2 (đệ quy)."""
    urls = []
    for file in sorted(folder.rglob('*')):
        if file.is_file():
            rel = file.relative_to(folder)
            key = f"{r2_prefix}/{rel}".replace('\\', '/')
            url = upload_to_r2(file, key, bucket, client)
            if url:
                urls.append(url)
    return urls


# ═══════════════════════════════════════════════════════
#   STEP 1 — DOM PROCESSING
# ═══════════════════════════════════════════════════════

def find_dom_tif(project: Path) -> Optional[Path]:
    for dom_dir in sorted(project.glob('Results/DOM/*')):
        tiffs = list(dom_dir.glob('*_tdom.tif'))
        if tiffs:
            return tiffs[0]
    return None

def find_tfw(tif_path: Path) -> Optional[Path]:
    tfw = tif_path.with_suffix('.tfw')
    return tfw if tfw.exists() else None

def process_dom(project: Path, output: Path, epsg: int) -> dict:
    """Chuyển TIF → dom.jpg + metadata.json."""
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  BƯỚC 1: Xử lý Ảnh trực giao DOM (TIF → JPG)")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    tif = find_dom_tif(project)
    if not tif:
        print("  ⚠️  Không tìm thấy file TDOM TIF. Bỏ qua.")
        return {}

    print(f"  📂 File nguồn: {tif.name} ({tif.stat().st_size / 1024 / 1024:.0f} MB)")
    out_dir = output / 'dom'
    out_dir.mkdir(parents=True, exist_ok=True)

    # Đọc georeferencing từ .tfw
    tfw = find_tfw(tif)
    xmin, ymin, xmax, ymax = 0, 0, 1, 1
    if tfw:
        lines = tfw.read_text().splitlines()
        pixel_x = float(lines[0])
        pixel_y = float(lines[3])
        x_origin = float(lines[4])
        y_origin = float(lines[5])
        print(f"  📍 Đọc .tfw: origin=({x_origin:.2f}, {y_origin:.2f}), pixel={pixel_x:.4f}m")
    else:
        print("  ⚠️  Không tìm thấy file .tfw!")
        return {}

    # Đọc TIF dùng tifffile để tránh lỗi OOM
    print("  📖 Đang đọc file TIF lớn bằng tifffile...")
    try:
        with tifffile.TiffFile(str(tif)) as tf:
            page = tf.pages[0]
            # Đọc overview nhỏ nhất
            if hasattr(page, 'reduced') and tf.pages[0].subifds is not None:
                arr = tf.pages[0].asarray()
            else:
                # Đọc overview từ level 1 nếu có
                try:
                    arr = tifffile.imread(str(tif), level=1)
                except Exception:
                    arr = tifffile.imread(str(tif))
        
        print(f"  📐 Kích thước ảnh gốc: {arr.shape}")
        img = Image.fromarray(arr)
        orig_w, orig_h = img.size
    except Exception as e:
        print(f"  ❌ Lỗi đọc TIF: {e}")
        return {}

    # Tính toạ độ vùng phủ
    xmax = x_origin + pixel_x * orig_w
    ymax = y_origin  # Góc trên-trái = ymax
    ymin = y_origin + pixel_y * orig_h

    # Chuyển sang WGS84
    if epsg in (9214, 5899, 10575):
        crs_in = "+proj=tmerc +lat_0=0 +lon_0=105.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +units=m +no_defs"
        print(f"  🗺️  Hệ tọa độ: VN2000 TP.HCM (kinh tuyến trục 105.75°)")
    else:
        crs_in = f"EPSG:{epsg}"
        print(f"  🗺️  Hệ tọa độ: EPSG:{epsg}")

    transformer = Transformer.from_crs(crs_in, "EPSG:4326", always_xy=True)
    lon_min, lat_min = transformer.transform(xmin, ymin)
    lon_max, lat_max = transformer.transform(xmax, ymax)
    center_lon = (lon_min + lon_max) / 2
    center_lat = (lat_min + lat_max) / 2

    print(f"  🌍 WGS84 Center: Lon={center_lon:.6f}, Lat={center_lat:.6f}")

    # Resize về độ phân giải web
    max_size = 2048
    img.thumbnail((max_size, max_size), Image.LANCZOS)
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGB')
    
    jpg_path = out_dir / 'dom.jpg'
    img.save(jpg_path, 'JPEG', quality=85, optimize=True)
    print(f"  💾 Đã lưu: dom.jpg ({jpg_path.stat().st_size / 1024:.0f} KB)")

    # Ghi metadata.json
    meta = {
        "west": lon_min, "east": lon_max, "south": lat_min, "north": lat_max,
        "center": [center_lon, center_lat],
        "centerLon": center_lon, "centerLat": center_lat,
        "original_width": orig_w, "original_height": orig_h,
        "pixel_size": abs(pixel_x), "epsg": epsg
    }
    meta_path = out_dir / 'metadata.json'
    meta_path.write_text(json.dumps(meta, indent=2))
    print(f"  💾 Đã lưu: metadata.json")
    print(f"  ✅ DOM hoàn tất!")

    return {"dom_dir": str(out_dir), "center_lon": center_lon, "center_lat": center_lat}


# ═══════════════════════════════════════════════════════
#   STEP 2 — 3D MODEL PROCESSING
# ═══════════════════════════════════════════════════════

def find_obj_files(project: Path) -> list:
    for obj_dir in project.glob('Results/Model/*/OBJ/Data'):
        objs = sorted(obj_dir.rglob('*.obj'))
        if objs:
            return objs
    return []

def process_model(project: Path, output: Path, compress: bool = True, simplify: float = 0.1) -> dict:
    """Merge OBJ tiles → GLB → nén Draco/Meshopt bằng gltfpack."""
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  BƯỚC 2: Xử lý 3D Model (OBJ → GLB nén Draco)")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    objs = find_obj_files(project)
    if not objs:
        print("  ⚠️  Không tìm thấy file OBJ. Bỏ qua.")
        return {}

    print(f"  📂 Tìm thấy {len(objs)} file OBJ tile")
    out_dir = output / 'glb'
    out_dir.mkdir(parents=True, exist_ok=True)

    # Kiểm tra gltfpack
    gltfpack = shutil.which('gltfpack')
    if not gltfpack:
        print("  ❌ Không tìm thấy gltfpack trong PATH!")
        print("  💡 Tải tại: https://github.com/zeux/meshoptimizer/releases")
        return {}

    # Bước 2a: Merge các OBJ tile bằng script Python nội bộ
    merged_obj = out_dir / 'merged.obj'
    print(f"  🔗 Đang merge {len(objs)} tiles...")
    
    vertex_offset = 0
    uv_offset = 0
    normal_offset = 0
    merged_lines = ['# Merged OBJ from GIS pipeline\n']
    mtl_files = set()
    
    for obj_path in objs:
        obj_dir_local = obj_path.parent
        mtl_ref = None
        vertices = []
        uvs = []
        normals = []
        faces = []
        
        for line in obj_path.read_text(errors='ignore').splitlines():
            if line.startswith('mtllib '):
                mtl_file = obj_dir_local / line.split()[1]
                if mtl_file.exists():
                    dest_mtl = out_dir / mtl_file.name
                    if not dest_mtl.exists():
                        shutil.copy2(mtl_file, dest_mtl)
                        # Copy textures
                        for tex_line in mtl_file.read_text(errors='ignore').splitlines():
                            if tex_line.lower().startswith('map_kd'):
                                tex_name = tex_line.split()[-1]
                                tex_src = obj_dir_local / tex_name
                                if tex_src.exists():
                                    shutil.copy2(tex_src, out_dir / tex_name)
                    merged_lines.append(f'mtllib {mtl_file.name}\n')
                    mtl_files.add(mtl_file.name)
            elif line.startswith('v '):
                vertices.append(line)
            elif line.startswith('vt '):
                uvs.append(line)
            elif line.startswith('vn '):
                normals.append(line)
            elif line.startswith('f '):
                # Offset indices
                parts = line.split()[1:]
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
                faces.append('f ' + ' '.join(new_parts) + '\n')
            else:
                merged_lines.append(line + '\n')
        
        merged_lines.extend(vertices)
        merged_lines.extend(uvs)
        merged_lines.extend(normals)
        merged_lines.extend(faces)
        vertex_offset += len(vertices)
        uv_offset += len(uvs)
        normal_offset += len(normals)
    
    merged_obj.write_text(''.join(merged_lines))
    print(f"  ✅ Merge xong: {merged_obj.name}")

    # Bước 2b: Chạy gltfpack
    glb_out = out_dir / 'model.glb'
    cmd = [gltfpack, '-i', str(merged_obj), '-o', str(glb_out)]
    
    if compress:
        cmd += ['-cc']           # compress textures
        cmd += ['-si', str(simplify)]  # simplify ratio
        cmd += ['-sa']           # aggressive simplification
        print(f"  🗜️  Chạy gltfpack (nén Draco, simplify={simplify})...")
    else:
        print(f"  📦 Chạy gltfpack (không nén)...")
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    
    # Dọn merged OBJ tạm
    merged_obj.unlink(missing_ok=True)
    
    if res.returncode != 0:
        print(f"  ❌ gltfpack thất bại: {res.stderr}")
        return {}
    
    size_mb = glb_out.stat().st_size / 1024 / 1024
    print(f"  💾 Đã lưu: model.glb ({size_mb:.1f} MB)")
    print(f"  ✅ 3D Model hoàn tất!")
    return {"model_path": str(glb_out)}


# ═══════════════════════════════════════════════════════
#   STEP 3 — POINT CLOUD PROCESSING (py3dtiles)
# ═══════════════════════════════════════════════════════

def find_las_dir(project: Path) -> Optional[Path]:
    at_dirs = sorted(project.glob('Reconstruction/AT_Temp/AT_*/LasFile/'))
    return at_dirs[-1] if at_dirs else None

def process_pointcloud(project: Path, output: Path, epsg: int) -> dict:
    """Convert LAS → 3D Tiles (Cesium) bằng py3dtiles."""
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  BƯỚC 3: Xử lý Mây điểm (LAS → 3D Tiles)")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    las_dir = find_las_dir(project)
    if not las_dir:
        print("  ⚠️  Không tìm thấy thư mục LAS. Bỏ qua.")
        return {}

    las_files = sorted(las_dir.glob('*.las'))
    if not las_files:
        print("  ⚠️  Thư mục LAS rỗng. Bỏ qua.")
        return {}

    total_mb = sum(f.stat().st_size for f in las_files) / 1024 / 1024
    print(f"  📂 Tìm thấy {len(las_files)} file LAS (tổng ~{total_mb:.0f} MB)")
    print(f"  🗺️  Hệ tọa độ đầu vào: EPSG:{epsg}")
    print(f"  🎯 Hệ tọa độ đầu ra: EPSG:4978 (ECEF cho Cesium)")

    out_dir = output / 'pointcloud'
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Map EPSG đặc biệt (VN2000)
    if epsg in (9214, 5899, 10575):
        # py3dtiles không hiểu VN2000, dùng EPSG:4756 (VN2000) hoặc WGS84 UTM gần nhất
        # Dữ liệu DJI Terra thường xuất LAS ở WGS84 UTM Zone 48N
        srs_in = "EPSG:32648"
        print(f"  ℹ️  Phát hiện VN2000 (EPSG:{epsg}) → dùng EPSG:32648 (UTM 48N) cho LAS")
    else:
        srs_in = f"EPSG:{epsg}"

    # Chạy py3dtiles convert
    cmd = [
        sys.executable, "-m", "py3dtiles", "convert",
        *[str(f) for f in las_files],
        "--outfolder", str(out_dir),
        "--srs-in", srs_in,
        "--srs-out", "EPSG:4978",
        "--jobs", "4",        # Số luồng xử lý song song
    ]

    print(f"  ⏳ Đang chạy py3dtiles (có thể mất 5-30 phút tùy dung lượng)...")
    print(f"  📋 Lệnh: {' '.join(cmd[:6])} ... [{len(las_files)} LAS files]")

    try:
        # Chạy với stream output để hiện log thực tế
        proc = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding='utf-8', errors='replace'
        )
        for line in proc.stdout:
            line = line.rstrip()
            if line:
                print(f"    py3dtiles | {line}")
        proc.wait()

        if proc.returncode == 0:
            tiles = list(out_dir.rglob('*.pnts'))
            tileset = out_dir / 'tileset.json'
            print(f"  ✅ Hoàn tất! {len(tiles)} tile .pnts | tileset.json: {'✅' if tileset.exists() else '❌'}")
            return {"pointcloud_dir": str(out_dir), "tileset_path": str(tileset)}
        else:
            print(f"  ❌ py3dtiles thất bại (exit code: {proc.returncode})")
            return {}
    except FileNotFoundError:
        print("  ❌ Không tìm thấy py3dtiles. Chạy: pip install py3dtiles")
        return {}
    except Exception as e:
        print(f"  ❌ Lỗi: {e}")
        return {}


# ═══════════════════════════════════════════════════════
#   STEP 4 — UPLOAD TO R2 + CREATE DATABASE PROJECT
# ═══════════════════════════════════════════════════════

def upload_and_register(output: Path, project_name: str, description: str, 
                         center_lon: float, center_lat: float, epsg: int, 
                         api_url: str) -> dict:
    """Upload tất cả file lên R2 và tạo/cập nhật Project trên Database."""
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  BƯỚC 4: Upload lên Cloudflare R2")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    client = get_r2_client()
    bucket = os.environ.get('R2_BUCKET_NAME', 'webgis-assets')

    if not client:
        print("  ⚠️  Chưa cấu hình R2. Đặt R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY vào .env")
        return {}

    # Tạo project ID từ tên
    import time
    project_id = f"proj_{int(time.time())}"
    prefix = f"projects/{project_id}"
    
    urls = {}

    # Upload DOM
    dom_jpg = output / 'dom' / 'dom.jpg'
    meta_json = output / 'dom' / 'metadata.json'
    if dom_jpg.exists():
        urls['domUrl'] = upload_to_r2(dom_jpg, f"{prefix}/dom.jpg", bucket, client)
    if meta_json.exists():
        urls['metadataUrl'] = upload_to_r2(meta_json, f"{prefix}/metadata.json", bucket, client)

    # Upload GLB model
    glb = output / 'glb' / 'model.glb'
    if glb.exists():
        urls['modelUrl'] = upload_to_r2(glb, f"{prefix}/model.glb", bucket, client)

    # Upload Point Cloud (3D Tiles folder)
    pc_dir = output / 'pointcloud'
    if pc_dir.exists() and any(pc_dir.rglob('tileset.json')):
        print(f"  ☁️  Đang upload 3D Tiles Point Cloud...")
        upload_folder_to_r2(pc_dir, f"{prefix}/pointcloud", bucket, client)
        public_base = os.environ.get('R2_PUBLIC_URL', '')
        urls['pointCloudUrl'] = f"{public_base}/{prefix}/pointcloud/tileset.json"

    # Tạo Project trong Database
    print(f"\n  💾 Tạo Project trên Database...")
    project_data = {
        "name": project_name,
        "description": description,
        "centerLon": center_lon,
        "centerLat": center_lat,
        "epsg": epsg,
        **urls
    }

    try:
        resp = requests.post(f"{api_url}/api/projects", json=project_data, timeout=10)
        if resp.status_code == 201:
            created = resp.json()
            print(f"  ✅ Tạo Project thành công! ID: {created.get('id')}")
            return {"project": created, "urls": urls}
        else:
            print(f"  ⚠️  API trả về lỗi {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"  ⚠️  Không kết nối được API Backend ({api_url}): {e}")
        print(f"  📋 Dữ liệu cần đưa vào DB thủ công:\n{json.dumps(project_data, indent=2, ensure_ascii=False)}")

    return {"urls": urls}


# ═══════════════════════════════════════════════════════
#   MAIN
# ═══════════════════════════════════════════════════════

def load_env(env_file: Path):
    """Đọc file .env thủ công."""
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, _, val = line.partition('=')
            os.environ.setdefault(key.strip(), val.strip().strip('"\''))

def main():
    parser = argparse.ArgumentParser(
        description="GIS Pipeline: DJI Terra → Web 3D (DOM + Mesh + Point Cloud) → Cloudflare R2"
    )
    parser.add_argument("project_dir", help="Thư mục dự án DJI Terra gốc")
    parser.add_argument("output_dir",  help="Thư mục lưu kết quả xử lý")
    parser.add_argument("--epsg",         type=int,   default=9214,       help="Mã EPSG hệ tọa độ (mặc định: 9214 VN2000 TP.HCM)")
    parser.add_argument("--project-name", type=str,   default="",         help="Tên dự án GIS")
    parser.add_argument("--description",  type=str,   default="",         help="Mô tả dự án")
    parser.add_argument("--simplify",     type=float, default=0.1,        help="Tỉ lệ đơn giản hóa mesh GLB (0.1 = giữ 10%)")
    parser.add_argument("--no-compress",  action="store_true",            help="Không nén Draco GLB")
    parser.add_argument("--skip-dom",     action="store_true",            help="Bỏ qua xử lý DOM")
    parser.add_argument("--skip-model",   action="store_true",            help="Bỏ qua xử lý 3D Model")
    parser.add_argument("--skip-pc",      action="store_true",            help="Bỏ qua xử lý Point Cloud")
    parser.add_argument("--upload",       action="store_true",            help="Upload lên Cloudflare R2 sau khi xử lý")
    parser.add_argument("--api-url",      type=str,   default="http://localhost:3000", help="URL Backend API")
    parser.add_argument("--env",          type=str,   default="",         help="Đường dẫn file .env chứa R2 credentials")
    args = parser.parse_args()

    # Load biến môi trường
    env_path = Path(args.env) if args.env else None
    if env_path and env_path.exists():
        load_env(env_path)
    else:
        # Tìm .env trong các vị trí phổ biến
        for candidate in [
            Path(__file__).parent.parent.parent / 'apps/api/.env',
            Path.cwd() / '.env',
        ]:
            if candidate.exists():
                load_env(candidate)
                print(f"  📋 Đọc .env từ: {candidate}")
                break

    project = Path(args.project_dir)
    output  = Path(args.output_dir)

    if not project.exists():
        print(f"❌ Thư mục dự án không tồn tại: {project}")
        sys.exit(1)

    output.mkdir(parents=True, exist_ok=True)

    proj_name = args.project_name or project.name

    print("=" * 60)
    print("  🚀 GIS PIPELINE — BẮT ĐẦU XỬ LÝ")
    print("=" * 60)
    print(f"  📁 Nguồn   : {project}")
    print(f"  📁 Đích    : {output}")
    print(f"  🗺️  EPSG    : {args.epsg}")
    print(f"  📝 Tên DA  : {proj_name}")
    print(f"  ☁️  Upload  : {'Có' if args.upload else 'Không'}")
    print("=" * 60)

    results = {}
    center_lon, center_lat = 106.80429705, 10.84131575  # fallback

    # Bước 1: DOM
    if not args.skip_dom:
        dom_result = process_dom(project, output, args.epsg)
        results.update(dom_result)
        if dom_result.get('center_lon'):
            center_lon = dom_result['center_lon']
            center_lat = dom_result['center_lat']

    # Bước 2: 3D Model
    if not args.skip_model:
        model_result = process_model(project, output, not args.no_compress, args.simplify)
        results.update(model_result)

    # Bước 3: Point Cloud
    if not args.skip_pc:
        pc_result = process_pointcloud(project, output, args.epsg)
        results.update(pc_result)

    # Bước 4: Upload + Đăng ký vào Database
    if args.upload:
        upload_result = upload_and_register(
            output, proj_name, args.description,
            center_lon, center_lat, args.epsg, args.api_url
        )
        results.update(upload_result)

    # Tổng kết
    print("\n" + "=" * 60)
    print("  🎉 PIPELINE HOÀN TẤT!")
    print("=" * 60)
    dom_jpg = output / 'dom' / 'dom.jpg'
    glb_file = output / 'glb' / 'model.glb'
    pc_dir   = output / 'pointcloud'

    if dom_jpg.exists():
        print(f"  ✅ DOM:         {dom_jpg.name} ({dom_jpg.stat().st_size / 1024:.0f} KB)")
    if glb_file.exists():
        print(f"  ✅ 3D Model:    {glb_file.name} ({glb_file.stat().st_size / 1024 / 1024:.1f} MB)")
    if pc_dir.exists() and any(pc_dir.rglob('tileset.json')):
        tiles = list(pc_dir.rglob('*.pnts'))
        print(f"  ✅ Point Cloud: {len(tiles)} tiles .pnts")
    print("=" * 60)


if __name__ == "__main__":
    main()
