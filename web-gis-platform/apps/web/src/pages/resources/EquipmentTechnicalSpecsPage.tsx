import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import logoImg from '../../assets/logo.webp';
import equipmentX500Image from '../../assets/equipment-x500.jpg';
import equipmentPayloadMountImage from '../../assets/equipment-x500-payload-mount.jpg';

import { SolutionLanguageSwitcher } from '../../components/SolutionLanguageSwitcher';
import { useLanguage, type Language } from '../../hooks/useLanguage';
import { useDemoNavigation } from '../../hooks/useDemoNavigation';

type SpecItem = {
  label: string;
  value: string;
  note?: string;
};

type Copy = {
  languageLabel: string;
  home: string;
  demo: string;

  eyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroBody: string;
  heroNote: string;
  x500Button: string;
  aa6dButton: string;
  heroStats: SpecItem[];

  systemEyebrow: string;
  systemTitle: string;
  systemBody: string;
  x500CardTitle: string;
  x500CardBody: string;
  aa6dCardTitle: string;
  aa6dCardBody: string;

  x500Eyebrow: string;
  x500Title: string;
  x500Body: string;
  x500ImageCaption: string;
  x500Specs: SpecItem[];
  x500Extra: string;

  aa6dEyebrow: string;
  aa6dTitle: string;
  aa6dBody: string;
  aa6dImageCaption: string;
  lidarGroup: string;
  imagingGroup: string;
  aa6dLidarSpecs: SpecItem[];
  aa6dImagingSpecs: SpecItem[];
  aa6dPerformance: SpecItem[];

  pairingEyebrow: string;
  pairingTitle: string;
  pairingBody: string;
  pairingStats: SpecItem[];
  pairingItems: string[];
  pipelineLabels: string[];

  verifiedEyebrow: string;
  verifiedTitle: string;
  verifiedBody: string;
  sourceX500: string;
  sourceAA6D: string;
  verifiedNotes: string[];

  finalEyebrow: string;
  finalTitle: string;
  finalBody: string;
  workflowButton: string;
  footer: string;
};

