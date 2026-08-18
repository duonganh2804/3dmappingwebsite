import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Layers,
  Activity,
  ArrowRight,
  Map,
  Satellite,
  BarChart3,
  Cpu,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguage } from '../hooks/useLanguage';
import Globe3DHero from '../components/Globe3DHero';
import logoImg from '../assets/logo.webp';

/*
 * Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5
 * Hallmark · macrostructure: Marquee Hero → Narrative Scroll
 * · theme: studied-DNA (source: https://www.mapbox.com/blog/globe-view)
 * · paper oklch(6% 0.01 240) · accent oklch(60% 0.22 240) cyan-blue
 * · display: Plus Jakarta Sans (geometric sans) · body: same · label: JetBrains Mono
 * · studied: yes · DNA-source: url · nav: N10 scroll-morph · footer: Ft5 Statement
 * · tone: atmospheric-technical · anchor hue: Globe Blue
 */

/* ── SECTION SCROLL HOOK ── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}



/* ── FEATURE ROW ── */
interface FeatureRowProps {
  index: number;
  icon: React.ReactNode;
  label: string;
  heading: string;
  body: string;
  visual: React.ReactNode;
  flip?: boolean;
}
function FeatureRow({ index, icon, label, heading, body, visual, flip = false }: FeatureRowProps) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`lp-feature-row ${flip ? 'lp-feature-row--flip' : ''} ${visible ? 'lp-feature-row--visible' : ''}`}
    >
      <div className="lp-feature-row__text">
        <div className="lp-feature-row__eyebrow">
          <span className="lp-feature-row__icon">{icon}</span>
          <span className="lp-feature-row__label">{label}</span>
          <span className="lp-feature-row__num">0{index}</span>
        </div>
        <h2 className="lp-feature-row__heading">{heading}</h2>
        <p className="lp-feature-row__body">{body}</p>
      </div>
      <div className="lp-feature-row__visual">
        {visual}
      </div>
    </div>
  );
}

/* ── LAYER CARD VISUAL ── */
interface LayerStackVisualProps {
  orthophotoLabel: string;
  meshLabel: string;
  pointCloudLabel: string;
  elevationLabel: string;
}