const COPY: Record<Language, Copy> = {
  vi: {
    languageLabel: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    demo: 'Đăng ký xem Demo',

    eyebrow: 'TÀI NGUYÊN · THIẾT BỊ & THÔNG SỐ KỸ THUẬT',
    heroTitle1: 'CHCNAV X500 +',
    heroTitle2: 'AlphaAir 6 Dual',
    heroBody:
      'Cấu hình UAV + LiDAR phục vụ thu nhận dữ liệu 3D Mapping, gồm nền tảng bay CHCNAV X500 và phiên bản dual-camera AlphaAir 6 Dual (AA6D).',
    heroNote:
      'Thông số trên trang được đối chiếu theo X500 Datasheet Rev. September 2025 và AlphaAir 6 Datasheet Rev. January 2026. Các giá trị “tối đa” và giá trị thử nghiệm được ghi kèm điều kiện quan trọng.',
    x500Button: 'Thông số X500',
    aa6dButton: 'Thông số AA6D',
    heroStats: [
      { label: 'Tải trọng X500', value: '5 kg max.' },
      { label: 'X500 @ 2 kg', value: '52 phút', note: 'thời gian bay tham chiếu' },
      { label: 'AA6D max. range', value: '2.100 m', note: '100 kHz · ρ > 80%' },
      { label: 'AA6D scan rate', value: '2M pts/s', note: 'tối đa' },
    ],

    systemEyebrow: 'CẤU HÌNH THIẾT BỊ',
    systemTitle: 'Tách rõ nền tảng bay và hệ thống LiDAR',
    systemBody:
      'X500 đảm nhiệm nền tảng bay và khả năng mang tải. AA6D tích hợp laser scanner, GNSS/IMU và hai cảm biến APS-C để thu Point Cloud và ảnh RGB trong cùng payload.',
    x500CardTitle: 'CHCNAV X500',
    x500CardBody:
      'Quadcopter 4 cánh · tải trọng tối đa 5 kg · 58 phút không tải / 52 phút với 2 kg / 40 phút với 4 kg · IP55.',
    aa6dCardTitle: 'CHCNAV AlphaAir 6 Dual (AA6D)',
    aa6dCardBody:
      'LiDAR hàng không dual-camera · 1,85 kg · tầm đo tối đa 2.100 m · scan rate tới 2.000.000 pts/s · APS-C 26 MP × 2.',

    x500Eyebrow: 'NỀN TẢNG BAY',
    x500Title: 'CHCNAV X500',
    x500Body:
      'UAV quadcopter chuyên nghiệp với tải trọng tối đa 5 kg. Datasheet công bố ba mốc thời gian bay theo tải trọng: 58 phút không tải, 52 phút với 2 kg và 40 phút với 4 kg.',
    x500ImageCaption: 'Cụm thân X500 và khu vực tích hợp payload',
    x500Specs: [
      { label: 'Cấu hình', value: 'Quadcopter · 4 propellers' },
      { label: 'Tải trọng tối đa', value: '5 kg' },
      { label: 'Bay · không payload', value: '58 phút', note: 'maximum flight time' },
      { label: 'Bay · payload 2 kg', value: '52 phút', note: 'maximum flight time' },
      { label: 'Bay · payload 4 kg', value: '40 phút', note: 'maximum flight time' },
      { label: 'Tốc độ tối đa', value: '23 m/s' },
      { label: 'Lên / xuống tối đa', value: '8 / 6 m/s' },
      { label: 'RTK FIX', value: '1 cm ± 1 ppm H', note: '1,5 cm ± 1 ppm V' },
      { label: 'Obstacle detection', value: '80 m', note: 'forward sensor' },
      { label: 'Bảo vệ', value: 'IP55' },
      { label: 'Nhiệt độ vận hành', value: '-20°C đến +50°C' },
      { label: 'Payload đồng thời', value: 'Tới 3' },
      { label: 'Truyền tín hiệu', value: 'Tới 20 km', note: 'datasheet maximum transmission distance' },
      { label: 'GNSS', value: 'GPS · GLONASS · BeiDou · Galileo' },
    ],
    x500Extra:
      'Điều kiện datasheet: thời gian bay được đo khi X500 bay khoảng 10 m/s trong môi trường không gió đến khi pin về 0%. Thời gian thực tế có thể thay đổi theo chế độ bay, phụ kiện và môi trường. IP55 được thử nghiệm trong điều kiện kiểm soát và có thể suy giảm theo hao mòn sản phẩm.',

    aa6dEyebrow: 'PAYLOAD LiDAR',
    aa6dTitle: 'AlphaAir 6 Dual (AA6D)',
    aa6dBody:
      'AA6D là phiên bản dual-camera trong dòng AlphaAir 6. Hệ thống tích hợp laser scanner 1535 nm, GNSS, IMU 500 Hz và hai camera APS-C CMOS 26 MP.',
    aa6dImageCaption: 'CHCNAV AlphaAir 6 Dual trên nền tảng X500',
    lidarGroup: 'Laser Scanner / Positioning',
    imagingGroup: 'Imaging / Physical',
    aa6dLidarSpecs: [
      { label: 'Max. range · ρ > 80%', value: '2.100 m', note: '@ 100 kHz PRR' },
      { label: 'Max. range · ρ > 10%', value: '960 m', note: '@ 100 kHz PRR' },
      { label: 'Minimum range', value: '10 m' },
      { label: 'Maximum scan rate', value: '2.000.000 pts/s' },
      { label: 'Laser accuracy', value: '±15 mm', note: 'specific CHCNAV test conditions' },
      { label: 'Laser precision', value: '5 mm · 1σ', note: 'specific CHCNAV test conditions' },
      { label: 'LiDAR FOV', value: '90°' },
      { label: 'Scan speed', value: '400 lines/s' },
      { label: 'Returns', value: 'Tới 16' },
      { label: 'Multi-period', value: 'Tới 7 zones' },
      { label: 'Wavelength', value: '1535 nm' },
      { label: 'IMU update rate', value: '500 Hz' },
      { label: 'Post-process position', value: '1 cm + 1 ppm H', note: '1,5 cm + 1 ppm V' },
      { label: 'Post-process attitude', value: '0,006° pitch/roll', note: '0,015° heading · RMS · 1σ' },
      { label: 'GNSS', value: 'GPS · GLONASS · BeiDou · Galileo' },
    ],
    aa6dImagingSpecs: [
      { label: 'Camera', value: 'APS-C CMOS × 2' },
      { label: 'Resolution', value: '26 MP × 2' },
      { label: 'Pixel', value: '6252 × 4168' },
      { label: 'Imaging FOV', value: '110°' },
      { label: 'Focal length', value: '16 mm' },
      { label: 'Min. trigger interval', value: '1 s' },
      { label: 'Weight', value: '1,85 kg' },
      { label: 'Dimensions', value: '223,5 × 127,6 × 129 mm' },
      { label: 'Storage', value: '512 GB' },
      { label: 'Protection', value: 'IP64' },
      { label: 'Max. power', value: '60 W' },
      { label: 'Input voltage', value: '24 V', note: '17–30 V range' },
      { label: 'Operating temperature', value: '-20°C đến +50°C' },
    ],
    aa6dPerformance: [
      { label: '120 m AGL', value: '1.000.000 pts/s', note: '220 pts/m²' },
      { label: '400 m AGL', value: '200.000 pts/s', note: '13 pts/m²' },
      { label: 'Typical AGL', value: '100–600 m', note: 'reference operating altitude' },
    ],

    pairingEyebrow: 'X500 + AA6D',
    pairingTitle: 'Đối chiếu AA6D với khả năng mang tải của X500',
    pairingBody:
      'Hai datasheet xác nhận AA6/AA6D có giao diện mở cho UAV multirotor và fixed-wing; tài liệu AlphaAir 6 cũng minh họa triển khai trên X500. Không có thông số chính thức trong hai datasheet cho phép khẳng định thời gian bay cố định của riêng cấu hình X500 + AA6D.',
    pairingStats: [
      { label: 'AA6D weight', value: '1,85 kg', note: 'datasheet AA6D' },
      { label: 'X500 max. payload', value: '5 kg', note: 'datasheet X500' },
      { label: 'X500 @ 2 kg', value: '52 phút', note: 'X500 reference · không phải AA6D guarantee' },
    ],
    pairingItems: [
      'AA6D hỗ trợ giao diện mở và tương thích với nền tảng UAV multirotor / fixed-wing.',
      'X500 hỗ trợ tối đa ba payload đồng thời; danh sách payload được CHCNAV cập nhật theo tài liệu hỗ trợ.',
      '52 phút là mốc X500 với payload 2 kg trong điều kiện thử nghiệm của X500, không được diễn giải thành thời gian bay bảo đảm của AA6D.',
      'Dữ liệu LiDAR có thể được tiền xử lý bằng CoPre; datasheet nêu POS solve, Adjust & Refine và Generate point cloud.',
    ],
    pipelineLabels: ['X500', 'AA6D', 'CoPre', 'Point Cloud + RGB'],

    verifiedEyebrow: 'ĐỐI CHIẾU DATASHEET',
    verifiedTitle: 'Thông số được cập nhật theo tài liệu CHCNAV mới được cung cấp',
    verifiedBody:
      'Trang này sử dụng X500 Datasheet Revision September 2025 và AlphaAir 6 Datasheet Revision January 2026 làm nguồn dữ liệu chính.',
    sourceX500: 'X500 Datasheet · Rev. Sep 2025',
    sourceAA6D: 'AlphaAir 6 Datasheet · Rev. Jan 2026',
    verifiedNotes: [
      'X500: 58 phút không tải, 52 phút với payload 2 kg và 40 phút với payload 4 kg. Datasheet ghi rõ đây là kết quả thử nghiệm tham chiếu và thời gian thực tế có thể thay đổi.',
      'AA6D: 2.100 m là maximum range tại 100 kHz PRR với mục tiêu có reflectivity > 80%; range giảm khi PRR tăng hoặc reflectivity thấp hơn.',
      'AA6D phân biệt laser accuracy ±15 mm, laser precision 5 mm 1σ và post-processing position accuracy 1 cm + 1 ppm H / 1,5 cm + 1 ppm V. Không gộp các khái niệm này thành một claim “độ chính xác LiDAR”.',
    ],

    finalEyebrow: 'UAV · LiDAR · 3D MAPPING',
    finalTitle: 'Xem thiết bị trong toàn bộ quy trình 3D Mapping',
    finalBody:
      'Tiếp tục sang workflow để xem khảo sát hiện trường, mission planning, điểm khống chế, xử lý dữ liệu và Web GIS được nối với nhau.',
    workflowButton: 'Xem quy trình 3D Mapping',
    footer: 'Technical Equipment · X500 · AA6D',
  },

  en: {
    languageLabel: 'Select language',
    home: 'Home',
    demo: 'Request Demo',

    eyebrow: 'RESOURCES · EQUIPMENT & TECHNICAL SPECIFICATIONS',
    heroTitle1: 'CHCNAV X500 +',
    heroTitle2: 'AlphaAir 6 Dual',
    heroBody:
      'A UAV + LiDAR capture configuration for 3D Mapping, combining the CHCNAV X500 flight platform with the dual-camera AlphaAir 6 Dual (AA6D).',
    heroNote:
      'Specifications are aligned with the X500 Datasheet Rev. September 2025 and AlphaAir 6 Datasheet Rev. January 2026. Maximum and test-condition values retain their important conditions.',
    x500Button: 'X500 specifications',
    aa6dButton: 'AA6D specifications',
    heroStats: [
      { label: 'X500 payload', value: '5 kg max.' },
      { label: 'X500 @ 2 kg', value: '52 min', note: 'reference flight time' },
      { label: 'AA6D max. range', value: '2,100 m', note: '100 kHz · ρ > 80%' },
      { label: 'AA6D scan rate', value: '2M pts/s', note: 'maximum' },
    ],

    systemEyebrow: 'SYSTEM CONFIGURATION',
    systemTitle: 'Flight platform and LiDAR system, clearly separated',
    systemBody:
      'X500 provides the flight platform and payload capacity. AA6D integrates the laser scanner, GNSS/IMU and dual APS-C sensors to capture Point Cloud and RGB imagery in one payload.',
    x500CardTitle: 'CHCNAV X500',
    x500CardBody:
      'Four-propeller quadcopter · 5 kg max payload · 58 min no payload / 52 min with 2 kg / 40 min with 4 kg · IP55.',
    aa6dCardTitle: 'CHCNAV AlphaAir 6 Dual (AA6D)',
    aa6dCardBody:
      'Dual-camera airborne LiDAR · 1.85 kg · maximum range 2,100 m · up to 2,000,000 pts/s · dual APS-C 26 MP × 2.',

    x500Eyebrow: 'FLIGHT PLATFORM',
    x500Title: 'CHCNAV X500',
    x500Body:
      'A professional quadcopter UAV with a maximum 5 kg payload. The datasheet specifies three flight-time references by payload: 58 minutes with no payload, 52 minutes with 2 kg and 40 minutes with 4 kg.',
    x500ImageCaption: 'X500 airframe and payload integration area',
    x500Specs: [
      { label: 'Structure', value: 'Quadcopter · 4 propellers' },
      { label: 'Max. payload', value: '5 kg' },
      { label: 'Flight · no payload', value: '58 min', note: 'maximum flight time' },
      { label: 'Flight · 2 kg payload', value: '52 min', note: 'maximum flight time' },
      { label: 'Flight · 4 kg payload', value: '40 min', note: 'maximum flight time' },
      { label: 'Max. speed', value: '23 m/s' },
      { label: 'Max. ascent / descent', value: '8 / 6 m/s' },
      { label: 'RTK FIX', value: '1 cm ± 1 ppm H', note: '1.5 cm ± 1 ppm V' },
      { label: 'Obstacle detection', value: '80 m', note: 'forward sensor' },
      { label: 'Protection', value: 'IP55' },
      { label: 'Operating temperature', value: '-20°C to +50°C' },
      { label: 'Concurrent payloads', value: 'Up to 3' },
      { label: 'Transmission', value: 'Up to 20 km', note: 'datasheet maximum transmission distance' },
      { label: 'GNSS', value: 'GPS · GLONASS · BeiDou · Galileo' },
    ],
    x500Extra:
      'Datasheet condition: flight time was measured at approximately 10 m/s in a windless environment until battery level reached 0%. Actual usage time may vary with flight mode, accessories and environmental conditions. IP55 was tested under controlled conditions and may decrease with product wear.',

    aa6dEyebrow: 'LiDAR PAYLOAD',
    aa6dTitle: 'AlphaAir 6 Dual (AA6D)',
    aa6dBody:
      'AA6D is the dual-camera version in the AlphaAir 6 family. It integrates a 1535 nm laser scanner, GNSS, a 500 Hz IMU and two 26 MP APS-C CMOS cameras.',
    aa6dImageCaption: 'CHCNAV AlphaAir 6 Dual on the X500 platform',
    lidarGroup: 'Laser Scanner / Positioning',
    imagingGroup: 'Imaging / Physical',
    aa6dLidarSpecs: [
      { label: 'Max. range · ρ > 80%', value: '2,100 m', note: '@ 100 kHz PRR' },
      { label: 'Max. range · ρ > 10%', value: '960 m', note: '@ 100 kHz PRR' },
      { label: 'Minimum range', value: '10 m' },
      { label: 'Maximum scan rate', value: '2,000,000 pts/s' },
      { label: 'Laser accuracy', value: '±15 mm', note: 'specific CHCNAV test conditions' },
      { label: 'Laser precision', value: '5 mm · 1σ', note: 'specific CHCNAV test conditions' },
      { label: 'LiDAR FOV', value: '90°' },
      { label: 'Scan speed', value: '400 lines/s' },
      { label: 'Returns', value: 'Up to 16' },
      { label: 'Multi-period', value: 'Up to 7 zones' },
      { label: 'Wavelength', value: '1535 nm' },
      { label: 'IMU update rate', value: '500 Hz' },
      { label: 'Post-process position', value: '1 cm + 1 ppm H', note: '1.5 cm + 1 ppm V' },
      { label: 'Post-process attitude', value: '0.006° pitch/roll', note: '0.015° heading · RMS · 1σ' },
      { label: 'GNSS', value: 'GPS · GLONASS · BeiDou · Galileo' },
    ],
    aa6dImagingSpecs: [
      { label: 'Camera', value: 'APS-C CMOS × 2' },
      { label: 'Resolution', value: '26 MP × 2' },
      { label: 'Pixel', value: '6252 × 4168' },
      { label: 'Imaging FOV', value: '110°' },
      { label: 'Focal length', value: '16 mm' },
      { label: 'Min. trigger interval', value: '1 s' },
      { label: 'Weight', value: '1.85 kg' },
      { label: 'Dimensions', value: '223.5 × 127.6 × 129 mm' },
      { label: 'Storage', value: '512 GB' },
      { label: 'Protection', value: 'IP64' },
      { label: 'Max. power', value: '60 W' },
      { label: 'Input voltage', value: '24 V', note: '17–30 V range' },
      { label: 'Operating temperature', value: '-20°C to +50°C' },
    ],
    aa6dPerformance: [
      { label: '120 m AGL', value: '1,000,000 pts/s', note: '220 pts/m²' },
      { label: '400 m AGL', value: '200,000 pts/s', note: '13 pts/m²' },
      { label: 'Typical AGL', value: '100–600 m', note: 'reference operating altitude' },
    ],

    pairingEyebrow: 'X500 + AA6D',
    pairingTitle: 'AA6D checked against the X500 payload envelope',
    pairingBody:
      'The two datasheets confirm open-interface compatibility with multirotor and fixed-wing UAVs, and the AlphaAir 6 material illustrates deployment on the X500. The supplied datasheets do not provide an official fixed endurance figure specifically for the X500 + AA6D configuration.',
    pairingStats: [
      { label: 'AA6D weight', value: '1.85 kg', note: 'AA6D datasheet' },
      { label: 'X500 max. payload', value: '5 kg', note: 'X500 datasheet' },
      { label: 'X500 @ 2 kg', value: '52 min', note: 'X500 reference · not an AA6D guarantee' },
    ],
    pairingItems: [
      'AA6D provides open interfaces and compatibility with multirotor and fixed-wing UAV platforms.',
      'X500 supports up to three simultaneous payloads; supported payload lists are maintained in CHCNAV documentation.',
      'The 52-minute figure is the X500 result with a 2 kg payload under X500 test conditions and is not an AA6D endurance guarantee.',
      'LiDAR data can be pre-processed with CoPre; the datasheet lists POS solve, Adjust & Refine and Generate point cloud.',
    ],
    pipelineLabels: ['X500', 'AA6D', 'CoPre', 'Point Cloud + RGB'],

    verifiedEyebrow: 'DATASHEET VERIFIED',
    verifiedTitle: 'Specifications updated from the supplied CHCNAV documents',
    verifiedBody:
      'This page uses the X500 Datasheet Revision September 2025 and AlphaAir 6 Datasheet Revision January 2026 as its primary data sources.',
    sourceX500: 'X500 Datasheet · Rev. Sep 2025',
    sourceAA6D: 'AlphaAir 6 Datasheet · Rev. Jan 2026',
    verifiedNotes: [
      'X500: 58 minutes with no payload, 52 minutes with a 2 kg payload and 40 minutes with a 4 kg payload. The datasheet states these are reference test results and actual time may vary.',
      'AA6D: 2,100 m is the maximum range at 100 kHz PRR for a target with reflectivity > 80%; range decreases as PRR increases or target reflectivity falls.',
      'AA6D separately specifies laser accuracy ±15 mm, laser precision 5 mm 1σ and post-processing position accuracy of 1 cm + 1 ppm H / 1.5 cm + 1 ppm V. These should not be merged into one generic “LiDAR accuracy” claim.',
    ],

    finalEyebrow: 'UAV · LiDAR · 3D MAPPING',
    finalTitle: 'See the equipment inside the complete 3D Mapping workflow',
    finalBody:
      'Continue to the workflow to see field survey, mission planning, control points, processing and Web GIS connected in one pipeline.',
    workflowButton: 'View 3D Mapping workflow',
    footer: 'Technical Equipment · X500 · AA6D',
  },

  zh: {
    languageLabel: '选择语言',
    home: '首页',
    demo: '申请演示',

    eyebrow: '资源 · 设备与技术规格',
    heroTitle1: 'CHCNAV X500 +',
    heroTitle2: 'AlphaAir 6 Dual',
    heroBody:
      '用于三维建图数据采集的 UAV + LiDAR 配置，由 CHCNAV X500 飞行平台与 AlphaAir 6 Dual（AA6D）双相机版本组成。',
    heroNote:
      '页面规格依据 X500 Datasheet Rev. September 2025 与 AlphaAir 6 Datasheet Rev. January 2026 更新，并保留最大值与测试值的重要条件。',
    x500Button: 'X500 规格',
    aa6dButton: 'AA6D 规格',
    heroStats: [
      { label: 'X500 最大载荷', value: '5 kg' },
      { label: 'X500 @ 2 kg', value: '52 分钟', note: '参考飞行时间' },
      { label: 'AA6D 最大测距', value: '2,100 m', note: '100 kHz · ρ > 80%' },
      { label: 'AA6D 扫描率', value: '2M pts/s', note: '最大值' },
    ],

    systemEyebrow: '系统配置',
    systemTitle: '明确区分飞行平台与 LiDAR 系统',
    systemBody:
      'X500 提供飞行平台与载荷能力；AA6D 集成激光扫描器、GNSS/IMU 和双 APS-C 传感器，在同一载荷中获取点云与 RGB 影像。',
    x500CardTitle: 'CHCNAV X500',
    x500CardBody:
      '四旋翼 · 最大载荷 5 kg · 无载荷 58 分钟 / 2 kg 载荷 52 分钟 / 4 kg 载荷 40 分钟 · IP55。',
    aa6dCardTitle: 'CHCNAV AlphaAir 6 Dual (AA6D)',
    aa6dCardBody:
      '双相机机载 LiDAR · 1.85 kg · 最大测距 2,100 m · 最高 2,000,000 pts/s · 双 APS-C 26 MP × 2。',

    x500Eyebrow: '飞行平台',
    x500Title: 'CHCNAV X500',
    x500Body:
      '专业四旋翼 UAV，最大载荷 5 kg。Datasheet 给出三个载荷条件下的飞行时间：无载荷 58 分钟、2 kg 载荷 52 分钟、4 kg 载荷 40 分钟。',
    x500ImageCaption: 'X500 机体与载荷集成区域',
    x500Specs: [
      { label: '结构', value: '四旋翼 · 4 桨' },
      { label: '最大载荷', value: '5 kg' },
      { label: '飞行 · 无载荷', value: '58 分钟', note: 'maximum flight time' },
      { label: '飞行 · 2 kg 载荷', value: '52 分钟', note: 'maximum flight time' },
      { label: '飞行 · 4 kg 载荷', value: '40 分钟', note: 'maximum flight time' },
      { label: '最大速度', value: '23 m/s' },
      { label: '最大上升 / 下降', value: '8 / 6 m/s' },
      { label: 'RTK FIX', value: '1 cm ± 1 ppm H', note: '1.5 cm ± 1 ppm V' },
      { label: '避障范围', value: '80 m', note: '前向传感器' },
      { label: '防护等级', value: 'IP55' },
      { label: '工作温度', value: '-20°C 至 +50°C' },
      { label: '同时载荷', value: '最多 3 个' },
      { label: '传输距离', value: '最高 20 km', note: 'datasheet maximum transmission distance' },
      { label: 'GNSS', value: 'GPS · GLONASS · BeiDou · Galileo' },
    ],
    x500Extra:
      'Datasheet 条件：飞行时间在无风环境、约 10 m/s 飞行速度下测得，直到电池电量达到 0%。实际使用时间会因飞行模式、附件和环境而变化。IP55 在受控条件下测试，并可能随产品磨损而降低。',

    aa6dEyebrow: 'LiDAR 载荷',
    aa6dTitle: 'AlphaAir 6 Dual (AA6D)',
    aa6dBody:
      'AA6D 是 AlphaAir 6 系列的双相机版本，集成 1535 nm 激光扫描器、GNSS、500 Hz IMU 和两颗 26 MP APS-C CMOS 相机。',
    aa6dImageCaption: 'CHCNAV AlphaAir 6 Dual 搭载于 X500',
    lidarGroup: '激光扫描 / 定位',
    imagingGroup: '成像 / 物理规格',
    aa6dLidarSpecs: [
      { label: '最大测距 · ρ > 80%', value: '2,100 m', note: '@ 100 kHz PRR' },
      { label: '最大测距 · ρ > 10%', value: '960 m', note: '@ 100 kHz PRR' },
      { label: '最小测距', value: '10 m' },
      { label: '最大扫描率', value: '2,000,000 pts/s' },
      { label: '激光 Accuracy', value: '±15 mm', note: 'CHCNAV 特定测试条件' },
      { label: '激光 Precision', value: '5 mm · 1σ', note: 'CHCNAV 特定测试条件' },
      { label: 'LiDAR FOV', value: '90°' },
      { label: '扫描速度', value: '400 lines/s' },
      { label: '回波数', value: '最多 16' },
      { label: 'Multi-period', value: '最多 7 zones' },
      { label: '波长', value: '1535 nm' },
      { label: 'IMU 更新率', value: '500 Hz' },
      { label: '后处理位置精度', value: '1 cm + 1 ppm H', note: '1.5 cm + 1 ppm V' },
      { label: '后处理姿态精度', value: '0.006° pitch/roll', note: '0.015° heading · RMS · 1σ' },
      { label: 'GNSS', value: 'GPS · GLONASS · BeiDou · Galileo' },
    ],
    aa6dImagingSpecs: [
      { label: '相机', value: 'APS-C CMOS × 2' },
      { label: '分辨率', value: '26 MP × 2' },
      { label: '像素', value: '6252 × 4168' },
      { label: '成像 FOV', value: '110°' },
      { label: '焦距', value: '16 mm' },
      { label: '最小触发间隔', value: '1 s' },
      { label: '重量', value: '1.85 kg' },
      { label: '尺寸', value: '223.5 × 127.6 × 129 mm' },
      { label: '存储', value: '512 GB' },
      { label: '防护等级', value: 'IP64' },
      { label: '最大功耗', value: '60 W' },
      { label: '输入电压', value: '24 V', note: '17–30 V 范围' },
      { label: '工作温度', value: '-20°C 至 +50°C' },
    ],
    aa6dPerformance: [
      { label: '120 m AGL', value: '1,000,000 pts/s', note: '220 pts/m²' },
      { label: '400 m AGL', value: '200,000 pts/s', note: '13 pts/m²' },
      { label: '典型 AGL', value: '100–600 m', note: '参考运行高度' },
    ],

    pairingEyebrow: 'X500 + AA6D',
    pairingTitle: '将 AA6D 与 X500 的载荷能力进行对照',
    pairingBody:
      '两份 Datasheet 确认 AlphaAir 6 系列提供开放接口并兼容多旋翼与固定翼 UAV，AlphaAir 6 资料也展示了在 X500 上的部署。所提供的资料没有给出 X500 + AA6D 组合专属的固定续航数值。',
    pairingStats: [
      { label: 'AA6D 重量', value: '1.85 kg', note: 'AA6D datasheet' },
      { label: 'X500 最大载荷', value: '5 kg', note: 'X500 datasheet' },
      { label: 'X500 @ 2 kg', value: '52 分钟', note: 'X500 参考值 · 不是 AA6D 保证值' },
    ],
    pairingItems: [
      'AA6D 提供开放接口，并兼容多旋翼与固定翼 UAV 平台。',
      'X500 支持最多三个载荷同时工作；支持的载荷清单以 CHCNAV 最新文档为准。',
      '52 分钟是 X500 在 2 kg 载荷条件下的测试结果，不应解释为 AA6D 的保证续航。',
      'LiDAR 数据可使用 CoPre 进行预处理；Datasheet 列出 POS solve、Adjust & Refine 与 Generate point cloud。',
    ],
    pipelineLabels: ['X500', 'AA6D', 'CoPre', 'Point Cloud + RGB'],

    verifiedEyebrow: 'DATASHEET 核对',
    verifiedTitle: '规格已按提供的 CHCNAV 文档更新',
    verifiedBody:
      '本页面以 X500 Datasheet Revision September 2025 与 AlphaAir 6 Datasheet Revision January 2026 为主要数据来源。',
    sourceX500: 'X500 Datasheet · Rev. Sep 2025',
    sourceAA6D: 'AlphaAir 6 Datasheet · Rev. Jan 2026',
    verifiedNotes: [
      'X500：无载荷 58 分钟、2 kg 载荷 52 分钟、4 kg 载荷 40 分钟。Datasheet 明确说明这些是参考测试结果，实际时间可能变化。',
      'AA6D：2,100 m 是 100 kHz PRR、目标反射率 > 80% 时的最大测距；随着 PRR 增加或目标反射率降低，测距会下降。',
      'AA6D 分别给出激光 Accuracy ±15 mm、激光 Precision 5 mm 1σ，以及后处理位置精度 1 cm + 1 ppm H / 1.5 cm + 1 ppm V，不应合并成一个笼统的“LiDAR 精度”指标。',
    ],

    finalEyebrow: 'UAV · LiDAR · 3D MAPPING',
    finalTitle: '在完整三维建图流程中查看这些设备',
    finalBody:
      '继续查看工作流程，了解现场测绘、任务规划、控制点、数据处理与 Web GIS 如何连接。',
    workflowButton: '查看 3D Mapping 流程',
    footer: 'Technical Equipment · X500 · AA6D',
  },
};

const AA6D_OFFICIAL_IMAGE =
  'https://geospatial.chcnav.com/dam/jcr%3A36fcdacf-09de-4e72-9dd4-88c1641e91c8/alphaair6-dual-forest-canopy-lidar-survey-x500-uav.jpg';



const THEME_STORAGE_KEY = 'saolatek_theme';

const THEME_COPY: Record<
  Language,
  {
    switchToLight: string;
    switchToDark: string;
    demoLoading: string;
  }
> = {
  vi: {
    switchToLight: 'Chuyển sang giao diện sáng',
    switchToDark: 'Chuyển sang giao diện tối',
    demoLoading: 'Đang kiểm tra Demo...',
  },
  en: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    demoLoading: 'Checking Demo...',
  },
  zh: {
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    demoLoading: '正在检查 Demo...',
  },
};

const readInitialTheme = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const saved =
    window.localStorage.getItem(
      THEME_STORAGE_KEY
    );

  if (saved === 'light') return false;
  if (saved === 'dark') return true;

  return true;
};

const SpecRows: React.FC<{
  items: SpecItem[];
}> = ({ items }) => (
  <dl className="border-t border-[var(--eq-border)]">
    {items.map((item) => (
      <div
        key={`${item.label}-${item.value}`}
        className="grid grid-cols-[minmax(120px,.85fr)_minmax(0,1.15fr)] gap-5 border-b border-[var(--eq-border)] py-4 sm:grid-cols-[minmax(160px,.85fr)_minmax(0,1.15fr)]"
      >
        <dt className="text-[11px] font-semibold uppercase tracking-[.07em] text-[var(--eq-soft)]">
          {item.label}
        </dt>

        <dd className="min-w-0 text-right">
          <div className="text-sm font-semibold leading-5 text-[var(--eq-ink)]">
            {item.value}
          </div>

          {item.note && (
            <div className="mt-1 text-[11px] leading-4 text-[var(--eq-soft)]">
              {item.note}
            </div>
          )}
        </dd>
      </div>
    ))}
  </dl>
);