function LayerStackVisual({ orthophotoLabel, meshLabel, pointCloudLabel, elevationLabel }: LayerStackVisualProps) {
  return (
    <div className="lp-visual-layers" aria-hidden="true">
      {[
        { label: orthophotoLabel, color: 'var(--lp-accent-amber)', delay: '0ms' },
        { label: meshLabel, color: 'var(--lp-accent)', delay: '60ms' },
        { label: pointCloudLabel, color: 'var(--lp-accent-green)', delay: '120ms' },
        { label: elevationLabel, color: 'var(--lp-accent-muted)', delay: '180ms' },
      ].map((layer, i) => (
        <div key={i} className="lp-visual-layer" style={{ '--layer-color': layer.color, '--layer-delay': layer.delay } as React.CSSProperties}>
          <div className="lp-visual-layer__bar" />
          <span className="lp-visual-layer__label">{layer.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── TERRAIN VISUAL ── */
function TerrainVisual({ expandLabel }: { expandLabel: string }) {
  const videoUrl = 'https://pub-1d5704adea5c46b3920fd8f19e3c3480.r2.dev/videos/Video%203D%20Mapping%20nh%C3%A0%20m%C3%A1y%20nhi%E1%BB%87t%20%C4%91i%E1%BB%87n%20Long%20Ph%C3%BA%20v1.mp4';
  const [showLightbox, setShowLightbox] = React.useState(false);

  return (
    <>
      <div 
        className="lp-visual-terrain corner-ticks tech-card" 
        onClick={() => setShowLightbox(true)}
        style={{ 
          width: '100%', 
          aspectRatio: '16/9', 
          overflow: 'hidden', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#000', 
          position: 'relative',
          cursor: 'pointer',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <video 
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Sleek Zoom Hover Overlay */}
        <div className="lp-video-overlay" style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          zIndex: 5
        }}>
          {/* Pulsing Expand Icon */}
          <div style={{
            background: 'var(--lp-accent)',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px var(--lp-accent)'
          }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </div>
          <span style={{ 
            color: '#fff', 
            fontSize: '13px', 
            fontWeight: '600', 
            fontFamily: 'var(--lp-font-mono)', 
            letterSpacing: '0.05em',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            {expandLabel}
          </span>
        </div>
        
        <style>{`
          .lp-visual-terrain:hover .lp-video-overlay {
            opacity: 1;
          }
        `}</style>
      </div>

      {/* Fullscreen Theater Lightbox Modal */}
      {showLightbox && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.96)',
            backdropFilter: 'blur(20px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }} 
          onClick={() => setShowLightbox(false)}
        >
          {/* Close Button */}
          <button 
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 100000
            }} 
            onClick={() => setShowLightbox(false)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            <X size={24} />
          </button>

          {/* Large Video Box */}
          <div 
            style={{ 
              maxWidth: '1280px', 
              width: '100%', 
              aspectRatio: '16/9', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', 
              background: '#000',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <video 
              src={videoUrl}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ── ANALYTICS VISUAL ── */
function MeasurementVisual() {
  return (
    <div className="lp-measure-visual" aria-hidden="true">
      <div className="lp-measure-visual__canvas">
        <svg className="lp-measure-visual__svg" viewBox="0 0 420 230" role="presentation">
          <defs>
            <linearGradient id="measureTerrain" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(30, 64, 175, 0.16)" />
              <stop offset="100%" stopColor="rgba(8, 145, 178, 0.05)" />
            </linearGradient>
          </defs>
          <path
            d="M24 182 C78 145, 126 166, 171 126 C218 85, 272 116, 316 80 C349 53, 379 62, 399 46 L399 205 L24 205 Z"
            fill="url(#measureTerrain)"
            stroke="rgba(56, 189, 248, 0.32)"
            strokeWidth="1.2"
          />
          <path d="M72 162 L195 106 L326 150" fill="none" stroke="rgba(56, 189, 248, 0.9)" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M195 106 L195 180" fill="none" stroke="rgba(251, 146, 60, 0.9)" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="72" cy="162" r="5" fill="#38bdf8" />
          <circle cx="195" cy="106" r="5" fill="#fb923c" />
          <circle cx="326" cy="150" r="5" fill="#22c55e" />
          <circle cx="195" cy="180" r="4" fill="rgba(251,146,60,0.95)" />
          <text x="112" y="126" className="lp-measure-visual__svg-label">128.42 m</text>
          <text x="205" y="151" className="lp-measure-visual__svg-label lp-measure-visual__svg-label--amber">Δ 16.80 m</text>
        </svg>

        <div className="lp-measure-visual__grid" />
        <div className="lp-measure-visual__badge">3D MEASUREMENT</div>
      </div>

      <div className="lp-measure-visual__metrics">
        <div className="lp-measure-metric">
          <span>DISTANCE</span>
          <strong>128.42 m</strong>
        </div>
        <div className="lp-measure-metric">
          <span>Δ HEIGHT</span>
          <strong>16.80 m</strong>
        </div>
        <div className="lp-measure-metric">
          <span>AREA</span>
          <strong>2,458 m²</strong>
        </div>
        <div className="lp-measure-metric">
          <span>CUT / FILL</span>
          <strong>324 m³</strong>
        </div>
      </div>
    </div>
  );
}

const TRANSLATIONS = {
  en: {
    // Navigation Links
    platform: "Platform",
    solutions: "Solutions",
    resources: "Resources",
    connect: "Connect",
    pricing: "Pricing",
    login: "Log in",
    bookDemo: "Book a demo",
    dashboard: "Dashboard",
    platformPointCloud: "Point Cloud & LiDAR",
    platformAnalysis: "3D Measurement & Analysis",
    platformLayers: "Data Layer Management",
    platformCoordinates: "VN-2000 & Coordinate Systems",
    platformProjects: "Project Sharing & Management",
    solSurveying: "Surveying & Measurement",
    solConstructionInfra: "Construction & Infrastructure",
    solUavMapping: "UAV Mapping & LiDAR",
    resMappingWorkflow: "3D Mapping Workflow",
    resEquipmentSpecs: "Equipment & Technical Specifications",
    res3DOutputs: "3D Data Outputs",
    resDemoMaps: "Demo Maps",
    resGuides: "User Guides",
    demoRegistration: "Book a demo",
    connectConsultation: "Contact an Advisor",
    connectLoginTrial: "Log In / Start a Trial",

    // Platform Dropdown
    coreViewer: "Core Viewer",
    viewer3DTitle: "3D GIS Viewer",
    viewer3DDesc: "Interactive 3D CesiumJS map visualization in real-time.",
    pointCloudTitle: "Point Cloud Viewer",
    pointCloudDesc: "Dense COPC point cloud rendering and high-performance interaction.",
    measurement: "Measurement",
    distHeightTitle: "Distance & Height",
    distHeightDesc: "High-accuracy 3D distance and vertical ΔZ measurements.",
    areaTitle: "Area Measurement",
    areaDesc: "Calculate flat surfaces and boundaries directly on the terrain.",
    clipTitle: "Clipping Box",
    clipDesc: "Isolate and slice 3D models and point clouds instantly.",
    visualSettings: "Visual Settings",
    edlTitle: "Eye Dome Lighting",
    edlDesc: "Activate high-fidelity shader for enhanced point cloud depth.",
    projectionTitle: "Projection Modes",
    projectionDesc: "Seamless switch between Perspective and Orthographic views.",
    appearanceTitle: "Appearance Controls",
    appearanceDesc: "Adjust point size, field-of-view (FOV), and shaders.",
    mapManagement: "Map Management",
    layersTitle: "Scene Tree Layers",
    layersDesc: "Control visibility and order of local map overlays.",
    vn2000Title: "VN2000 Integration",
    vn2000Desc: "Accurate Vietnamese national coordinate system mapping.",
    teamWorkspace: "Team Workspace",
    inviteTitle: "Member Invitations",
    inviteDesc: "Invite team members to view and comment on projects.",
    shareTitle: "Share & Permissions",
    shareDesc: "Configure maps as Public, Restricted, or Workspace-only.",
    roadmap: "Roadmap",
    roadmapDesc: "View developmental milestones and progress of Web GIS.",
    viewProgress: "View Progress",

    // Solutions Dropdown
    industriesTitle: "Industries",
    solConstruction: "Construction",
    solHeavyCivil: "Heavy Civil",
    solOwners: "Owners",
    solDataCenters: "Data Centers",
    solRenewableEnergy: "Renewable Energy",
    solAgriculture: "Agriculture",
    solMining: "Mining",
    solUtilities: "Utilities",
    solRoofing: "Roofing",
    solOilGas: "Oil & Gas",
    solPropertyManagement: "Property Management",
    calcBadge: "Calculator",
    calcText: "Estimate how much reality capture could save you with our ROI calculator",
    calcBtn: "Get estimate",

    // Resources Dropdown
    resCategoryLearn: "Learn about Web GIS",
    resCategoryEdu: "Education & News",
    resInsiderTitle: "Web GIS Insider",
    resInsiderDesc: "Latest 3D spatial tech insights & roadmap.",
    resPlaybooksTitle: "Survey Playbooks",
    resPlaybooksDesc: "Step-by-step Drone, LiDAR & BIM workflows.",
    resWebinarsTitle: "Live Webinars",
    resWebinarsDesc: "Watch 3D GIS masterclasses & live demos.",
    resPodcastTitle: "Spatial Podcast",
    resPodcastDesc: "Conversations on surveying & digital twins.",
    resNewsletterTitle: "Tech Newsletter",
    resNewsletterDesc: "Monthly updates on OGC standards & WebGL2.",
    resBlogTitle: "GIS Tech Blog",
    resBlogDesc: "Deep dives into 3D Tiles, VN-2000 & COPC.",
    resStoriesTitle: "Customer Stories",
    resStoriesDesc: "How leaders succeed with 3D Spatial Maps.",
    resPressTitle: "Press Releases",
    resPressDesc: "Company milestones & technology partnerships.",
    resMediaTitle: "Media Coverage",
    resMediaDesc: "Press highlights & spatial industry reviews.",
    resAcademyTitle: "Web GIS Academy",
    resAcademyDesc: "Free courses on reality capture & 3D tiles.",
    academyBannerText: "Master 3D reality capture with interactive GIS courses",
    academyBannerBtn: "Start learning",
    docs: "Documentation",
    docsDesc: "Developer API references and SDK guides.",
    caseStudies: "Case Studies",
    caseStudiesDesc: "Real-world stories from industry leaders.",
    sandbox: "Developer Sandbox",
    sandboxDesc: "Experiment with sample geospatial scripts.",
    community: "Community Forum",
    communityDesc: "Join the discussion with other GIS experts.",
    support: "Support Center",
    supportDesc: "24/7 client portal for custom deployments.",

    // Connect Dropdown
    contactSales: "Contact Sales",
    contactSalesDesc: "Get in touch for custom enterprise pricing plans.",
    scheduleDemo: "Schedule Demo",
    scheduleDemoDesc: "Book a personalized walkthrough with our GIS team.",
    apiAccess: "API Access",
    apiAccessDesc: "Generate keys for custom scripting and automation.",
    getStarted: "Get started",
    getSupport: "Get support",
    connectWithUs: "Connect with us",
    startATrial: "Start a trial",
    helpCenter: "Help Center",
    contactSupport: "Contact support",
    liveOfficeHours: "Live office hours",
    industryEvents: "Industry events",
    joinOurCommunity: "Join our community",
    newsletterSignUp: "Newsletter sign up",

    // Hero Section
    heroBadge: "Web GIS Platform · OGC Standard · WebGL2",
    heroHeadingFirst: "Explore the World Through",
    heroHeadingSpatial: "Real-Time 3D Spatial Maps",
    heroHeadingLast: "",
    heroSub: "High-performance online GIS platform. Analyze Drone, LiDAR, and Satellite data — all inside your web browser, no installations required.",
    exploreDemo: "Explore Demo Maps",
    learnMore: "Learn More",
    scrollExplore: "SCROLL TO EXPLORE",

    // Stats Section
    gsdVal: "< 1.5 cm",
    gsdLabel: "CHCNAV LiDAR Precision",
    fpsVal: "60 FPS",
    fpsLabel: "Smooth 3D Rendering",
    cloudVal: "200M+",
    cloudLabel: "Point Cloud Processing",
    ogcVal: "SAOLATEK",
    ogcLabel: "Vietnam Drone Solutions",

    // Features Section
    feature1Label: "DATA LAYER MANAGEMENT",
    feature1Heading: "Bring Survey Data Together in One 3D Map",
    feature1Body: "Display and overlay COPC point clouds, 3D meshes, orthophotos (DOM), DEM/DSM elevation models, and vector data in one workspace. Work with VN-2000 / WGS84 coordinates, toggle each layer, and adjust opacity while reviewing site conditions.",
    layerOrthophoto: "Orthophoto / DOM",
    layerMesh: "3D Textured Mesh",
    layerPointCloud: "Point Cloud / COPC",
    layerElevation: "Elevation Model / DEM-DSM",
    feature2Label: "SURVEY & DATA PROCESSING",
    feature2Heading: "SAOLATEK UAV & CHCNAV LiDAR Integration",
    feature2Body: "Bring UAV imagery and LiDAR survey data into a unified processing workflow. Use CoPre, CoProcess, and specialized mapping tools to prepare Point Clouds, orthophotos, DEM/DSM elevation models, and 3D Mesh data for site review and analysis on the Web GIS platform.",
    viewFullscreen: "VIEW FULL SCREEN",
    feature3Label: "3D MEASUREMENT & ANALYSIS",
    feature3Heading: "Measure and Analyze Directly in 3D",
    feature3Body: "Measure 3D distance, elevation differences, area, and cut-and-fill volume directly on the displayed model. These tools support site-condition checks and comparison of survey data within the same Web GIS workspace.",

    // Use Cases Section
    useCasesEyebrow: "3D MAPPING SOLUTIONS",
    useCasesHeading: "Built for Surveying, Construction and Agriculture",
    case1Title: "Surveying & Measurement",
    case1Body: "Organize UAV and LiDAR survey data, review Point Clouds, orthophotos and DEM/DSM models, and perform 3D measurements directly in the browser.",
    case2Title: "Construction & Infrastructure",
    case2Body: "Centralize site survey data by layer and location. Review current conditions, check elevation differences and compare information collected across survey periods.",
    case3Title: "Agriculture",
    case3Body: "Build maps of cultivation areas from UAV survey data, manage imagery and terrain layers, and support field-condition review for agricultural production areas.",

    // CTA Band
    ctaHeading: "Explore your survey data in 3D",
    ctaSub: "Open the demo map or book a session to review the 3D Mapping workflow with the SAOLATEK team.",
    ctaDemo: "Explore 3D Demo Maps",
    ctaApi: "Book a Demo",

    // Footer
    footerDesc: "3D Web GIS platform for visualizing, organizing and measuring UAV and LiDAR survey data directly in the browser.",
    allSystems: "ALL SYSTEMS OPERATIONAL",
    prodCol: "PRODUCT",
    techCol: "TECHNOLOGY",
    accCol: "ACCOUNT",
    features: "Features",
    apps: "Applications",
    demoMap: "Demo Maps",
    register: "Register",
    rights: "© 2026 SAOLATEK. All rights reserved."
  },
  vi: {
    // Navigation Links
    platform: "Nền tảng",
    solutions: "Giải pháp",
    resources: "Tài nguyên",
    connect: "Kết nối",
    pricing: "Bảng giá",
    login: "Đăng nhập",
    bookDemo: "Đăng ký demo",
    dashboard: "Bảng điều khiển",
    platformPointCloud: "Point Cloud & LiDAR",
    platformAnalysis: "Đo đạc & Phân tích 3D",
    platformLayers: "Quản lý lớp dữ liệu",
    platformCoordinates: "VN-2000 & Hệ tọa độ",
    platformProjects: "Chia sẻ & Quản lý dự án",
    solSurveying: "Khảo sát & Đo đạc",
    solConstructionInfra: "Xây dựng & Hạ tầng",
    solUavMapping: "UAV Mapping & LiDAR",
    resMappingWorkflow: "Quy trình 3D Mapping",
    resEquipmentSpecs: "Thiết bị & Thông số kỹ thuật",
    res3DOutputs: "Dữ liệu đầu ra 3D",
    resDemoMaps: "Bản đồ Demo",
    resGuides: "Tài liệu hướng dẫn",
    demoRegistration: "Đăng ký Demo",
    connectConsultation: "Liên hệ tư vấn",
    connectLoginTrial: "Đăng nhập / Dùng thử",

    // Platform Dropdown
    coreViewer: "Trình xem chính",
    viewer3DTitle: "Trình xem 3D GIS",
    viewer3DDesc: "Xem bản đồ không gian 3D tương tác thời gian thực.",
    pointCloudTitle: "Trình xem mây điểm",
    pointCloudDesc: "Tương tác dữ liệu mây điểm COPC mật độ lớn.",
    measurement: "Đo đạc",
    distHeightTitle: "Đo khoảng cách & Chiều cao",
    distHeightDesc: "Đo đạc chiều dài và chiều cao đứng ΔZ chính xác.",
    areaTitle: "Đo diện tích",
    areaDesc: "Tính toán diện tích bề mặt phẳng bản đồ địa hình.",
    clipTitle: "Hộp cắt 3D",
    clipDesc: "Cắt lát mô hình 3D và đám mây điểm theo thời gian thực.",
    visualSettings: "Cấu hình hiển thị",
    edlTitle: "Hiệu ứng đổ bóng EDL",
    edlDesc: "Kích hoạt hiệu ứng đổ bóng EDL làm sắc nét mây điểm.",
    projectionTitle: "Chế độ chiếu camera",
    projectionDesc: "Chuyển đổi góc chiếu Perspective & Orthographic.",
    appearanceTitle: "Cấu hình trực quan",
    appearanceDesc: "Tùy chỉnh Point Size, góc FOV và chế độ hiển thị.",
    mapManagement: "Quản lý bản đồ",
    layersTitle: "Scene Tree Layers",
    layersDesc: "Quản lý bật/tắt hiển thị các lớp bản đồ.",
    vn2000Title: "Tích hợp VN2000",
    vn2000Desc: "Hiển thị chuẩn hệ tọa độ Việt Nam chính xác.",
    teamWorkspace: "Cộng tác nhóm",
    inviteTitle: "Mời thành viên",
    inviteDesc: "Mời thành viên cùng tham gia xem và đóng góp ý kiến.",
    shareTitle: "Chia sẻ & Phân quyền",
    shareDesc: "Thiết lập dự án Công khai (Public) hoặc Nội bộ.",
    roadmap: "Lộ trình",
    roadmapDesc: "Xem lộ trình phát triển và kiểm tra tiến độ dự án Web GIS.",
    viewProgress: "Xem Tiến Độ",

    // Solutions Dropdown
    industriesTitle: "Lĩnh vực",
    solConstruction: "Xây dựng",
    solHeavyCivil: "Hạ tầng giao thông & Dân dụng nặng",
    solOwners: "Chủ đầu tư",
    solDataCenters: "Trung tâm dữ liệu",
    solRenewableEnergy: "Năng lượng tái tạo",
    solAgriculture: "Nông nghiệp",
    solMining: "Khai khoáng",
    solUtilities: "Tiện ích công cộng",
    solRoofing: "Khảo sát mái công trình",
    solOilGas: "Dầu khí",
    solPropertyManagement: "Quản lý bất động sản",
    calcBadge: "Công cụ tính",
    calcText: "Ước tính mức tiết kiệm chi phí với công cụ tính hiệu quả đầu tư ROI của chúng tôi",
    calcBtn: "Nhận ước tính",

    // Resources Dropdown
    resCategoryLearn: "Tìm hiểu về Web GIS",
    resCategoryEdu: "Đào tạo & Tin tức",
    resInsiderTitle: "Bản tin 3D GIS Insider",
    resInsiderDesc: "Xu hướng công nghệ không gian 3D & lộ trình.",
    resPlaybooksTitle: "Quy trình Khảo sát (Playbooks)",
    resPlaybooksDesc: "Quy trình khảo sát Drone, LiDAR & mô hình BIM.",
    resWebinarsTitle: "Hội thảo Trực tuyến (Webinars)",
    resWebinarsDesc: "Xem các buổi hướng dẫn & Demo 3D GIS thực tế.",
    resPodcastTitle: "Podcast Không gian",
    resPodcastDesc: "Góc nhìn về trắc địa & Chuyển đổi số 3D.",
    resNewsletterTitle: "Bản tin Kỹ thuật (Newsletter)",
    resNewsletterDesc: "Cập nhật hàng tháng về chuẩn OGC & WebGL2.",
    resBlogTitle: "Blog Kỹ thuật GIS",
    resBlogDesc: "Bài viết chuyên sâu về 3D Tiles, VN-2000 & COPC.",
    resStoriesTitle: "Câu chuyện Khách hàng",
    resStoriesDesc: "Ứng dụng thực tế trong Quy hoạch & Xây dựng.",
    resPressTitle: "Thông cáo Báo chí",
    resPressDesc: "Tin tức công ty & Hợp tác chiến lược.",
    resMediaTitle: "Điểm tin Truyền thông",
    resMediaDesc: "Bài viết báo chí & Đánh giá chuyên môn.",
    resAcademyTitle: "Học viện Web GIS (Academy)",
    resAcademyDesc: "Khóa học miễn phí về khảo sát & dữ liệu 3D.",
    academyBannerText: "Nâng cao kỹ năng khảo sát 3D với các khóa học miễn phí",
    academyBannerBtn: "Khám phá ngay",
    docs: "Tài liệu kỹ thuật",
    docsDesc: "Tài liệu API cho nhà phát triển và hướng dẫn SDK.",
    caseStudies: "Nghiên cứu điển hình",
    caseStudiesDesc: "Những câu chuyện thực tế từ các doanh nghiệp hàng đầu.",
    sandbox: "Hộp cát lập trình",
    sandboxDesc: "Thử nghiệm các kịch bản không gian mẫu.",
    community: "Diễn đàn cộng đồng",
    communityDesc: "Tham gia thảo luận cùng các chuyên gia GIS khác.",
    support: "Trung tâm hỗ trợ",
    supportDesc: "Cổng hỗ trợ khách hàng 24/7 cho các triển khai riêng.",

    // Connect Dropdown
    contactSales: "Liên hệ kinh doanh",
    contactSalesDesc: "Liên hệ với chúng tôi để nhận báo giá doanh nghiệp.",
    scheduleDemo: "Đặt lịch demo",
    scheduleDemoDesc: "Đăng ký buổi làm việc riêng cùng đội ngũ chuyên gia.",
    apiAccess: "Truy cập API",
    apiAccessDesc: "Khởi tạo mã khóa để tích hợp kịch bản và tự động hóa.",
    getStarted: "Bắt đầu",
    getSupport: "Hỗ trợ",
    connectWithUs: "Kết nối với chúng tôi",
    startATrial: "Dùng thử miễn phí",
    helpCenter: "Trung tâm trợ giúp",
    contactSupport: "Liên hệ hỗ trợ",
    liveOfficeHours: "Tư vấn trực tiếp",
    industryEvents: "Sự kiện ngành",
    joinOurCommunity: "Tham gia cộng đồng",
    newsletterSignUp: "Đăng ký nhận bản tin",

    // Hero Section
    heroBadge: "Nền tảng Web GIS · Chuẩn OGC · WebGL2",
    heroHeadingFirst: "Khám Phá Thế Giới Qua",
    heroHeadingSpatial: "Bản Đồ Không Gian 3D",
    heroHeadingLast: "Thời Gian Thực",
    heroSub: "Nền tảng GIS trực tuyến hiệu năng cao. Phân tích dữ liệu Drone, LiDAR và Vệ tinh — tất cả ngay trên trình duyệt, không cần cài đặt phần mềm.",
    exploreDemo: "Trải Nghiệm Bản Đồ Demo",
    learnMore: "Tìm hiểu thêm",
    scrollExplore: "CUỘN ĐỂ KHÁM PHÁ",

    // Stats Section
    gsdVal: "< 1.5 cm",
    gsdLabel: "Độ chính xác LiDAR CHCNAV",
    fpsVal: "60 FPS",
    fpsLabel: "Render 3D mượt mà",
    cloudVal: "200M+",
    cloudLabel: "Xử lý Điểm Point Cloud",
    ogcVal: "SAOLATEK",
    ogcLabel: "Drone & Giải pháp Việt Nam",

    // Features Section
    feature1Label: "QUẢN LÝ LỚP DỮ LIỆU",
    feature1Heading: "Tập trung dữ liệu khảo sát trên một bản đồ 3D",
    feature1Body: "Hiển thị và chồng xếp Point Cloud COPC, Mesh 3D, ảnh trực giao (DOM), mô hình cao độ DEM/DSM và dữ liệu Vector trong cùng một không gian làm việc. Hỗ trợ VN-2000 / WGS84, bật/tắt từng lớp và điều chỉnh độ trong suốt khi kiểm tra hiện trạng.",
    layerOrthophoto: "Ảnh trực giao / DOM",
    layerMesh: "Mô hình Mesh 3D",
    layerPointCloud: "Point Cloud / COPC",
    layerElevation: "Mô hình cao độ / DEM-DSM",
    feature2Label: "KHẢO SÁT & XỬ LÝ DỮ LIỆU",
    feature2Heading: "Tích hợp UAV SAOLATEK & LiDAR CHCNAV",
    feature2Body: "Tiếp nhận ảnh UAV và dữ liệu quét LiDAR từ quá trình khảo sát thực địa trong một quy trình xử lý thống nhất. Kết hợp CoPre, CoProcess và các công cụ bản đồ chuyên dụng để chuẩn bị Point Cloud, ảnh trực giao, mô hình cao độ DEM/DSM và Mesh 3D phục vụ kiểm tra hiện trạng và phân tích trên nền tảng Web GIS.",
    viewFullscreen: "XEM TOÀN MÀN HÌNH",
    feature3Label: "ĐO ĐẠC & PHÂN TÍCH 3D",
    feature3Heading: "Đo đạc và phân tích trực tiếp trên mô hình 3D",
    feature3Body: "Đo khoảng cách 3D, chênh cao, diện tích và thể tích đào đắp (Cut & Fill) trực tiếp trên mô hình đang hiển thị. Các công cụ này hỗ trợ kiểm tra hiện trạng và đối chiếu dữ liệu khảo sát ngay trong cùng không gian Web GIS.",

    // Use Cases Section
    useCasesEyebrow: "GIẢI PHÁP 3D MAPPING",
    useCasesHeading: "Ứng dụng cho khảo sát, xây dựng và nông nghiệp",
    case1Title: "Khảo sát & Đo đạc",
    case1Body: "Tổ chức dữ liệu khảo sát từ UAV và LiDAR, hiển thị Point Cloud, ảnh trực giao, DEM/DSM và thực hiện các phép đo 3D trực tiếp trên trình duyệt.",
    case2Title: "Xây dựng & Hạ tầng",
    case2Body: "Tập trung dữ liệu khảo sát công trường theo khu vực và lớp dữ liệu, hỗ trợ kiểm tra hiện trạng, chênh cao và đối chiếu thông tin giữa các đợt khảo sát.",
    case3Title: "Nông nghiệp",
    case3Body: "Lập bản đồ khu vực canh tác từ dữ liệu UAV, quản lý lớp ảnh và mô hình địa hình, hỗ trợ khảo sát hiện trạng và theo dõi khu vực sản xuất.",

    // CTA Band
    ctaHeading: "Khám phá dữ liệu khảo sát trực tiếp trên bản đồ 3D",
    ctaSub: "Mở bản đồ demo hoặc đăng ký buổi demo để xem quy trình 3D Mapping cùng đội ngũ SAOLATEK.",
    ctaDemo: "Trải Nghiệm Bản Đồ 3D Demo",
    ctaApi: "Đăng ký Demo",

    // Footer
    footerDesc: "Nền tảng Web GIS 3D phục vụ hiển thị, tổ chức lớp dữ liệu và đo đạc dữ liệu khảo sát UAV/LiDAR trực tiếp trên trình duyệt.",
    allSystems: "HỆ THỐNG HOẠT ĐỘNG BÌNH THƯỜNG",
    prodCol: "SẢN PHẨM",
    techCol: "CÔNG NGHỆ",
    accCol: "TÀI KHOẢN",
    features: "Tính năng",
    apps: "Ứng dụng",
    demoMap: "Bản đồ Demo",
    register: "Đăng ký",
    rights: "© 2026 SAOLATEK. Bảo lưu mọi quyền."
  },
  zh: {
    // Navigation Links
    platform: "平台",
    solutions: "解决方案",
    resources: "资源中心",
    connect: "联系我们",
    pricing: "价格",
    login: "登录",
    bookDemo: "预约演示",
    dashboard: "控制台",
    platformPointCloud: "点云与激光雷达",
    platformAnalysis: "三维测量与分析",
    platformLayers: "数据图层管理",
    platformCoordinates: "VN-2000 与坐标系统",
    platformProjects: "项目共享与管理",
    solSurveying: "测绘与测量",
    solConstructionInfra: "建筑与基础设施",
    solUavMapping: "无人机测绘与激光雷达",
    resMappingWorkflow: "三维建图流程",
    resEquipmentSpecs: "设备与技术规格",
    res3DOutputs: "三维数据成果",
    resDemoMaps: "演示地图",
    resGuides: "使用指南",
    demoRegistration: "预约演示",
    connectConsultation: "联系咨询",
    connectLoginTrial: "登录 / 试用",

    // Platform Dropdown
    coreViewer: "核心渲染器",
    viewer3DTitle: "3D GIS 浏览器",
    viewer3DDesc: "实时交互式 CesiumJS 3D 地图可视化。",
    pointCloudTitle: "点云浏览器",
    pointCloudDesc: "海量 COPC 点云渲染与高性能人机交互。",
    measurement: "三维测量",
    distHeightTitle: "距离与高度测量",
    distHeightDesc: "高精度 3D 距离和垂直高度 ΔZ 测量。",
    areaTitle: "面积测量",
    areaDesc: "直接在数字高程地形上测量平面面积与边界。",
    clipTitle: "三维剖切盒",
    clipDesc: "实时对 3D 模型和点云进行空间裁剪与切割。",
    visualSettings: "视觉配置",
    edlTitle: "眼穹顶照明 (EDL)",
    edlDesc: "启用高保真 EDL 着色器以增强点云深度感。",
    projectionTitle: "相机投影模式",
    projectionDesc: "支持透视 (Perspective) 和正交 (Orthographic) 模式切换。",
    appearanceTitle: "外观参数微调",
    appearanceDesc: "自由调整点大小、视场角 (FOV) 和显示模式。",
    mapManagement: "地图图层管理",
    layersTitle: "图层控制树 (Scene Tree)",
    layersDesc: "管理本地地图和卫星图层的叠加与可见性。",
    vn2000Title: "VN2000 坐标集成",
    vn2000Desc: "高精度越南 VN-2000 国家坐标系投影转换。",
    teamWorkspace: "团队协作空间",
    inviteTitle: "邀请团队成员",
    inviteDesc: "邀请团队成员查看项目并发表修改意见。",
    shareTitle: "共享与权限",
    shareDesc: "配置公开项目 (Public) 或受限内部空间权限。",
    roadmap: "路线图",
    roadmapDesc: "查看 Web GIS 的开发里程碑、功能路线图与最新进度。",
    viewProgress: "查看进度",

    // Solutions Dropdown
    industriesTitle: "行业领域",
    solConstruction: "建筑工程",
    solHeavyCivil: "重型土木工程",
    solOwners: "业主与项目方",
    solDataCenters: "数据中心",
    solRenewableEnergy: "可再生能源",
    solAgriculture: "农业监测",
    solMining: "矿业开采",
    solUtilities: "公用事业",
    solRoofing: "屋顶检测",
    solOilGas: "石油与天然气",
    solPropertyManagement: "物业与地产管理",
    calcBadge: "估算工具",
    calcText: "使用我们的投资回报率 (ROI) 估算工具，计算数字化实景捕捉能为您节省多少成本",
    calcBtn: "获取估算",

    // Resources Dropdown
    resCategoryLearn: "了解 Web GIS 平台",
    resCategoryEdu: "教育培训与新闻",
    resInsiderTitle: "3D GIS 内部资讯",
    resInsiderDesc: "最新的三维空间技术趋势与产品路线。",
    resPlaybooksTitle: "测绘作业指南 (Playbooks)",
    resPlaybooksDesc: "无人机、LiDAR 与 BIM 三维建模标准流程。",
    resWebinarsTitle: "线上研讨会 (Webinars)",
    resWebinarsDesc: "观看三维 GIS 专家讲座与实机演示。",
    resPodcastTitle: "空间技术播客 (Podcast)",
    resPodcastDesc: "探讨测绘地理信息与数字孪生前沿。",
    resNewsletterTitle: "技术月刊 (Newsletter)",
    resNewsletterDesc: "每月获取 OGC 标准与 WebGL2 渲染引擎更新。",
    resBlogTitle: "GIS 技术博客",
    resBlogDesc: "深入探讨 3D Tiles、VN-2000 与 COPC 点云。",
    resStoriesTitle: "客户成功案例",
    resStoriesDesc: "了解各行业客户利用 3D 地图的真实案例。",
    resPressTitle: "新闻发布",
    resPressDesc: "公司里程碑、重大更新与技术合作伙伴。",
    resMediaTitle: "媒体报道",
    resMediaDesc: "权威媒体报道与地理信息行业评测。",
    resAcademyTitle: "Web GIS 学院 (Academy)",
    resAcademyDesc: "实景捕捉与三维数据处理免费课程。",
    academyBannerText: "通过互动式 3D GIS 课程掌握三维实景捕捉",
    academyBannerBtn: "开始学习",
    docs: "开发者文档",
    docsDesc: "面向开发者的 API 参考文档与集成 SDK 指南。",
    caseStudies: "行业案例研究",
    caseStudiesDesc: "了解各行业领先企业利用本平台的真实成功案例。",
    sandbox: "开发者沙盒",
    sandboxDesc: "尝试运行空间分析示例脚本。",
    community: "社区论坛",
    communityDesc: "与全球其他 GIS 专家和地图开发者一起交流讨论。",
    support: "客户支持中心",
    supportDesc: "针对定制化私有化部署提供 24/7 客户支持服务。",

    // Connect Dropdown
    contactSales: "联系销售团队",
    contactSalesDesc: "联系我们的专家以获取量身定制的企业定价方案。",
    scheduleDemo: "预约专属演示",
    scheduleDemoDesc: "预约与技术团队进行 1 对 1 的产品演示与答疑。",
    apiAccess: "API 访问权限",
    apiAccessDesc: "生成开发者密钥以实现自定义脚本集成与自动化。",
    getStarted: "开始使用",
    getSupport: "获取支持",
    connectWithUs: "与我们联系",
    startATrial: "开始试用",
    helpCenter: "帮助中心",
    contactSupport: "联系支持",
    liveOfficeHours: "在线答疑时间",
    industryEvents: "行业活动",
    joinOurCommunity: "加入我们的社区",
    newsletterSignUp: "订阅新闻资讯",

    // Hero Section
    heroBadge: "Web GIS 平台 · OGC 标准 · WebGL2",
    heroHeadingFirst: "通过",
    heroHeadingSpatial: "实时 3D 空间地图",
    heroHeadingLast: "探索世界",
    heroSub: "高性能在线 GIS 平台。直接在浏览器中分析无人机、LiDAR 和卫星数据 — 无需安装任何软件。",
    exploreDemo: "体验演示地图",
    learnMore: "了解更多",
    scrollExplore: "向下滚动以探索",

    // Stats Section
    gsdVal: "< 2 cm",
    gsdLabel: "GSD 影像分辨率",
    fpsVal: "60 FPS",
    fpsLabel: "流畅三维渲染速率",
    cloudVal: "100M+",
    cloudLabel: "点云点数负载",
    ogcVal: "OGC 标准兼容",
    ogcLabel: "3D Tiles · WMS · WFS",

    // Features Section
    feature1Label: "数据图层管理",
    feature1Heading: "在一张三维地图中集中管理测绘数据",
    feature1Body: "在同一工作空间中叠加显示 COPC 点云、三维网格、正射影像（DOM）、DEM/DSM 高程模型和矢量数据。支持 VN-2000 / WGS84 坐标系，可独立开关图层并调节透明度以核查现场数据。",
    layerOrthophoto: "正射影像 / DOM",
    layerMesh: "三维纹理网格",
    layerPointCloud: "点云 / COPC",
    layerElevation: "高程模型 / DEM-DSM",
    feature2Label: "测绘与数据处理",
    feature2Heading: "SAOLATEK 无人机与 CHCNAV LiDAR 集成",
    feature2Body: "将无人机影像与 LiDAR 测绘数据纳入统一的数据处理流程。结合 CoPre、CoProcess 及专业测绘工具，准备点云、正射影像、DEM/DSM 高程模型和三维网格数据，用于 Web GIS 平台上的现场核查与空间分析。",
    viewFullscreen: "全屏查看",
    feature3Label: "三维测量与分析",
    feature3Heading: "直接在三维模型上进行测量与分析",
    feature3Body: "直接在当前三维模型上测量三维距离、高差、面积和填挖方体积。这些工具可用于现场现状核查，并在同一 Web GIS 工作空间中对比测绘数据。",

    // Use Cases Section
    useCasesEyebrow: "三维建图解决方案",
    useCasesHeading: "面向测绘、建筑与农业的三维应用",
    case1Title: "测绘与测量",
    case1Body: "集中管理无人机与 LiDAR 测绘数据，查看点云、正射影像和 DEM/DSM，并直接在浏览器中进行三维测量。",
    case2Title: "建筑与基础设施",
    case2Body: "按区域和图层集中管理现场测绘数据，用于核查现状、高差并对比不同测绘阶段采集的信息。",
    case3Title: "农业",
    case3Body: "利用无人机测绘数据建立种植区域地图，管理影像与地形图层，并支持农业生产区域的现场现状核查。",

    // CTA Band
    ctaHeading: "在三维地图中查看测绘数据",
    ctaSub: "打开演示地图，或预约演示以了解 SAOLATEK 的三维建图工作流程。",
    ctaDemo: "体验 3D 演示地图",
    ctaApi: "预约演示",

    // Footer
    footerDesc: "用于在浏览器中可视化、组织图层并测量无人机与 LiDAR 测绘数据的三维 Web GIS 平台。",
    allSystems: "所有系统运行正常",
    prodCol: "产品",
    techCol: "技术",
    accCol: "账户",
    features: "功能特性",
    apps: "行业应用",
    demoMap: "演示地图",
    register: "注册",
    rights: "© 2026 SAOLATEK. 保留所有权利。"
  }
};

/* ── MAIN COMPONENT ── */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { currentLang, setCurrentLang } = useLanguage('en');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const t = (key: keyof typeof TRANSLATIONS.en) => {
    return TRANSLATIONS[currentLang][key] || TRANSLATIONS.en[key] || '';
  };

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const openDropdown = (menuKey: string) => {
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current);
      dropdownCloseTimer.current = null;
    }
    setActiveDropdown(menuKey);
  };

  const closeDropdownWithDelay = () => {
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current);
    }

    dropdownCloseTimer.current = setTimeout(() => {
      setActiveDropdown(null);
      dropdownCloseTimer.current = null;
    }, 180);
  };

  return (
    <>
      <style>{`
        /* ── TOKENS ── */
        :root {
          --lp-paper:        oklch(6% 0.012 240);
          --lp-paper-2:      oklch(10% 0.014 240);
          --lp-paper-3:      oklch(14% 0.016 240);
          --lp-ink:          oklch(96% 0.005 240);
          --lp-ink-muted:    oklch(65% 0.01 240);
          --lp-accent:       oklch(60% 0.22 240);
          --lp-accent-glow:  oklch(70% 0.22 240);
          --lp-accent-amber: oklch(78% 0.16 60);
          --lp-accent-green: oklch(74% 0.18 150);
          --lp-accent-muted: oklch(55% 0.12 240);
          --lp-border:       oklch(100% 0 0 / 0.08);
          --lp-border-accent:oklch(60% 0.22 240 / 0.3);

          --lp-font-display: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
          --lp-font-mono:    'JetBrains Mono', 'Space Mono', monospace;

          --lp-ease-out:     cubic-bezier(0.16, 1, 0.3, 1);
          --lp-ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);

          --lp-dur-fast:     150ms;
          --lp-dur-med:      300ms;
          --lp-dur-slow:     600ms;

          --lp-space-xs:     4px;
          --lp-space-sm:     8px;
          --lp-space-md:     16px;
          --lp-space-lg:     32px;
          --lp-space-xl:     64px;
          --lp-space-2xl:    96px;
          --lp-space-3xl:    128px;

          /* Navigation Mode variables */
          --lp-nav-bg:          #000000;
          --lp-nav-border:      rgba(255, 255, 255, 0.1);
          --lp-nav-bg-scrolled: rgba(0, 0, 0, 0.95);
          --lp-nav-brand:       #FFFFFF;
          --lp-nav-link:        rgba(255, 255, 255, 0.7);
          --lp-border-ghost:    rgba(255, 255, 255, 0.4);
          --lp-btn-solid-bg:    #FFFFFF;
          --lp-btn-solid-text:  #000000;
        }

        .lp-root.light-mode {
          --lp-paper:        oklch(98% 0.002 240);
          --lp-paper-2:      oklch(95% 0.004 240);
          --lp-paper-3:      oklch(91% 0.006 240);
          --lp-ink:          oklch(15% 0.005 240);
          --lp-ink-muted:    oklch(45% 0.01 240);
          --lp-accent:       oklch(55% 0.20 240);
          --lp-accent-glow:  oklch(65% 0.20 240);
          --lp-border:       rgba(0, 0, 0, 0.08);
          --lp-border-accent:oklch(55% 0.20 240 / 0.3);

          --lp-nav-bg:          #FFFFFF;
          --lp-nav-border:      rgba(0, 0, 0, 0.08);
          --lp-nav-bg-scrolled: rgba(255, 255, 255, 0.95);
          --lp-nav-brand:       #0B0E14;
          --lp-nav-link:        rgba(0, 0, 0, 0.7);
          --lp-border-ghost:    rgba(0, 0, 0, 0.3);
          --lp-btn-solid-bg:    #0B0E14;
          --lp-btn-solid-text:  #FFFFFF;
        }

        /* ── RESET & BASE ── */
        .lp-root {
          background-color: var(--lp-paper);
          color: var(--lp-ink);
          font-family: var(--lp-font-display);
          min-height: 100vh;
          overflow-x: clip;
          transition: background-color var(--lp-dur-med) var(--lp-ease-in-out), color var(--lp-dur-med) var(--lp-ease-in-out);
        }
        .lp-root *, .lp-root *::before, .lp-root *::after {
          box-sizing: border-box;
        }
        .lp-root h1, .lp-root h2, .lp-root h3 {
          font-style: normal !important;
          overflow-wrap: anywhere;
          min-width: 0;
        }

        /* ── NAV (DroneDeploy Style Redesign) ── */
        .lp-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          background: var(--lp-nav-bg);
          border-bottom: 1px solid var(--lp-nav-border);
          transition: background var(--lp-dur-med) var(--lp-ease-in-out),
                      padding var(--lp-dur-med) var(--lp-ease-in-out),
                      border-bottom var(--lp-dur-med) var(--lp-ease-in-out);
        }
        .lp-nav--scrolled {
          background: var(--lp-nav-bg-scrolled);
          backdrop-filter: blur(16px);
          padding: 12px 48px;
        }
        .lp-nav__logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          text-decoration: none;
          flex-shrink: 0;
        }
        .lp-nav__logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s var(--lp-ease-out);
        }
        .lp-nav__logo:hover .lp-nav__logo-mark {
          transform: scale(1.05);
        }
        .lp-nav__brand {
          font-size: 18px;
          font-weight: 700;
          color: var(--lp-nav-brand);
          letter-spacing: -0.02em;
          font-family: var(--lp-font-display);
        }
        .lp-nav__links {
          display: flex;
          align-items: center;
          gap: 24px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .lp-nav__link {
          font-size: 14px;
          font-weight: 500;
          color: var(--lp-nav-link);
          text-decoration: none;
          transition: color var(--lp-dur-fast);
          white-space: nowrap;
          padding: 8px 12px;
        }
        .lp-nav__link:hover {
          color: var(--lp-nav-brand);
        }
        .lp-nav__link:focus-visible {
          outline: 2px solid var(--lp-accent);
          outline-offset: 4px;
          border-radius: 4px;
        }
        .lp-nav__link-btn {
          background: transparent;
          border: none;
          color: var(--lp-nav-link);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 4px;
          transition: color var(--lp-dur-fast), background var(--lp-dur-fast);
        }
        .lp-nav__link-btn:hover, .lp-nav__link-btn.is-hover {
          color: var(--lp-nav-brand);
        }
        .lp-nav__link-btn:focus-visible, .lp-nav__link-btn.is-focus {
          outline: 2px solid var(--lp-accent);
          outline-offset: 2px;
          color: var(--lp-nav-brand);
        }
        .lp-nav__link-btn:active, .lp-nav__link-btn.is-active {
          color: var(--lp-nav-brand);
        }
        .lp-nav__chevron {
          transition: transform 0.2s var(--lp-ease-out);
        }
        .lp-nav__link-btn.is-active .lp-nav__chevron {
          transform: rotate(180deg);
        }
        
        /* Dropdowns */
        .lp-nav__item-with-dropdown {
          position: relative;
        }
        
        .lp-nav__dropdown {
          position: absolute;
          top: calc(100% - 1px);
          left: 50%;
          transform: translateX(-50%);
          width: 320px;
          background: rgba(11, 14, 20, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2);
          z-index: 1000;
          animation: dropdownFadeIn 0.2s var(--lp-ease-out);
        }
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, 4px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        /* Mega menu specific positioning context */
        .lp-nav__dropdown--mega {
          position: absolute;
          top: 100%;
          left: 48px;
          right: 48px;
          width: auto;
          transform: none;
          padding: 24px;
          animation: megaDropdownFadeIn 0.2s var(--lp-ease-out);
        }
        @keyframes megaDropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* 5-column grid for mega menu */
        .lp-nav__mega-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px;
        }
        .lp-nav__mega-col {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .lp-nav__mega-col-header {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--lp-accent-amber);
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .lp-nav__mega-col-links {
          display: flex;
          flex-direction: column;
          gap: 12px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        /* Bottom CTA bar inside mega menu */
        .lp-nav__mega-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          margin-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .lp-nav__mega-cta-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .lp-nav__mega-badge {
          background: var(--lp-accent-amber);
          color: #000000;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .lp-nav__mega-cta-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .lp-nav__dropdown-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-nav__dropdown-item {
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s var(--lp-ease-out), border-color 0.2s var(--lp-ease-out);
          border: 1px solid transparent;
          text-align: left;
        }
        .lp-nav__dropdown-item:hover, .lp-nav__dropdown-item.is-hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .lp-nav__dropdown-item:focus-visible, .lp-nav__dropdown-item.is-focus {
          outline: 2px solid var(--lp-accent);
          outline-offset: -2px;
        }
        .lp-nav__dropdown-title {
          font-size: 13px;
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 2px;
        }
        .lp-nav__dropdown-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.4;
        }

        .lp-nav__cta {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }
        .lp-nav__globe-btn {
          background: transparent;
          border: none;
          color: var(--lp-nav-link);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          transition: color var(--lp-dur-fast), background var(--lp-dur-fast);
        }
        .lp-nav__globe-btn:hover, .lp-nav__globe-btn.is-hover {
          color: var(--lp-nav-brand);
          background: var(--lp-border);
        }
        .lp-nav__globe-btn:focus-visible, .lp-nav__globe-btn.is-focus {
          outline: 2px solid var(--lp-accent);
          outline-offset: 2px;
        }
        /* Pill Buttons */
        .lp-btn--pill-ghost {
          background: transparent;
          color: var(--lp-nav-brand);
          border: 1px solid var(--lp-border-ghost);
          border-radius: 9999px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color var(--lp-dur-fast), background var(--lp-dur-fast), transform var(--lp-dur-fast);
        }
        .lp-btn--pill-ghost:hover, .lp-btn--pill-ghost.is-hover {
          border-color: var(--lp-nav-brand);
          background: var(--lp-border);
        }
        .lp-btn--pill-ghost:focus-visible, .lp-btn--pill-ghost.is-focus {
          outline: 2px solid var(--lp-accent);
          outline-offset: 3px;
        }
        .lp-btn--pill-ghost:active, .lp-btn--pill-ghost.is-active {
          transform: translateY(1px);
          background: var(--lp-border);
        }
        .lp-btn--pill-solid {
          background: var(--lp-btn-solid-bg);
          color: var(--lp-btn-solid-text);
          border: 1px solid var(--lp-btn-solid-bg);
          border-radius: 9999px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity var(--lp-dur-fast), transform var(--lp-dur-fast), box-shadow var(--lp-dur-fast);
        }
        .lp-btn--pill-solid:hover, .lp-btn--pill-solid.is-hover {
          opacity: 0.9;
          box-shadow: 0 0 16px rgba(255, 255, 255, 0.2);
        }
        .lp-btn--pill-solid:focus-visible, .lp-btn--pill-solid.is-focus {
          outline: 2px solid var(--lp-accent);
          outline-offset: 3px;
        }
        .lp-btn--pill-solid:active, .lp-btn--pill-solid.is-active {
          transform: translateY(1px);
          opacity: 0.8;
        }

        /* Mobile Menu Hamburger Button */
        .lp-nav__hamburger-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--lp-nav-brand);
          cursor: pointer;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 6px;
          transition: background var(--lp-dur-fast);
        }
        .lp-nav__hamburger-btn:hover, .lp-nav__hamburger-btn.is-hover {
          background: var(--lp-border);
        }
        .lp-nav__hamburger-btn:focus-visible, .lp-nav__hamburger-btn.is-focus {
          outline: 2px solid var(--lp-accent);
          outline-offset: 2px;
        }
        .lp-nav__hamburger-btn:active, .lp-nav__hamburger-btn.is-active {
          background: rgba(255, 255, 255, 0.15);
        }

        /* ── DAY/NIGHT TOGGLE SWITCH (Button 29 style) ── */
        .theme-toggle {
          position: relative;
          width: 76px;
          height: 32px;
          border-radius: 9999px;
          cursor: pointer;
          background: linear-gradient(180deg, #2A80F1 0%, #70A7FF 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
          transition: background 0.4s var(--lp-ease-out), border-color 0.4s var(--lp-ease-out);
          display: flex;
          align-items: center;
          padding: 0;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        
        .theme-toggle:focus-visible {
          outline: 2px solid var(--lp-accent);
          outline-offset: 3px;
        }

        /* Dark mode state for toggle track */
        .theme-toggle.is-dark {
          background: linear-gradient(180deg, #090B10 0%, #171E2D 100%);
          border-color: rgba(255, 255, 255, 0.1);
        }

        /* Thumb (Sun / Moon) */
        .theme-toggle__thumb {
          position: absolute;
          top: 3px;
          left: 4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s;
          z-index: 5;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Light state (Sun) */
        .theme-toggle__thumb {
          background: #FFD600;
          box-shadow: 0 0 12px #FFD600, 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Dark state (Moon) */
        .theme-toggle.is-dark .theme-toggle__thumb {
          transform: translateX(42px);
          background: #D1D5DB;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.4), inset -3px -3px 0px rgba(0,0,0,0.15);
        }

        /* Moon craters */
        .theme-toggle__thumb::before {
          content: '';
          position: absolute;
          opacity: 0;
          top: 4px;
          left: 5px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #9CA3AF;
          box-shadow: 6px 10px 0 #9CA3AF, 10px 3px 0 #9CA3AF;
          transition: opacity 0.3s;
        }

        .theme-toggle.is-dark .theme-toggle__thumb::before {
          opacity: 1;
        }

        /* Clouds background in Light Mode */
        .theme-toggle__clouds {
          position: absolute;
          inset: 0;
          opacity: 1;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        
        .theme-toggle.is-dark .theme-toggle__clouds {
          opacity: 0;
        }

        .theme-toggle__cloud {
          position: absolute;
          background: rgba(255, 255, 255, 0.85);
          border-radius: 50%;
        }

        .theme-toggle__cloud-1 {
          bottom: -6px;
          left: 10px;
          width: 24px;
          height: 16px;
        }
        .theme-toggle__cloud-2 {
          bottom: -10px;
          left: 24px;
          width: 32px;
          height: 20px;
        }
        .theme-toggle__cloud-3 {
          bottom: -4px;
          right: 4px;
          width: 20px;
          height: 14px;
        }

        /* Stars background in Dark Mode */
        .theme-toggle__stars {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }

        .theme-toggle.is-dark .theme-toggle__stars {
          opacity: 1;
        }

        .theme-toggle__star {
          position: absolute;
          background: #FFFFFF;
          border-radius: 50%;
          animation: starPulse 2s infinite ease-in-out;
        }
        
        .theme-toggle__star-1 {
          top: 6px;
          left: 14px;
          width: 2px;
          height: 2px;
          animation-delay: 0s;
        }
        .theme-toggle__star-2 {
          top: 14px;
          left: 28px;
          width: 1.5px;
          height: 1.5px;
          animation-delay: 0.5s;
        }
        .theme-toggle__star-3 {
          top: 8px;
          left: 36px;
          width: 2.5px;
          height: 2.5px;
          animation-delay: 1s;
        }

        @keyframes starPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* Mobile Drawer */
        .lp-mobile-drawer {
          position: fixed;
          inset: 0;
          z-index: 150;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(24px);
          display: flex;
          flex-direction: column;
          padding: 24px;
          height: 100dvh;
          padding-top: max(24px, env(safe-area-inset-top));
          padding-right: max(16px, env(safe-area-inset-right));
          padding-bottom: max(24px, env(safe-area-inset-bottom));
          padding-left: max(16px, env(safe-area-inset-left));
          overflow: hidden;
          animation: drawerFadeIn 0.3s var(--lp-ease-out);
        }
        @keyframes drawerFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-mobile-drawer__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .lp-mobile-drawer__close-btn {
          background: transparent;
          border: none;
          color: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 6px;
          transition: background var(--lp-dur-fast);
        }
        .lp-mobile-drawer__close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .lp-mobile-drawer__close-btn:focus-visible {
          outline: 2px solid var(--lp-accent);
          outline-offset: 2px;
        }
        .lp-mobile-drawer__close-btn:active {
          background: rgba(255, 255, 255, 0.15);
        }
        .lp-mobile-drawer__links {
          display: flex;
          flex-direction: column;
          gap: 16px;
          list-style: none;
          padding: 0;
          margin: 0 0 32px 0;
          overflow-y: auto;
          flex-grow: 1;
        }
        .lp-mobile-drawer__link-btn {
          background: transparent;
          border: none;
          color: #FFFFFF;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 8px;
          border-radius: 6px;
          transition: background var(--lp-dur-fast);
        }
        .lp-mobile-drawer__link-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .lp-mobile-drawer__link-btn:focus-visible {
          outline: 2px solid var(--lp-accent);
        }
        .lp-mobile-drawer__dropdown {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          padding: 8px 12px;
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-left: 2px solid var(--lp-accent);
        }
        .lp-mobile-drawer__dropdown-item {
          display: flex;
          min-height: 44px;
          align-items: center;
          padding: 8px 0;
          text-align: left;
        }
        .lp-mobile-drawer__dropdown-title {
          font-size: 14px;
          font-weight: 600;
          color: #FFFFFF;
        }
        .lp-mobile-drawer__dropdown-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }
        .lp-mobile-drawer__cta {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: auto;
        }

        .lp-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background var(--lp-dur-fast), transform var(--lp-dur-fast), box-shadow var(--lp-dur-fast);
          border: none;
          text-decoration: none;
          white-space: nowrap;
        }
        .lp-btn:focus-visible {
          outline: 2px solid var(--lp-accent);
          outline-offset: 3px;
        }
        .lp-btn:active { transform: translateY(1px); }
        .lp-btn--primary {
          background: var(--lp-accent);
          color: oklch(10% 0 0);
        }
        .lp-btn--primary:hover {
          background: var(--lp-accent-glow);
          box-shadow: 0 0 24px oklch(60% 0.22 240 / 0.35);
        }
        .lp-btn--ghost {
          background: transparent;
          color: var(--lp-ink);
          border: 1px solid var(--lp-border);
        }
        .lp-btn--ghost:hover {
          background: oklch(100% 0 0 / 0.06);
          border-color: oklch(100% 0 0 / 0.16);
        }
        .lp-btn--sm {
          padding: 8px 16px;
          font-size: 13px;
        }

        /* ── HERO (Google Maps 3D Maps Demo Style) ── */
        .lp-hero {
          position: relative;
          min-height: 100vh;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 120px 8% 80px;
          overflow: hidden;
          background-color: #030712;
        }
        .lp-hero__bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 75% 50%, rgba(26, 115, 232, 0.15) 0%, transparent 55%),
            radial-gradient(circle at 20% 30%, rgba(0, 229, 255, 0.08) 0%, transparent 45%);
          pointer-events: none;
          z-index: 1;
        }
        .lp-hero__grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
          z-index: 1;
        }
        .lp-hero__content {
          position: relative;
          z-index: 10;
          max-width: 580px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          gap: 24px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s var(--lp-ease-out), transform 0.8s var(--lp-ease-out);
        }
        .lp-hero__content--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .lp-hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(26, 115, 232, 0.15);
          border: 1px solid rgba(66, 133, 244, 0.4);
          border-radius: 100px;
          font-family: var(--lp-font-mono);
          font-size: 12px;
          color: #4285F4;
          letter-spacing: 0.04em;
        }
        .lp-hero__badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4285F4;
          box-shadow: 0 0 10px #4285F4;
          animation: lp-pulse 2s ease-in-out infinite;
        }
        @keyframes lp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .lp-hero__heading {
          font-size: clamp(2.4rem, 5.5vw, 4.5rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .lp-hero__heading em {
          font-style: normal;
          color: #4285F4;
          background: linear-gradient(135deg, #4285F4 0%, #00E5FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lp-hero__sub {
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.65;
          max-width: 520px;
        }
        .lp-hero__actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .lp-hero__actions .lp-btn--primary {
          background: #1a73e8;
          color: #ffffff;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(26, 115, 232, 0.4);
          transition: all 0.25s ease;
        }
        .lp-hero__actions .lp-btn--primary:hover {
          background: #1557b0;
          box-shadow: 0 6px 28px rgba(26, 115, 232, 0.6);
          transform: translateY(-1px);
        }
        .lp-hero__actions .lp-btn--ghost {
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          border-radius: 8px;
          padding: 12px 24px;
        }
        .lp-hero__actions .lp-btn--ghost:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.4);
        }
        .lp-hero__globe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          pointer-events: auto;
        }

        /* Light Mode Hero Variations */
        .lp-hero.lp-hero--light {
          background-color: #f8fafc;
          transition: background-color 0.4s ease;
        }
        .lp-hero.lp-hero--light .lp-hero__bg {
          background: 
            radial-gradient(circle at 75% 50%, rgba(26, 115, 232, 0.18) 0%, transparent 60%),
            radial-gradient(circle at 20% 30%, rgba(0, 229, 255, 0.12) 0%, transparent 50%);
        }
        .lp-hero.lp-hero--light .lp-hero__grid {
          background-image:
            linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
        }
        .lp-hero.lp-hero--light .lp-hero__heading {
          color: #0f172a;
        }
        .lp-hero.lp-hero--light .lp-hero__sub {
          color: #475569;
        }
        .lp-hero.lp-hero--light .lp-hero__badge {
          background: rgba(26, 115, 232, 0.1);
          border-color: rgba(26, 115, 232, 0.35);
          color: #1e40af;
        }
        .lp-hero.lp-hero--light .lp-btn--ghost {
          border-color: rgba(15, 23, 42, 0.25);
          color: #0f172a;
        }
        .lp-hero.lp-hero--light .lp-btn--ghost:hover {
          background: rgba(15, 23, 42, 0.06);
          border-color: rgba(15, 23, 42, 0.4);
        }
        .lp-hero__scroll-hint {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: var(--lp-ink-muted);
          font-family: var(--lp-font-mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          animation: lp-bounce 2s ease-in-out infinite;
        }
        @keyframes lp-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }

        /* ── GLOBE CSS ART ── */
        .lp-globe-wrapper {
          width: 560px;
          height: 560px;
          position: relative;
          flex-shrink: 0;
        }
        .lp-globe {
          width: 100%;
          height: 100%;
          position: relative;
          animation: lp-globe-spin 24s linear infinite;
        }
        @keyframes lp-globe-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .lp-globe-core {
          position: absolute;
          inset: 60px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%,
            oklch(20% 0.04 240) 0%,
            oklch(10% 0.02 240) 60%,
            oklch(6% 0.01 240) 100%);
          border: 1px solid oklch(60% 0.22 240 / 0.25);
        }
        .lp-globe-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid oklch(60% 0.22 240 / 0.12);
        }
        .lp-globe-ring--1 { inset: 40px; border-color: oklch(60% 0.22 240 / 0.2); }
        .lp-globe-ring--2 { inset: 20px; border-color: oklch(60% 0.22 240 / 0.12); }
        .lp-globe-ring--3 { inset: 0px; border-color: oklch(60% 0.22 240 / 0.08); }
        .lp-globe-lines {
          position: absolute;
          inset: 60px;
          border-radius: 50%;
          overflow: hidden;
        }
        .lp-globe-meridian {
          position: absolute;
          top: 0;
          left: 50%;
          width: 1px;
          height: 100%;
          background: oklch(60% 0.22 240 / 0.15);
          transform-origin: center center;
          transform: translateX(-50%) rotate(var(--rotation));
        }
        .lp-globe-parallel {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: oklch(60% 0.22 240 / 0.12);
          top: calc(50% + var(--offset));
        }
        .lp-globe-glow {
          position: absolute;
          inset: 40px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%,
            oklch(60% 0.22 240 / 0.15) 0%,
            transparent 60%);
          pointer-events: none;
        }
        .lp-globe-pin {
          position: absolute;
          left: var(--px);
          top: var(--py);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--lp-accent);
          box-shadow: 0 0 12px oklch(60% 0.22 240 / 0.7), 0 0 4px oklch(60% 0.22 240);
          animation: lp-pin-pulse 2.5s ease-in-out infinite;
        }
        .lp-globe-pin--2 { background: var(--lp-accent-amber); box-shadow: 0 0 12px oklch(78% 0.16 60 / 0.7); animation-delay: 0.8s; }
        .lp-globe-pin--3 { background: var(--lp-accent-green); box-shadow: 0 0 12px oklch(74% 0.18 150 / 0.7); animation-delay: 1.6s; }
        @keyframes lp-pin-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.7; }
        }

        /* ── STATS STRIP ── */
        .lp-stats {
          border-top: 1px solid var(--lp-border);
          border-bottom: 1px solid var(--lp-border);
          background: var(--lp-paper-2);
          padding: 40px 24px;
        }
        .lp-stats__inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
        }
        .lp-stat {
          padding: 24px 32px;
          border-right: 1px solid var(--lp-border);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lp-stat:last-child { border-right: none; }
        .lp-stat__value {
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 800;
          line-height: 1;
          color: var(--lp-ink);
          letter-spacing: -0.03em;
        }
        .lp-stat__value--accent { color: var(--lp-accent); }
        .lp-stat__value--amber  { color: var(--lp-accent-amber); }
        .lp-stat__value--green  { color: var(--lp-accent-green); }
        .lp-stat__label {
          font-size: 13px;
          color: var(--lp-ink-muted);
          font-family: var(--lp-font-mono);
          letter-spacing: 0.02em;
        }

        /* ── NARRATIVE SCROLL: FEATURE ROWS ── */
        .lp-features {
          padding: var(--lp-space-3xl) 24px;
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 120px;
        }
        .lp-feature-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s var(--lp-ease-out), transform 0.7s var(--lp-ease-out);
        }
        .lp-feature-row--visible { opacity: 1; transform: translateY(0); }
        .lp-feature-row--flip { direction: rtl; }
        .lp-feature-row--flip > * { direction: ltr; }
        .lp-feature-row__eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-family: var(--lp-font-mono);
          font-size: 12px;
          color: var(--lp-accent);
          letter-spacing: 0.05em;
        }
        .lp-feature-row__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: oklch(60% 0.22 240 / 0.1);
          border: 1px solid oklch(60% 0.22 240 / 0.25);
          color: var(--lp-accent);
          flex-shrink: 0;
        }
        .lp-feature-row__num {
          margin-left: auto;
          font-size: 11px;
          color: var(--lp-ink-muted);
        }
        .lp-feature-row__heading {
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: var(--lp-ink);
          margin: 0 0 16px;
        }
        .lp-feature-row__body {
          font-size: 17px;
          color: var(--lp-ink-muted);
          line-height: 1.7;
          margin: 0;
        }
        .lp-feature-row__visual {
          border-radius: 16px;
          background: var(--lp-paper-2);
          border: 1px solid var(--lp-border);
          overflow: hidden;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 40px;
        }
        .lp-feature-row__visual::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 70% at 50% 50%, oklch(60% 0.22 240 / 0.04), transparent);
          pointer-events: none;
        }

        /* ── LAYER STACK VISUAL ── */
        .lp-visual-layers {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
        .lp-visual-layer {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          background: oklch(100% 0 0 / 0.03);
          border: 1px solid oklch(100% 0 0 / 0.06);
          border-left-color: var(--layer-color);
          border-left-width: 2px;
          animation: lp-layer-in 0.4s var(--lp-ease-out) var(--layer-delay) both;
        }
        @keyframes lp-layer-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .lp-visual-layer__bar {
          width: 3px;
          height: 24px;
          border-radius: 2px;
          background: var(--layer-color);
          box-shadow: 0 0 8px var(--layer-color);
          flex-shrink: 0;
        }
        .lp-visual-layer__label {
          font-family: var(--lp-font-mono);
          font-size: 12px;
          color: var(--lp-ink-muted);
        }

        /* ── TERRAIN VISUAL ── */
        .lp-visual-terrain {
          position: relative;
          width: 100%;
          height: 240px;
        }
        .lp-terrain-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, oklch(60% 0.22 240 / 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(60% 0.22 240 / 0.08) 1px, transparent 1px);
          background-size: 28px 28px;
          border-radius: 8px;
        }
        .lp-terrain-contour {
          position: absolute;
          left: 10%;
          right: 10%;
          height: 2px;
          border-radius: 2px;
          background: var(--lp-accent);
          opacity: 0.3;
        }
        .lp-terrain-contour--1 { top: 30%; animation: lp-scan 4s ease-in-out infinite; }
        .lp-terrain-contour--2 { top: 55%; opacity: 0.2; animation: lp-scan 4s ease-in-out 1.3s infinite; }
        .lp-terrain-contour--3 { top: 75%; opacity: 0.15; animation: lp-scan 4s ease-in-out 2.6s infinite; }
        @keyframes lp-scan {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.4; }
        }
        .lp-terrain-hud {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: oklch(10% 0.012 240 / 0.9);
          border: 1px solid var(--lp-border-accent);
          border-radius: 8px;
          padding: 12px 16px;
          font-family: var(--lp-font-mono);
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lp-terrain-hud__row {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          color: var(--lp-ink-muted);
        }
        .lp-terrain-hud__row span:last-child { color: var(--lp-accent); }

        /* ── 3D MEASUREMENT VISUAL ── */
        .lp-measure-visual {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(150px, 0.65fr);
          gap: 14px;
          align-items: stretch;
        }
        .lp-measure-visual__canvas {
          min-height: 238px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          border: 1px solid var(--lp-border);
          background:
            radial-gradient(circle at 60% 30%, oklch(60% 0.22 240 / 0.12), transparent 50%),
            oklch(7% 0.014 240);
        }
        .lp-root.light-mode .lp-measure-visual__canvas {
          background:
            radial-gradient(circle at 60% 30%, oklch(55% 0.20 240 / 0.10), transparent 55%),
            #eef4fb;
        }
        .lp-measure-visual__grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(to right, oklch(60% 0.22 240 / 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(60% 0.22 240 / 0.08) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: linear-gradient(to bottom, black, transparent);
        }
        .lp-measure-visual__svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }
        .lp-measure-visual__svg-label {
          fill: rgba(255, 255, 255, 0.82);
          font: 600 11px var(--lp-font-mono);
        }
        .lp-root.light-mode .lp-measure-visual__svg-label {
          fill: #0f172a;
        }
        .lp-measure-visual__svg-label--amber {
          fill: #fb923c;
        }
        .lp-measure-visual__badge {
          position: absolute;
          left: 14px;
          top: 14px;
          z-index: 3;
          padding: 6px 9px;
          border-radius: 7px;
          border: 1px solid oklch(60% 0.22 240 / 0.26);
          background: oklch(8% 0.016 240 / 0.78);
          color: var(--lp-accent-glow);
          font: 600 9px var(--lp-font-mono);
          letter-spacing: 0.08em;
        }
        .lp-root.light-mode .lp-measure-visual__badge {
          background: rgba(255, 255, 255, 0.84);
        }
        .lp-measure-visual__metrics {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        .lp-measure-metric {
          min-width: 0;
          border: 1px solid var(--lp-border);
          border-radius: 10px;
          background: oklch(100% 0 0 / 0.025);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
        }
        .lp-measure-metric span {
          color: var(--lp-ink-muted);
          font: 600 9px var(--lp-font-mono);
          letter-spacing: 0.08em;
        }
        .lp-measure-metric strong {
          color: var(--lp-ink);
          font-size: 16px;
          font-weight: 750;
          line-height: 1.15;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        /* ── USE CASES GRID ── */
        .lp-usecases {
          background: var(--lp-paper-2);
          border-top: 1px solid var(--lp-border);
          padding: var(--lp-space-2xl) 24px;
        }
        .lp-usecases__inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .lp-usecases__heading-block {
          text-align: center;
          margin-bottom: 64px;
        }
        .lp-usecases__eyebrow {
          font-family: var(--lp-font-mono);
          font-size: 12px;
          color: var(--lp-accent);
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }
        .lp-usecases__h2 {
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--lp-ink);
          margin: 0;
        }
        .lp-usecases__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--lp-border);
          border-radius: 16px;
          overflow: hidden;
        }
        .lp-usecase-card {
          background: var(--lp-paper);
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: background var(--lp-dur-med);
        }
        .lp-usecase-card:hover {
          background: var(--lp-paper-3);
        }
        .lp-usecase-card:focus-within {
          outline: 2px solid var(--lp-accent);
        }
        .lp-usecase-card__icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: oklch(60% 0.22 240 / 0.08);
          border: 1px solid oklch(60% 0.22 240 / 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--lp-accent);
        }
        .lp-usecase-card__icon--amber {
          background: oklch(78% 0.16 60 / 0.08);
          border-color: oklch(78% 0.16 60 / 0.2);
          color: var(--lp-accent-amber);
        }
        .lp-usecase-card__icon--green {
          background: oklch(74% 0.18 150 / 0.08);
          border-color: oklch(74% 0.18 150 / 0.2);
          color: var(--lp-accent-green);
        }
        .lp-usecase-card__h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--lp-ink);
          margin: 0;
          letter-spacing: -0.01em;
        }
        .lp-usecase-card__p {
          font-size: 15px;
          color: var(--lp-ink-muted);
          line-height: 1.65;
          margin: 0;
        }
        .lp-usecase-card__link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--lp-accent);
          text-decoration: none;
          font-weight: 600;
          margin-top: auto;
          transition: gap var(--lp-dur-fast);
        }
        .lp-usecase-card__link:hover { gap: 10px; }
        .lp-usecase-card__link:focus-visible {
          outline: 2px solid var(--lp-accent);
          border-radius: 2px;
          outline-offset: 2px;
        }

        /* ── CTA BAND ── */
        .lp-cta-band {
          padding: var(--lp-space-2xl) 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 24px;
          position: relative;
          overflow: hidden;
        }
        .lp-cta-band::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 80% at 50% 0%,
            oklch(60% 0.22 240 / 0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-cta-band__h2 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--lp-ink);
          max-width: 700px;
          margin: 0;
        }
        .lp-cta-band__h2 em {
          font-style: normal;
          color: var(--lp-accent);
        }
        .lp-cta-band__sub {
          font-size: 16px;
          color: var(--lp-ink-muted);
          max-width: 480px;
          margin: 0;
          line-height: 1.6;
        }
        .lp-cta-band__actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* ── FOOTER (Ft5 Statement) ── */
        .lp-footer {
          border-top: 1px solid var(--lp-border);
          background: var(--lp-paper);
          padding: 48px 24px 36px;
        }
        .lp-footer__inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }
        .lp-footer__brand {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 320px;
        }
        .lp-footer__logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--lp-ink);
          font-weight: 700;
          font-size: 15px;
        }
        .lp-footer__logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          background: oklch(60% 0.22 240 / 0.12);
          border: 1px solid oklch(60% 0.22 240 / 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--lp-accent);
        }
        .lp-footer__desc {
          font-size: 13px;
          color: var(--lp-ink-muted);
          line-height: 1.65;
          margin: 0;
        }
        .lp-footer__status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--lp-font-mono);
          font-size: 11px;
          color: var(--lp-accent-green);
        }
        .lp-footer__status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--lp-accent-green);
          animation: lp-pulse 2s ease-in-out infinite;
        }
        .lp-footer__links {
          display: flex;
          gap: 48px;
          flex-wrap: wrap;
        }
        .lp-footer__col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 120px;
        }
        .lp-footer__col-head {
          font-size: 12px;
          font-weight: 700;
          color: var(--lp-ink);
          letter-spacing: 0.06em;
          font-family: var(--lp-font-mono);
        }
        .lp-footer__col a,
        .lp-footer__col span {
          font-size: 13px;
          color: var(--lp-ink-muted);
          text-decoration: none;
          transition: color var(--lp-dur-fast);
          white-space: nowrap;
        }
        .lp-footer__col a:hover { color: var(--lp-ink); }
        .lp-footer__col a:focus-visible {
          outline: 2px solid var(--lp-accent);
          border-radius: 2px;
          outline-offset: 2px;
        }
        .lp-footer__bottom {
          max-width: 1100px;
          margin: 36px auto 0;
          padding-top: 24px;
          border-top: 1px solid var(--lp-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 12px;
          color: var(--lp-ink-muted);
          font-family: var(--lp-font-mono);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .lp-nav { padding: 14px 24px; }
          .lp-nav--scrolled { padding: 10px 24px; }
          .lp-nav__links { display: none; }
          .lp-nav__cta { display: none; }
          .lp-nav__hamburger-btn { display: flex; }
        }

        @media (max-width: 768px) {
          .lp-hero {
            min-height: 100dvh;
            padding-inline: 24px;
          }
          .lp-hero__content { max-width: min(580px, 88%); }
          .lp-hero__bg {
            background:
              linear-gradient(90deg, rgba(3, 7, 18, 0.94) 0%, rgba(3, 7, 18, 0.72) 58%, rgba(3, 7, 18, 0.18) 100%),
              radial-gradient(circle at 75% 50%, rgba(26, 115, 232, 0.15) 0%, transparent 55%);
          }
          .lp-hero.lp-hero--light .lp-hero__bg {
            background:
              linear-gradient(90deg, rgba(248, 250, 252, 0.96) 0%, rgba(248, 250, 252, 0.78) 58%, rgba(248, 250, 252, 0.2) 100%),
              radial-gradient(circle at 75% 50%, rgba(26, 115, 232, 0.18) 0%, transparent 60%);
          }
          .lp-stats__inner { grid-template-columns: 1fr 1fr; }
          .lp-stat { border-right: none; border-bottom: 1px solid var(--lp-border); }
          .lp-stat:nth-child(odd) { border-right: 1px solid var(--lp-border); }

          .lp-features { gap: 72px; padding: 72px 16px; }
          .lp-feature-row { grid-template-columns: 1fr; gap: 40px; direction: ltr; }
          .lp-feature-row--flip { direction: ltr; }
          .lp-measure-visual { grid-template-columns: 1fr; }
          .lp-measure-visual__metrics { grid-template-columns: 1fr 1fr; }

          .lp-usecases__grid { grid-template-columns: 1fr; }

          .lp-footer__inner { flex-direction: column; }
          .lp-footer__links { gap: 32px; }
          .lp-footer__bottom { flex-direction: column; text-align: center; }
        }
        @media (max-width: 414px) {
          .lp-hero { padding: 100px 16px 72px; }
          .lp-hero__content { max-width: 100%; }
          .lp-hero__badge { max-width: 100%; }
          .lp-nav { padding-inline: 16px; }
          .lp-nav--scrolled { padding-inline: 16px; }
          .lp-mobile-drawer__links { gap: 8px; margin-bottom: 20px; }
          .lp-footer__links { width: 100%; gap: 28px 20px; }
          .lp-footer__col { min-width: calc(50% - 10px); }
          .lp-stats__inner { grid-template-columns: 1fr; }
          .lp-stat { border-right: none; }
          .lp-measure-visual__metrics { grid-template-columns: 1fr; }
          .lp-hero__actions { flex-direction: column; width: 100%; }
          .lp-hero__actions .lp-btn { width: 100%; justify-content: center; }
          .lp-cta-band__actions { flex-direction: column; width: 100%; }
          .lp-cta-band__actions .lp-btn { width: 100%; justify-content: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-globe, .lp-globe-pin, .lp-hero__scroll-hint,
          .lp-analytics-bar, .lp-visual-layer, .lp-terrain-contour,
          .lp-hero__badge-dot, .lp-footer__status-dot {
            animation: none !important;
          }
          .lp-hero__content, .lp-feature-row {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className={`lp-root ${isDarkMode ? '' : 'light-mode'}`}>

        {/* ── NAV ── */}
        <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`} role="navigation" aria-label="Main navigation">
          <button className="lp-nav__logo" onClick={() => navigate('/')} aria-label="Web GIS Platform — Trang chủ" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
            <img src={logoImg} alt="Web GIS Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
          </button>

          <ul className="lp-nav__links" role="list">
            {([
              ['platform', [
                ['viewer3DTitle', '/platform/3d-gis'],
                ['platformPointCloud', '/platform/point-cloud-lidar'],
                ['platformAnalysis', '/platform/measurement-analysis'],
                ['platformLayers', '/platform/data-layer-management'],
                ['platformCoordinates', '/platform/vn2000-coordinate-systems'],
                ['platformProjects', '/platform/project-sharing-management'],
              ]],
              ['solutions', [
                ['solSurveying', '/solutions/surveying'],
                ['solConstructionInfra', '/solutions/construction-infrastructure'],
                ['solAgriculture', '/solutions/agriculture'],
                ['solUavMapping', '/solutions/uav-mapping-lidar'],
              ]],
              ['resources', [
                ['resMappingWorkflow', '/dashboard'],
                ['resEquipmentSpecs', '/dashboard'],
                ['res3DOutputs', '/dashboard'],
                ['resDemoMaps', '/dashboard'],
                ['resGuides', '/dashboard'],
              ]],
              ['connect', [
                ['demoRegistration', '/book-demo'],
                ['connectConsultation', '/book-demo'],
                ['connectLoginTrial', isAuthenticated ? '/dashboard' : '/login'],
              ]],
            ] as const).map(([menuKey, items]) => (
              <li
                key={menuKey}
                className="lp-nav__item-with-dropdown"
                onMouseEnter={() => openDropdown(menuKey)}
                onMouseLeave={closeDropdownWithDelay}
              >
                <button
                  className={`lp-nav__link-btn ${activeDropdown === menuKey ? 'is-active' : ''}`}
                  onClick={() => setActiveDropdown(activeDropdown === menuKey ? null : menuKey)}
                  aria-expanded={activeDropdown === menuKey}
                >
                  {t(menuKey)} <ChevronDown size={14} className="lp-nav__chevron" />
                </button>
                {activeDropdown === menuKey && (
                  <div
                    className="lp-nav__dropdown tactile-glass"
                    style={{ width: '280px', padding: '12px' }}
                    onMouseEnter={() => openDropdown(menuKey)}
                    onMouseLeave={closeDropdownWithDelay}
                  >
                    <ul className="lp-nav__mega-col-links">
                      {items.map(([itemKey, route]) => (
                        <li key={itemKey} className="lp-nav__dropdown-item" onClick={() => navigate(route)}>
                          <div className="lp-nav__dropdown-title">{t(itemKey)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="lp-nav__cta">
            <div style={{ position: 'relative' }}>
              <button 
                className="lp-nav__globe-btn" 
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                aria-label="Select language"
              >
                <Globe size={18} />
              </button>
              {langDropdownOpen && (
                <div className="lp-nav__dropdown tactile-glass" style={{ width: '120px', padding: '8px' }}>
                  <div className="lp-nav__dropdown-grid" style={{ gap: '4px' }}>
                    <div 
                      className={`lp-nav__dropdown-item ${currentLang === 'en' ? 'is-hover' : ''}`}
                      style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => { setCurrentLang('en'); setLangDropdownOpen(false); }}
                    >
                      <div className="lp-nav__dropdown-title" style={{ fontSize: '12px' }}>English</div>
                    </div>
                    <div 
                      className={`lp-nav__dropdown-item ${currentLang === 'vi' ? 'is-hover' : ''}`}
                      style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => { setCurrentLang('vi'); setLangDropdownOpen(false); }}
                    >
                      <div className="lp-nav__dropdown-title" style={{ fontSize: '12px' }}>Tiếng Việt</div>
                    </div>
                    <div 
                      className={`lp-nav__dropdown-item ${currentLang === 'zh' ? 'is-hover' : ''}`}
                      style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => { setCurrentLang('zh'); setLangDropdownOpen(false); }}
                    >
                      <div className="lp-nav__dropdown-title" style={{ fontSize: '12px' }}>中文</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              className={`theme-toggle ${isDarkMode ? 'is-dark' : ''}`} 
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle light/dark mode"
            >
              <div className="theme-toggle__clouds">
                <div className="theme-toggle__cloud theme-toggle__cloud-1" />
                <div className="theme-toggle__cloud theme-toggle__cloud-2" />
                <div className="theme-toggle__cloud theme-toggle__cloud-3" />
              </div>
              <div className="theme-toggle__stars">
                <div className="theme-toggle__star theme-toggle__star-1" />
                <div className="theme-toggle__star theme-toggle__star-2" />
                <div className="theme-toggle__star theme-toggle__star-3" />
              </div>
              <div className="theme-toggle__thumb" />
            </button>
            {isAuthenticated ? (
              <>
                <button id="nav-dashboard-btn" className="lp-btn lp-btn--pill-ghost lp-btn--sm" onClick={() => navigate('/dashboard')}>
                  {t('dashboard')} ({user?.fullName.split(' ')[0]}) <ArrowRight size={14} />
                </button>
                <button id="nav-start-btn" className="lp-btn lp-btn--pill-solid lp-btn--sm" onClick={() => navigate('/book-demo')}>
                  {t('bookDemo')}
                </button>
              </>
            ) : (
              <>
                <button id="nav-login-btn" className="lp-btn lp-btn--pill-ghost lp-btn--sm" onClick={() => navigate('/login')}>{t('login')}</button>
                <button id="nav-start-btn" className="lp-btn lp-btn--pill-solid lp-btn--sm" onClick={() => navigate('/book-demo')}>
                  {t('bookDemo')}
                </button>
              </>
            )}
          </div>

          <button 
            className="lp-nav__hamburger-btn" 
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở menu điều hướng"
          >
            <Menu size={24} />
          </button>
        </nav>

        {/* ── MOBILE MENU DRAWER ── */}
        {mobileMenuOpen && (
          <div className="lp-mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile navigation menu">
            <div className="lp-mobile-drawer__header">
              <button className="lp-nav__logo" onClick={() => { setMobileMenuOpen(false); navigate('/'); }} aria-label="Web GIS Platform — Trang chủ" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                <img src={logoImg} alt="Web GIS Logo" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  className={`theme-toggle ${isDarkMode ? 'is-dark' : ''}`} 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  aria-label="Toggle light/dark mode"
                >
                  <div className="theme-toggle__clouds">
                    <div className="theme-toggle__cloud theme-toggle__cloud-1" />
                    <div className="theme-toggle__cloud theme-toggle__cloud-2" />
                    <div className="theme-toggle__cloud theme-toggle__cloud-3" />
                  </div>
                  <div className="theme-toggle__stars">
                    <div className="theme-toggle__star theme-toggle__star-1" />
                    <div className="theme-toggle__star theme-toggle__star-2" />
                    <div className="theme-toggle__star theme-toggle__star-3" />
                  </div>
                  <div className="theme-toggle__thumb" />
                </button>
                <button className="lp-mobile-drawer__close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Đóng menu">
                  <X size={24} />
                </button>
              </div>
            </div>

            <ul className="lp-mobile-drawer__links">
              {([
                ['platform', [
                  ['viewer3DTitle', '/platform/3d-gis'],
                  ['platformPointCloud', '/platform/point-cloud-lidar'],
                  ['platformAnalysis', '/platform/measurement-analysis'],
                  ['platformLayers', '/platform/data-layer-management'],
                  ['platformCoordinates', '/platform/vn2000-coordinate-systems'],
                  ['platformProjects', '/platform/project-sharing-management'],
                ]],
                ['solutions', [
                  ['solSurveying', '/solutions/surveying'],
                  ['solConstructionInfra', '/solutions/construction-infrastructure'],
                  ['solAgriculture', '/solutions/agriculture'],
                  ['solUavMapping', '/solutions/uav-mapping-lidar'],
                ]],
                ['resources', [
                  ['resMappingWorkflow', '/dashboard'],
                  ['resEquipmentSpecs', '/dashboard'],
                  ['res3DOutputs', '/dashboard'],
                  ['resDemoMaps', '/dashboard'],
                  ['resGuides', '/dashboard'],
                ]],
                ['connect', [
                  ['demoRegistration', '/book-demo'],
                  ['connectConsultation', '/book-demo'],
                  ['connectLoginTrial', isAuthenticated ? '/dashboard' : '/login'],
                ]],
              ] as const).map(([menuKey, items]) => (
                <li key={menuKey}>
                  <button
                    className="lp-mobile-drawer__link-btn"
                    onClick={() => setActiveDropdown(activeDropdown === menuKey ? null : menuKey)}
                  >
                    {t(menuKey)} <ChevronDown size={16} style={{ transform: activeDropdown === menuKey ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {activeDropdown === menuKey && (
                    <div className="lp-mobile-drawer__dropdown">
                      {items.map(([itemKey, route]) => (
                        <div key={itemKey} className="lp-mobile-drawer__dropdown-item" onClick={() => { setMobileMenuOpen(false); navigate(route); }}>
                          <div className="lp-mobile-drawer__dropdown-title">{t(itemKey)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', gap: '8px', padding: '0 24px', marginBottom: '8px' }}>
              <button 
                className={`lp-btn lp-btn--sm ${currentLang === 'en' ? 'lp-btn--pill-solid' : 'lp-btn--pill-ghost'}`} 
                style={{ flex: 1, justifyContent: 'center', minHeight: '44px' }}
                onClick={() => setCurrentLang('en')}
              >
                EN
              </button>
              <button 
                className={`lp-btn lp-btn--sm ${currentLang === 'vi' ? 'lp-btn--pill-solid' : 'lp-btn--pill-ghost'}`} 
                style={{ flex: 1, justifyContent: 'center', minHeight: '44px' }}
                onClick={() => setCurrentLang('vi')}
              >
                VI
              </button>
              <button 
                className={`lp-btn lp-btn--sm ${currentLang === 'zh' ? 'lp-btn--pill-solid' : 'lp-btn--pill-ghost'}`} 
                style={{ flex: 1, justifyContent: 'center', minHeight: '44px' }}
                onClick={() => setCurrentLang('zh')}
              >
                ZH
              </button>
            </div>

            <div className="lp-mobile-drawer__cta">
              {isAuthenticated ? (
                <button className="lp-btn lp-btn--pill-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>
                  {t('dashboard')} ({user?.fullName.split(' ')[0]}) <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <button className="lp-btn lp-btn--pill-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>{t('login')}</button>
                  <button className="lp-btn lp-btn--pill-solid" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMobileMenuOpen(false); navigate('/book-demo'); }}>
                    {t('bookDemo')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        <section className={`lp-hero ${!isDarkMode ? 'lp-hero--light' : ''}`} id="platform" aria-label="Hero — Web GIS 3D">
          <div className="lp-hero__bg" />
          <div className="lp-hero__grid" />

          <div className="lp-hero__globe">
            <Globe3DHero isLightMode={!isDarkMode} />
          </div>

          <div className={`lp-hero__content ${heroVisible ? 'lp-hero__content--visible' : ''}`}>
            <div className="lp-hero__badge">
              <span className="lp-hero__badge-dot" />
              {t('heroBadge')}
            </div>
            <h1 className="lp-hero__heading">
              {t('heroHeadingFirst')} <em>{t('heroHeadingSpatial')}</em> {t('heroHeadingLast')}
            </h1>
            <p className="lp-hero__sub">
              {t('heroSub')}
            </p>
            <div className="lp-hero__actions">
              <button id="hero-demo-btn" className="lp-btn lp-btn--primary" onClick={() => navigate('/dashboard')}>
                {t('exploreDemo')} <ArrowRight size={16} />
              </button>
              <a id="hero-docs-btn" href="#features" className="lp-btn lp-btn--ghost">
                {t('learnMore')} <ChevronDown size={16} />
              </a>
            </div>
          </div>

          <div className="lp-hero__scroll-hint" aria-hidden="true">
            <ChevronDown size={16} />
            <span>{t('scrollExplore')}</span>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="lp-stats" aria-label="Stats">
          <div className="lp-stats__inner">
            <div className="lp-stat">
              <div className="lp-stat__value lp-stat__value--accent">{t('gsdVal')}</div>
              <div className="lp-stat__label">{t('gsdLabel')}</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat__value lp-stat__value--amber">{t('fpsVal')}</div>
              <div className="lp-stat__label">{t('fpsLabel')}</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat__value">{t('cloudVal')}</div>
              <div className="lp-stat__label">{t('cloudLabel')}</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat__value lp-stat__value--green">{t('ogcVal')}</div>
              <div className="lp-stat__label">{t('ogcLabel')}</div>
            </div>
          </div>
        </section>

        {/* ── NARRATIVE FEATURE ROWS ── */}
        <section className="lp-features" id="features" aria-label="Tính năng nền tảng">
          <FeatureRow
            index={1}
            icon={<Layers size={14} />}
            label={t('feature1Label')}
            heading={t('feature1Heading')}
            body={t('feature1Body')}
            visual={(
              <LayerStackVisual
                orthophotoLabel={t('layerOrthophoto')}
                meshLabel={t('layerMesh')}
                pointCloudLabel={t('layerPointCloud')}
                elevationLabel={t('layerElevation')}
              />
            )}
          />
          <FeatureRow
            index={2}
            icon={<Satellite size={14} />}
            label={t('feature2Label')}
            heading={t('feature2Heading')}
            body={t('feature2Body')}
            visual={<TerrainVisual expandLabel={t('viewFullscreen')} />}
            flip
          />
          <FeatureRow
            index={3}
            icon={<BarChart3 size={14} />}
            label={t('feature3Label')}
            heading={t('feature3Heading')}
            body={t('feature3Body')}
            visual={<MeasurementVisual />}
          />
        </section>

        {/* ── USE CASES ── */}
        <section className="lp-usecases" id="usecases" aria-label="Use Cases">
          <div className="lp-usecases__inner">
            <div className="lp-usecases__heading-block">
              <div className="lp-usecases__eyebrow">{t('useCasesEyebrow')}</div>
              <h2 className="lp-usecases__h2">{t('useCasesHeading')}</h2>
            </div>
            <div className="lp-usecases__grid">
              <article className="lp-usecase-card">
                <div className="lp-usecase-card__icon"><Map size={20} /></div>
                <h3 className="lp-usecase-card__h3">{t('case1Title')}</h3>
                <p className="lp-usecase-card__p">{t('case1Body')}</p>
              </article>
              <article className="lp-usecase-card">
                <div className="lp-usecase-card__icon lp-usecase-card__icon--amber"><Cpu size={20} /></div>
                <h3 className="lp-usecase-card__h3">{t('case2Title')}</h3>
                <p className="lp-usecase-card__p">{t('case2Body')}</p>
              </article>
              <article className="lp-usecase-card">
                <div className="lp-usecase-card__icon lp-usecase-card__icon--green"><Activity size={20} /></div>
                <h3 className="lp-usecase-card__h3">{t('case3Title')}</h3>
                <p className="lp-usecase-card__p">{t('case3Body')}</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section className="lp-cta-band" id="demo" aria-label="Get Started">
          <h2 className="lp-cta-band__h2">{t('ctaHeading')}</h2>
          <p className="lp-cta-band__sub">{t('ctaSub')}</p>
          <div className="lp-cta-band__actions">
            <button id="cta-start-btn" className="lp-btn lp-btn--primary" onClick={() => navigate('/dashboard')}>
              {t('ctaDemo')} <ArrowRight size={16} />
            </button>
            <button id="cta-book-demo-btn" className="lp-btn lp-btn--ghost" onClick={() => navigate('/book-demo')}>
              {t('ctaApi')}
            </button>
          </div>
        </section>

        {/* ── FOOTER (Ft5 Statement) ── */}
        <footer className="lp-footer" aria-label="Footer">
          <div className="lp-footer__inner">
            <div className="lp-footer__brand">
              <div className="lp-footer__logo">
                <img src={logoImg} alt="SAOLATEK" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
              </div>
              <p className="lp-footer__desc">{t('footerDesc')}</p>
              <div className="lp-footer__status">
                <span className="lp-footer__status-dot" />
                UAV · LiDAR · 3D Mapping
              </div>
            </div>

            <div className="lp-footer__links">
              <div className="lp-footer__col">
                <div className="lp-footer__col-head">{t('prodCol')}</div>
                <a href="#features">{t('features')}</a>
                <a href="#usecases">{t('apps')}</a>
                <a href="#/dashboard">{t('demoMap')}</a>
              </div>
              <div className="lp-footer__col">
                <div className="lp-footer__col-head">{t('techCol')}</div>
                <span>Point Cloud / COPC</span>
                <span>3D Tiles</span>
                <span>VN-2000 / WGS84</span>
                <span>UAV / LiDAR</span>
              </div>
              <div className="lp-footer__col">
                <div className="lp-footer__col-head">{t('accCol')}</div>
                <a href="#/login">{t('login')}</a>
                <a href="#/register">{t('register')}</a>
                <a href="#/book-demo">{t('bookDemo')}</a>
              </div>
            </div>
          </div>
          <div className="lp-footer__bottom">
            <span>{t('rights')}</span>
            <span>Web GIS · Point Cloud · 3D Mapping</span>
          </div>
        </footer>

      </div>
    </>
  );
};