/*
 * Hallmark
 * component: equipment-technical-specs-page
 * genre: technical-datasheet / equipment-dossier
 * theme: saolatek-product-dna
 * visual-anchor: X500 + AA6D hardware
 * density: high
 *
 * layout:
 * - equipment hero
 * - system pairing overview
 * - X500 specification sheet
 * - AA6D specification sheet
 * - compatibility envelope
 * - datasheet verification
 * - compact workflow CTA
 *
 * content:
 * - preserve supplied datasheet values and conditions
 * - keep X500 and AA6D claims separated
 * - no decorative numbering / badges / feature icons
 */

export const EquipmentTechnicalSpecsPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    currentLang,
    setCurrentLang,
  } = useLanguage('vi');

  const {
    openDemo,
    isDemoLoading,
  } = useDemoNavigation();

  const [
    isDarkMode,
    setIsDarkMode,
  ] = useState(readInitialTheme);

  const c = COPY[currentLang];
  const themeCopy = THEME_COPY[currentLang];

  useEffect(() => {
    const theme =
      isDarkMode ? 'dark' : 'light';

    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      theme
    );

    document.documentElement.dataset.saolatekTheme =
      theme;
  }, [isDarkMode]);

  useEffect(() => {
    const handleStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key !==
        THEME_STORAGE_KEY
      ) {
        return;
      }

      if (event.newValue === 'dark') {
        setIsDarkMode(true);
      }

      if (event.newValue === 'light') {
        setIsDarkMode(false);
      }
    };

    window.addEventListener(
      'storage',
      handleStorage
    );

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const themeLabel =
    isDarkMode
      ? themeCopy.switchToLight
      : themeCopy.switchToDark;

  return (
    <>
      <style>{`
        .eq-root {
          --eq-bg: #050914;
          --eq-bg-2: #07101c;
          --eq-surface: #0b1523;

          --eq-ink: #f8fafc;
          --eq-muted: #94a3b8;
          --eq-soft: #64748b;

          --eq-border: rgba(255,255,255,.09);
          --eq-border-strong: rgba(255,255,255,.16);

          --eq-accent: #38bdf8;
          --eq-accent-strong: #0ea5e9;
          --eq-cta-ink: #03111d;

          --eq-header: rgba(5,9,20,.88);
          --eq-shadow: 0 26px 80px rgba(0,0,0,.34);

          color-scheme: dark;
        }

        .eq-root.eq-light {
          --eq-bg: #f8fafc;
          --eq-bg-2: #eef4f8;
          --eq-surface: #ffffff;

          --eq-ink: #0f172a;
          --eq-muted: #526174;
          --eq-soft: #64748b;

          --eq-border: rgba(15,23,42,.11);
          --eq-border-strong: rgba(15,23,42,.20);

          --eq-accent: #0369a1;
          --eq-accent-strong: #0284c7;
          --eq-cta-ink: #ffffff;

          --eq-header: rgba(248,250,252,.90);
          --eq-shadow: 0 24px 65px rgba(15,23,42,.14);

          color-scheme: light;
        }

        .eq-root {
          min-height: 100vh;
          overflow-x: clip;
          background: var(--eq-bg);
          color: var(--eq-ink);
          transition:
            background-color .22s ease,
            color .22s ease;
        }

        .eq-header {
          background: var(--eq-header);
        }

        .eq-media {
          box-shadow: var(--eq-shadow);
        }

        .eq-focus:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px var(--eq-bg),
            0 0 0 4px var(--eq-accent);
        }

        .eq-theme-toggle {
          position: relative;
          width: 76px;
          height: 32px;
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 0;
          cursor: pointer;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,.20);
          background:
            linear-gradient(
              180deg,
              #2a80f1 0%,
              #70a7ff 100%
            );
          box-shadow:
            inset 0 2px 4px rgba(0,0,0,.10),
            0 1px 2px rgba(255,255,255,.05);
          transition:
            background .4s cubic-bezier(.16,1,.3,1),
            border-color .4s cubic-bezier(.16,1,.3,1);
        }

        .eq-theme-toggle:focus-visible {
          outline: 2px solid var(--eq-accent);
          outline-offset: 3px;
        }

        .eq-theme-toggle.is-dark {
          background:
            linear-gradient(
              180deg,
              #0b1022 0%,
              #19213d 100%
            );
          border-color: rgba(255,255,255,.10);
        }

        .eq-theme-toggle__thumb {
          position: absolute;
          left: 4px;
          top: 4px;
          width: 24px;
          height: 24px;
          z-index: 3;
          border-radius: 50%;
          background: #ffd34e;
          box-shadow:
            0 0 10px rgba(255,211,78,.75);
          transition:
            transform .4s cubic-bezier(.16,1,.3,1),
            background .4s cubic-bezier(.16,1,.3,1),
            box-shadow .4s cubic-bezier(.16,1,.3,1);
        }

        .eq-theme-toggle.is-dark
        .eq-theme-toggle__thumb {
          transform: translateX(43px);
          background: #eef2ff;
          box-shadow:
            inset -6px -2px 0 #c7d2fe,
            0 0 9px rgba(224,231,255,.5);
        }

        .eq-theme-toggle__clouds,
        .eq-theme-toggle__stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .eq-theme-toggle__clouds {
          opacity: 1;
          transition: opacity .35s ease;
        }

        .eq-theme-toggle.is-dark
        .eq-theme-toggle__clouds {
          opacity: 0;
        }

        .eq-theme-toggle__cloud {
          position: absolute;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,.82);
        }

        .eq-theme-toggle__cloud-1 {
          right: 8px;
          bottom: 5px;
          width: 22px;
        }

        .eq-theme-toggle__cloud-2 {
          right: 22px;
          bottom: 8px;
          width: 14px;
        }

        .eq-theme-toggle__cloud-3 {
          right: 4px;
          bottom: 12px;
          width: 12px;
        }

        .eq-theme-toggle__stars {
          opacity: 0;
          transition: opacity .35s ease;
        }

        .eq-theme-toggle.is-dark
        .eq-theme-toggle__stars {
          opacity: 1;
        }

        .eq-theme-toggle__star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          animation:
            eq-star-pulse
            2s infinite ease-in-out;
        }

        .eq-theme-toggle__star-1 {
          top: 7px;
          left: 13px;
        }

        .eq-theme-toggle__star-2 {
          top: 17px;
          left: 27px;
          animation-delay: .5s;
        }

        .eq-theme-toggle__star-3 {
          top: 8px;
          left: 37px;
          animation-delay: 1s;
        }

        @keyframes eq-star-pulse {
          0%, 100% {
            opacity: .35;
            transform: scale(.85);
          }

          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .eq-root *,
          .eq-root *::before,
          .eq-root *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div
        lang={currentLang}
        className={`eq-root ${
          isDarkMode ? '' : 'eq-light'
        }`}
      >
        <header className="eq-header sticky top-0 z-50 border-b border-[var(--eq-border)] backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1560px] items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 xl:px-12">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="eq-focus shrink-0 rounded-lg border-0 bg-transparent p-1"
              aria-label={c.home}
            >
              <img
                src={logoImg}
                alt="SAOLATEK"
                className="h-8 w-auto object-contain sm:h-9"
              />
            </button>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <SolutionLanguageSwitcher
                currentLang={currentLang}
                onChange={setCurrentLang}
                ariaLabel={c.languageLabel}
              />

              <button
                type="button"
                onClick={() =>
                  setIsDarkMode(
                    (current) => !current
                  )
                }
                aria-label={themeLabel}
                title={themeLabel}
                aria-pressed={isDarkMode}
                className={`eq-theme-toggle ${
                  isDarkMode ? 'is-dark' : ''
                }`}
              >
                <div className="eq-theme-toggle__clouds">
                  <div className="eq-theme-toggle__cloud eq-theme-toggle__cloud-1" />
                  <div className="eq-theme-toggle__cloud eq-theme-toggle__cloud-2" />
                  <div className="eq-theme-toggle__cloud eq-theme-toggle__cloud-3" />
                </div>

                <div className="eq-theme-toggle__stars">
                  <div className="eq-theme-toggle__star eq-theme-toggle__star-1" />
                  <div className="eq-theme-toggle__star eq-theme-toggle__star-2" />
                  <div className="eq-theme-toggle__star eq-theme-toggle__star-3" />
                </div>

                <div className="eq-theme-toggle__thumb" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="eq-focus hidden h-10 items-center gap-2 rounded-lg border border-[var(--eq-border)] bg-transparent px-3.5 text-sm font-semibold text-[var(--eq-muted)] transition-colors hover:text-[var(--eq-ink)] sm:inline-flex"
              >
                <ArrowLeft size={15} />
                {c.home}
              </button>

              <button
                type="button"
                onClick={openDemo}
                disabled={isDemoLoading}
                className="eq-focus inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-lg bg-[var(--eq-accent)] px-3.5 text-sm font-bold text-[var(--eq-cta-ink)] transition-colors hover:bg-[var(--eq-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={c.demo}
              >
                <span className="hidden md:inline">
                  {isDemoLoading
                    ? themeCopy.demoLoading
                    : c.demo}
                </span>

                {isDemoLoading ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <ArrowRight size={15} />
                )}
              </button>
            </div>
          </div>
        </header>

        <main>
          {/* HERO */}
          <section className="border-b border-[var(--eq-border)] bg-[var(--eq-bg)]">
            <div className="mx-auto flex min-h-[calc(100svh-68px)] w-full max-w-[1560px] items-center px-5 py-14 sm:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12">
              <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[minmax(420px,.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--eq-accent)]">
                    {c.eyebrow}
                  </div>

                  <h1 className="mt-5 text-[40px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-[50px] lg:text-[60px] xl:text-[66px]">
                    <span className="block">
                      {c.heroTitle1}
                    </span>
                    <span className="block text-[var(--eq-accent)]">
                      {c.heroTitle2}
                    </span>
                  </h1>

                  <p className="mt-6 max-w-[60ch] text-base leading-7 text-[var(--eq-muted)] sm:text-lg sm:leading-8">
                    {c.heroBody}
                  </p>

                  <p className="mt-5 max-w-[62ch] text-xs leading-6 text-[var(--eq-soft)]">
                    {c.heroNote}
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => scrollTo('x500')}
                      className="eq-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--eq-accent)] px-6 text-sm font-bold text-[var(--eq-cta-ink)] transition-colors hover:bg-[var(--eq-accent-strong)]"
                    >
                      {c.x500Button}
                      <ArrowRight size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollTo('aa6d')}
                      className="eq-focus inline-flex h-12 items-center justify-center rounded-lg border border-[var(--eq-border)] px-6 text-sm font-semibold text-[var(--eq-ink)] transition-colors hover:border-[var(--eq-border-strong)]"
                    >
                      {c.aa6dButton}
                    </button>
                  </div>
                </div>

                <figure className="min-w-0">
                  <div className="eq-media overflow-hidden rounded-xl border border-[var(--eq-border)] bg-black sm:rounded-2xl">
                    <img
                      src={equipmentX500Image}
                      alt="CHCNAV X500"
                      className="aspect-[16/10] w-full object-cover"
                      loading="eager"
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-2 border-y border-[var(--eq-border)] lg:grid-cols-4">
                    {c.heroStats.map((item, index) => (
                      <div
                        key={`${item.label}-${item.value}`}
                        className={`py-4 ${
                          index % 2 === 0
                            ? 'pr-4'
                            : 'pl-4'
                        } ${
                          index < 2
                            ? 'border-b border-[var(--eq-border)] lg:border-b-0'
                            : ''
                        } ${
                          index < 3
                            ? 'lg:border-r lg:border-[var(--eq-border)] lg:px-5'
                            : 'lg:pl-5'
                        }`}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--eq-soft)]">
                          {item.label}
                        </div>

                        <div className="mt-2 text-base font-semibold">
                          {item.value}
                        </div>

                        {item.note && (
                          <div className="mt-1 text-[11px] leading-4 text-[var(--eq-soft)]">
                            {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </figure>
              </div>
            </div>
          </section>

          {/* SYSTEM PAIRING */}
          <section className="border-b border-[var(--eq-border)] bg-[var(--eq-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.36fr)_minmax(0,.64fr)] lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--eq-accent)]">
                    {c.systemEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[16ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.systemTitle}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--eq-muted)]">
                    {c.systemBody}
                  </p>
                </div>

                <div className="border-y border-[var(--eq-border)]">
                  <button
                    type="button"
                    onClick={() => scrollTo('x500')}
                    className="eq-focus group grid w-full grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-5 border-b border-[var(--eq-border)] py-6 text-left"
                  >
                    <span className="font-mono text-sm font-bold text-[var(--eq-accent)]">
                      X500
                    </span>

                    <span>
                      <span className="block text-lg font-semibold">
                        {c.x500CardTitle}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-[var(--eq-muted)]">
                        {c.x500CardBody}
                      </span>
                    </span>

                    <ArrowRight
                      size={17}
                      className="text-[var(--eq-soft)] transition-transform group-hover:translate-x-1"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollTo('aa6d')}
                    className="eq-focus group grid w-full grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-5 py-6 text-left"
                  >
                    <span className="font-mono text-sm font-bold text-[var(--eq-accent)]">
                      AA6D
                    </span>

                    <span>
                      <span className="block text-lg font-semibold">
                        {c.aa6dCardTitle}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-[var(--eq-muted)]">
                        {c.aa6dCardBody}
                      </span>
                    </span>

                    <ArrowRight
                      size={17}
                      className="text-[var(--eq-soft)] transition-transform group-hover:translate-x-1"
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* X500 SPEC SHEET */}
          <section
            id="x500"
            className="scroll-mt-[88px] border-b border-[var(--eq-border)] bg-[var(--eq-bg)]"
          >
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,.43fr)_minmax(0,.57fr)] lg:items-start lg:gap-16">
                <div className="lg:sticky lg:top-[96px]">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--eq-accent)]">
                    {c.x500Eyebrow}
                  </div>

                  <h2 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-.04em] md:text-[44px]">
                    {c.x500Title}
                  </h2>

                  <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--eq-muted)]">
                    {c.x500Body}
                  </p>

                  <figure className="mt-8">
                    <div className="eq-media overflow-hidden rounded-xl border border-[var(--eq-border)] bg-black sm:rounded-2xl">
                      <img
                        src={equipmentPayloadMountImage}
                        alt="CHCNAV X500 payload integration"
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--eq-muted)]">
                      {c.x500ImageCaption}
                    </figcaption>
                  </figure>
                </div>

                <div>
                  <SpecRows items={c.x500Specs} />

                  <p className="mt-6 border-l-2 border-[var(--eq-accent)] pl-4 text-xs leading-6 text-[var(--eq-soft)]">
                    {c.x500Extra}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* AA6D SPEC SHEET */}
          <section
            id="aa6d"
            className="scroll-mt-[88px] border-b border-[var(--eq-border)] bg-[var(--eq-bg-2)]"
          >
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--eq-accent)]">
                    {c.aa6dEyebrow}
                  </div>

                  <h2 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-.04em] md:text-[44px]">
                    {c.aa6dTitle}
                  </h2>

                  <p className="mt-5 max-w-[620px] text-base leading-7 text-[var(--eq-muted)]">
                    {c.aa6dBody}
                  </p>

                  <figure className="mt-8">
                    <div className="eq-media overflow-hidden rounded-xl border border-[var(--eq-border)] bg-black sm:rounded-2xl">
                      <img
                        src={AA6D_OFFICIAL_IMAGE}
                        alt="CHCNAV AlphaAir 6 Dual"
                        className="aspect-[16/10] w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <figcaption className="mt-4 text-center text-xs leading-5 text-[var(--eq-muted)]">
                      {c.aa6dImageCaption}
                    </figcaption>
                  </figure>

                  <div className="mt-7 grid grid-cols-1 border-y border-[var(--eq-border)] sm:grid-cols-3">
                    {c.aa6dPerformance.map((item, index) => (
                      <div
                        key={item.label}
                        className={`py-4 ${
                          index > 0
                            ? 'border-t border-[var(--eq-border)] sm:border-l sm:border-t-0 sm:pl-5'
                            : ''
                        }`}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--eq-soft)]">
                          {item.label}
                        </div>

                        <div className="mt-2 text-base font-semibold">
                          {item.value}
                        </div>

                        {item.note && (
                          <div className="mt-1 text-[11px] text-[var(--eq-soft)]">
                            {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <div>
                    <h3 className="border-b border-[var(--eq-border)] pb-4 font-mono text-[11px] font-bold uppercase tracking-[.14em] text-[var(--eq-accent)]">
                      {c.lidarGroup}
                    </h3>
                    <SpecRows items={c.aa6dLidarSpecs} />
                  </div>

                  <div className="mt-10">
                    <h3 className="border-b border-[var(--eq-border)] pb-4 font-mono text-[11px] font-bold uppercase tracking-[.14em] text-[var(--eq-accent)]">
                      {c.imagingGroup}
                    </h3>
                    <SpecRows items={c.aa6dImagingSpecs} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* COMPATIBILITY ENVELOPE */}
          <section className="border-b border-[var(--eq-border)] bg-[var(--eq-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="max-w-[1020px]">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--eq-accent)]">
                  {c.pairingEyebrow}
                </div>

                <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                  {c.pairingTitle}
                </h2>

                <p className="mt-5 max-w-[820px] text-base leading-7 text-[var(--eq-muted)]">
                  {c.pairingBody}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.38fr)_minmax(0,.62fr)] lg:gap-16">
                <div className="border-y border-[var(--eq-border)]">
                  {c.pairingStats.map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-5 border-b border-[var(--eq-border)] py-5 last:border-b-0"
                    >
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[.07em] text-[var(--eq-soft)]">
                          {item.label}
                        </div>

                        {item.note && (
                          <div className="mt-1 text-[11px] leading-5 text-[var(--eq-soft)]">
                            {item.note}
                          </div>
                        )}
                      </div>

                      <div className="text-lg font-semibold">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-3 border-y border-[var(--eq-border)] py-5">
                    {c.pipelineLabels.map((label, index) => (
                      <React.Fragment key={label}>
                        <span className="font-mono text-sm font-bold text-[var(--eq-ink)]">
                          {label}
                        </span>

                        {index < c.pipelineLabels.length - 1 && (
                          <span className="text-[var(--eq-soft)]">
                            →
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-6">
                    {c.pairingItems.map((item) => (
                      <p
                        key={item}
                        className="border-t border-[var(--eq-border)] py-4 text-sm leading-7 text-[var(--eq-muted)]"
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* DATASHEET VERIFICATION */}
          <section className="border-b border-[var(--eq-border)] bg-[var(--eq-bg-2)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-14 sm:px-8 md:py-[72px] lg:px-10 lg:py-20 xl:px-12">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,.44fr)_minmax(0,.56fr)] lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--eq-accent)]">
                    {c.verifiedEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[18ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.verifiedTitle}
                  </h2>

                  <p className="mt-5 max-w-[600px] text-base leading-7 text-[var(--eq-muted)]">
                    {c.verifiedBody}
                  </p>

                  <div className="mt-7 border-y border-[var(--eq-border)]">
                    <div className="py-4 text-sm font-semibold">
                      {c.sourceX500}
                    </div>

                    <div className="border-t border-[var(--eq-border)] py-4 text-sm font-semibold">
                      {c.sourceAA6D}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--eq-border)]">
                  {c.verifiedNotes.map((item) => (
                    <p
                      key={item}
                      className="border-b border-[var(--eq-border)] py-5 text-sm leading-7 text-[var(--eq-muted)]"
                    >
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[var(--eq-bg)]">
            <div className="mx-auto w-full max-w-[1560px] px-5 py-12 sm:px-8 md:py-14 lg:px-10 lg:py-16 xl:px-12">
              <div className="grid grid-cols-1 gap-8 border-y border-[var(--eq-border)] py-9 lg:grid-cols-[minmax(0,.62fr)_minmax(300px,.38fr)] lg:items-end lg:gap-16">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[var(--eq-accent)]">
                    {c.finalEyebrow}
                  </div>

                  <h2 className="mt-4 max-w-[22ch] text-[30px] font-semibold leading-[1.08] tracking-[-.035em] md:text-[38px] lg:text-[42px]">
                    {c.finalTitle}
                  </h2>
                </div>

                <div>
                  <p className="max-w-[620px] text-base leading-7 text-[var(--eq-muted)]">
                    {c.finalBody}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          '/resources/3d-mapping-workflow'
                        )
                      }
                      className="eq-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--eq-accent)] px-6 text-sm font-bold text-[var(--eq-cta-ink)] transition-colors hover:bg-[var(--eq-accent-strong)]"
                    >
                      {c.workflowButton}
                      <ArrowRight size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={openDemo}
                      disabled={isDemoLoading}
                      className="eq-focus inline-flex h-12 items-center justify-center rounded-lg border border-[var(--eq-border)] px-6 text-sm font-semibold text-[var(--eq-ink)] transition-colors hover:border-[var(--eq-border-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDemoLoading
                        ? themeCopy.demoLoading
                        : c.demo}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--eq-border)] bg-[var(--eq-bg-2)]">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 px-5 py-6 text-sm text-[var(--eq-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="SAOLATEK"
                className="h-7 w-auto"
              />

              <span>
                {c.footer}
              </span>
            </div>

            <span>
              © 2026 SAOLATEK
            </span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default EquipmentTechnicalSpecsPage;