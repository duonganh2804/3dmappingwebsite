import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass,
  ChevronLeft, 
  Globe, 
  Send,
  Activity,
  DollarSign,
  Briefcase,
  Building2,
  FileText
} from 'lucide-react';
import { Button } from '../components/UI/Button';

/* Hallmark · component: pricing-page · genre: atmospheric · theme: DroneDeploy-dark
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (APCA Lc >= 60)
 */

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    size: '1-10',
    notes: ''
  });

  const t = {
    vi: {
      telemetry: 'GEOSPATIAL PRICING TELEMETRY //',
      protocol: 'PROT: BILLING_SECURE',
      title: 'BẢNG GIÁ DỊCH VỤ WEB GIS 3D //',
      subtitle: 'Hệ thống định giá tự động phục vụ trắc địa, đo đạc LiDAR và quản lý bản đồ số.',
      monthly: 'HÀNG THÁNG',
      annual: 'HÀNG NĂM',
      save20: 'TIẾT KIỆM 20%',
      popular: 'KHUYÊN DÙNG //',
      contactSales: 'LIÊN HỆ KINH DOANH',
      featureComparison: 'SO SÁNH TÍNH NĂNG CHI TIẾT //',
      contactTitle: 'YÊU CẦU TƯ VẤN CẤU HÌNH ENTERPRISE //',
      contactSubtitle: 'Hãy điền thông tin bên dưới, kỹ sư hệ thống GIS sẽ liên hệ tư vấn thiết lập trong vòng 24h.',
      name: 'Họ và tên //',
      email: 'Email công việc //',
      phone: 'Số điện thoại //',
      company: 'Tên tổ chức //',
      size: 'Quy mô đội ngũ //',
      notes: 'Yêu cầu trắc địa / Cấu hình máy chủ //',
      submit: 'GỬI YÊU CẦU LIÊN HỆ',
      successMessage: 'YÊU CẦU ĐÃ ĐƯỢC GỬI THÀNH CÔNG. CHÚNG TÔI SẼ LIÊN HỆ LẠI SỚM NHẤT.',
      getStarted: 'BẮT ĐẦU NGAY',
      free: 'MIỄN PHÍ',
      customPrice: 'LIÊN HỆ',
      backToHome: 'QUAY LẠI TRANG CHỦ',
      login: 'ĐĂNG NHẬP',
      dashboard: 'BẢNG ĐIỀU KHIỂN',
    },
    en: {
      telemetry: 'GEOSPATIAL PRICING TELEMETRY //',
      protocol: 'PROT: BILLING_SECURE',
      title: '3D WEB GIS PRICING PLANS //',
      subtitle: 'Select the optimal plan for your reality capture, LiDAR processing, and geospatial mapping workflows.',
      monthly: 'MONTHLY',
      annual: 'ANNUALLY',
      save20: 'SAVE 20%',
      popular: 'MOST POPULAR //',
      contactSales: 'CONTACT SALES',
      featureComparison: 'DETAILED FEATURE COMPARISON //',
      contactTitle: 'REQUEST ENTERPRISE SYSTEM CONFIGURATION //',
      contactSubtitle: 'Leave your details and our GIS systems engineer will reach out within 24 hours.',
      name: 'Full Name //',
      email: 'Work Email //',
      phone: 'Phone Number //',
      company: 'Company Name //',
      size: 'Team Size //',
      notes: 'Geospatial requirements / Server specs //',
      submit: 'SEND ACQUISITION REQUEST',
      successMessage: 'REQUEST SENT SUCCESSFULLY. OUR TEAM WILL GET BACK TO YOU SHORTLY.',
      getStarted: 'GET STARTED NOW',
      free: 'FREE',
      customPrice: 'CUSTOM',
      backToHome: 'BACK TO HOME',
      login: 'LOG IN',
      dashboard: 'DASHBOARD',
    }
  }[lang];

  const plans = [
    {
      name: lang === 'vi' ? 'STARTER // CÁ NHÂN' : 'STARTER // INDIVIDUAL',
      priceMonthly: 0,
      priceAnnual: 0,
      desc: lang === 'vi' ? 'Thích hợp cho cá nhân làm quen bản đồ 3D' : 'For individuals starting with 3D Web GIS',
      icon: DollarSign,
      colorClass: 'text-cyan-400 border-cyan-500/30',
      badge: null,
      features: lang === 'vi' ? [
        'Dung lượng R2: 10 GB',
        'Tối đa 5 dự án hoạt động',
        'Hệ tọa độ WGS84 tiêu chuẩn',
        'Đo đạc 3D cơ bản (Cao độ, chu vi)',
        'Hỗ trợ qua Email thường',
        'Hiển thị WebGL2 60 FPS'
      ] : [
        '10 GB Cloudflare R2 Storage',
        'Up to 5 active projects',
        'Standard WGS84 coordinates',
        'Basic 3D measurements',
        'Standard email support',
        '60 FPS WebGL2 rendering'
      ],
      cta: t.getStarted,
      type: 'free'
    },
    {
      name: lang === 'vi' ? 'PROFESSIONAL // ĐỘI NGŨ' : 'PROFESSIONAL // TEAMS',
      priceMonthly: 249,
      priceAnnual: 199,
      desc: lang === 'vi' ? 'Giải pháp cho các đội khảo sát thực địa & lập bản đồ số chuyên nghiệp' : 'Complete solutions for survey teams & GIS experts',
      icon: Briefcase,
      colorClass: 'text-amber-400 border-amber-500/40',
      badge: t.popular,
      features: lang === 'vi' ? [
        'Dung lượng R2: 150 GB',
        'Không giới hạn dự án',
        'Hệ tọa độ quốc gia VN-2000',
        'Hiển thị mây điểm LiDAR (EDL)',
        'Phân tích thể tích đào đắp (Cut/Fill)',
        'Xuất file DXF, 3D Tiles, GeoJSON',
        'Hỗ trợ kỹ thuật ưu tiên 24/7'
      ] : [
        '150 GB Cloudflare R2 Storage',
        'Unlimited active projects',
        'VN-2000 coordinate system',
        'LiDAR Point Cloud viewer (EDL)',
        'Cut/Fill volume calculation',
        'Export DXF, 3D Tiles, GeoJSON',
        '24/7 Priority support'
      ],
      cta: t.getStarted,
      type: 'popular'
    },
    {
      name: lang === 'vi' ? 'ENTERPRISE // DOANH NGHIỆP' : 'ENTERPRISE // PRIVATE',
      priceMonthly: null,
      priceAnnual: null,
      desc: lang === 'vi' ? 'Hạ tầng riêng biệt, bảo mật tối đa cho dự án quy mô lớn' : 'On-premise deployment, custom integrations & maximum security',
      icon: Building2,
      colorClass: 'text-emerald-400 border-emerald-500/30',
      badge: null,
      features: lang === 'vi' ? [
        'Dung lượng lưu trữ không giới hạn',
        'Triển khai On-Premise / Cloud riêng',
        'Đồng bộ CSDL PostGIS doanh nghiệp',
        'Cấp quyền truy cập API & SDK riêng',
        'Cam kết SLA duy trì hệ thống 99.99%',
        'Kỹ sư hệ thống hỗ trợ riêng biệt'
      ] : [
        'Unlimited R2/S3 storage',
        'Private Cloud / On-Premise deploy',
        'Corporate PostGIS DB sync',
        'Full API & custom SDK access',
        '99.99% system SLA guarantee',
        'Dedicated GIS systems engineer'
      ],
      cta: t.contactSales,
      type: 'enterprise'
    }
  ];

  const compareFeatures = [
    { category: lang === 'vi' ? 'LƯU TRỮ & DỰ ÁN //' : 'STORAGE & PROJECTS //', items: [
      { name: lang === 'vi' ? 'Dung lượng R2 Cloud Storage' : 'R2 Cloud Storage Limit', starter: '10 GB', pro: '150 GB', enterprise: lang === 'vi' ? 'Không giới hạn' : 'Unlimited' },
      { name: lang === 'vi' ? 'Số dự án hoạt động cùng lúc' : 'Active Projects Limit', starter: '5', pro: lang === 'vi' ? 'Không giới hạn' : 'Unlimited', enterprise: lang === 'vi' ? 'Không giới hạn' : 'Unlimited' },
      { name: lang === 'vi' ? 'Băng thông tối ưu mô hình' : 'Model Bandwidth Speed', starter: lang === 'vi' ? 'Tiêu chuẩn' : 'Standard', pro: lang === 'vi' ? 'Tối ưu hóa (CDN)' : 'Optimized (CDN)', enterprise: lang === 'vi' ? 'Dedicated' : 'Dedicated' }
    ]},
    { category: lang === 'vi' ? 'TÍNH NĂNG TRỰC QUAN //' : 'VISUALIZATION & TOOLS //', items: [
      { name: lang === 'vi' ? 'Trình xem 3D Tiles 1.1' : '3D Tiles 1.1 Viewer', starter: true, pro: true, enterprise: true },
      { name: lang === 'vi' ? 'Trình xem mây điểm (COPC)' : 'Point Cloud Viewer (COPC)', starter: true, pro: true, enterprise: true },
      { name: lang === 'vi' ? 'Hiệu ứng EDL làm nét mây điểm' : 'Eye-Dome Lighting (EDL)', starter: false, pro: true, enterprise: true },
      { name: lang === 'vi' ? 'Hộp cắt mô hình 3D (Clipping Box)' : '3D Clipping Box', starter: false, pro: true, enterprise: true }
    ]},
    { category: lang === 'vi' ? 'PHÂN TÍCH KHÔNG GIAN //' : 'GEODESY & ANALYSIS //', items: [
      { name: lang === 'vi' ? 'Đo khoảng cách & cao độ' : 'Distance & Height measurement', starter: true, pro: true, enterprise: true },
      { name: lang === 'vi' ? 'Đo diện tích & chu vi' : 'Area & Perimeter measurement', starter: true, pro: true, enterprise: true },
      { name: lang === 'vi' ? 'Tính toán thể tích đào đắp (Cut/Fill)' : 'Cut & Fill volume calculation', starter: false, pro: true, enterprise: true },
      { name: lang === 'vi' ? 'Tích hợp tọa độ quốc gia VN-2000' : 'VN-2000 Coordinate System', starter: false, pro: true, enterprise: true }
    ]},
    { category: lang === 'vi' ? 'BẢO MẬT & HỆ THỐNG //' : 'SECURITY & SYSTEM //', items: [
      { name: lang === 'vi' ? 'Quyền truy cập API & SDK' : 'API & SDK Scripting Access', starter: false, pro: false, enterprise: true },
      { name: lang === 'vi' ? 'Cơ sở dữ liệu PostGIS riêng biệt' : 'Dedicated PostGIS Database', starter: false, pro: false, enterprise: true },
      { name: lang === 'vi' ? 'Đăng nhập một lần (SSO)' : 'Single Sign-On (SSO)', starter: false, pro: false, enterprise: true }
    ]}
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setFormSubmitted(true);
      setLoading(false);
      setFormData({ name: '', email: '', phone: '', company: '', size: '1-10', notes: '' });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-sans geo-grid-bg relative pb-20">
      
      {/* ── TOPBAR HEADER NAVIGATION (TACTICAL HUD STYLE) ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Back button & Brand Telemetry */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="w-8 h-8 rounded border border-cyan-500/30 text-cyan-400 flex items-center justify-center bg-slate-900/60 hover:bg-cyan-950/40 hover:border-cyan-400 transition-colors cursor-pointer"
              title={t.backToHome}
            >
              <ChevronLeft size={16} />
            </button>
            <div 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 font-mono text-[14px] font-bold text-white tracking-wider cursor-pointer select-none"
            >
              <Compass size={18} className="text-cyan-400" />
              <span>GEO-SPATIAL <span className="text-cyan-400">3D //</span></span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-5">
            {/* Lang Switcher */}
            <button 
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className="font-mono text-[11px] text-cyan-400 border border-cyan-500/20 px-3 py-1.5 bg-slate-900/50 hover:bg-cyan-950/20 hover:border-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Globe size={12} className="text-cyan-400" />
              <span>{lang === 'vi' ? 'EN //' : 'VI //'}</span>
            </button>

            <button 
              onClick={() => navigate('/book-demo')}
              className="font-mono text-xs font-bold text-cyan-400 border border-cyan-500/40 hover:bg-cyan-950/40 px-3 py-1.5 transition-all cursor-pointer"
            >
              BOOK DEMO //
            </button>

            <button 
              onClick={() => navigate('/login')}
              className="font-mono text-xs text-slate-300 hover:text-white uppercase tracking-wider cursor-pointer"
            >
              {t.login}
            </button>

            <button 
              onClick={() => navigate('/dashboard')}
              className="font-mono text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-4 py-2 border border-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all cursor-pointer"
            >
              {t.dashboard}
            </button>
          </div>

        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="pt-32 pb-12 text-center relative px-6">
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-gradient-to-b from-cyan-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-4 relative">
          
          {/* Sub-Telemetry header */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-500/20 text-[10px] font-mono text-cyan-400 tracking-wider">
            <Activity size={10} className="animate-pulse" />
            <span>PRICING ENGINE ACTIVE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase font-sans">
            {t.title}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-mono max-w-2xl mx-auto">
            {t.subtitle}
          </p>

          {/* ── BILLING CYCLE SELECTOR (SQUARE HUD STYLE) ── */}
          <div className="inline-flex border border-cyan-500/20 bg-slate-950/90 p-1 mt-6">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`font-mono text-[10px] tracking-wider px-4 py-2 transition-all cursor-pointer ${
                !isAnnual 
                  ? 'bg-cyan-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.monthly}
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`font-mono text-[10px] tracking-wider px-4 py-2 transition-all cursor-pointer flex items-center gap-2 ${
                isAnnual 
                  ? 'bg-cyan-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{t.annual}</span>
              <span className={`text-[9px] px-2 py-0.5 font-bold ${
                isAnnual ? 'bg-slate-950 text-cyan-400' : 'bg-amber-400 text-slate-950'
              }`}>
                {t.save20}
              </span>
            </button>
          </div>

        </div>
      </section>

      {/* ── THREE PRICING CARDS (HUD STYLE - SQUARE CORNERS & TICKS) ── */}
      <section className="max-w-7xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => {
            const isPro = plan.type === 'popular';
            const isEnt = plan.type === 'enterprise';
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            const PlanIcon = plan.icon;

            return (
              <div 
                key={idx}
                className={`tech-card corner-ticks p-8 bg-slate-950/90 border relative flex flex-col ${
                  isPro 
                    ? 'border-amber-500/40 shadow-[0_0_40px_rgba(255,176,0,0.1)]' 
                    : 'border-cyan-500/20 shadow-[0_0_30px_rgba(0,240,255,0.05)]'
                }`}
              >
                {/* Popular indicator line & badge */}
                {isPro && (
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-400 shadow-[0_0_10px_#FFB000]" />
                )}

                {plan.badge && (
                  <span className="absolute top-6 right-6 font-mono text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-1 tracking-wider">
                    {plan.badge}
                  </span>
                )}

                {/* Plan Title & Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 bg-slate-900 border ${plan.colorClass}`}>
                    <PlanIcon size={20} />
                  </div>
                  <h3 className="font-sans font-bold text-lg text-white uppercase tracking-wider">
                    {plan.name}
                  </h3>
                </div>

                <p className="text-slate-400 text-xs font-mono min-h-[32px] mb-6 leading-relaxed">
                  {plan.desc}
                </p>

                {/* Price telemetry */}
                <div className="border-t border-slate-800/80 pt-6 mb-6 flex items-baseline gap-1 font-mono">
                  {plan.priceMonthly === 0 ? (
                    <span className="text-3xl font-bold text-white tracking-wider">{t.free}</span>
                  ) : plan.priceMonthly === null ? (
                    <span className="text-3xl font-bold text-white tracking-wider">{t.customPrice}</span>
                  ) : (
                    <>
                      <span className="text-sm text-slate-500">$</span>
                      <span className="text-4xl font-bold text-white leading-none tracking-tight">{price}</span>
                      <span className="text-xs text-slate-500">/{lang === 'vi' ? 'THÁNG' : 'MO'}</span>
                    </>
                  )}
                </div>

                {/* Buy Button */}
                <Button 
                  onClick={() => {
                    if (isEnt) {
                      document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate('/register');
                    }
                  }}
                  className={`w-full py-3 font-mono font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 rounded-none transition-all cursor-pointer ${
                    isPro 
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200 shadow-[0_0_15px_rgba(255,176,0,0.2)]'
                      : isEnt 
                      ? 'bg-transparent hover:bg-emerald-950/20 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-transparent hover:bg-cyan-950/20 text-cyan-400 border border-cyan-500/40'
                  }`}
                >
                  {plan.cta}
                </Button>

                {/* Features Checklist */}
                <div className="mt-8 border-t border-slate-800/80 pt-6 flex-1">
                  <ul className="space-y-4">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          isPro 
                            ? 'bg-amber-950/40 border-amber-500/30 text-amber-400' 
                            : 'bg-cyan-950/40 border-cyan-500/20 text-cyan-400'
                        }`}>
                          ✓
                        </span>
                        <span className="text-slate-300 text-xs font-mono leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* ── DETAILED COMPARISON TABLE (TELEMETRY STYLE) ── */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <FileText size={18} className="text-cyan-400" />
          <h2 className="font-sans font-bold text-xl text-white uppercase tracking-wider">
            {t.featureComparison}
          </h2>
        </div>

        <div className="tech-card corner-ticks bg-slate-950/90 border border-cyan-500/20 overflow-hidden shadow-2xl rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-width-[750px] font-mono text-xs">
              <thead>
                <tr className="bg-slate-900 border-b border-cyan-500/20">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[40%]">TÍNH NĂNG / SPECS //</th>
                  <th className="p-4 text-[10px] font-bold text-white uppercase tracking-widest text-center">STARTER</th>
                  <th className="p-4 text-[10px] font-bold text-amber-400 uppercase tracking-widest text-center bg-amber-950/10">PROFESSIONAL</th>
                  <th className="p-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody>
                {compareFeatures.map((cat, cIdx) => (
                  <React.Fragment key={cIdx}>
                    {/* Category Title Row */}
                    <tr className="bg-cyan-950/10 border-b border-cyan-500/10">
                      <td colSpan={4} className="p-3 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                        {cat.category}
                      </td>
                    </tr>

                    {/* Category Items */}
                    {cat.items.map((item, iIdx) => (
                      <tr key={iIdx} className="border-b border-slate-900/60 hover:bg-slate-900/20 transition-colors">
                        <td className="p-4 text-slate-300 font-semibold">{item.name}</td>
                        <td className="p-4 text-center text-slate-400">
                          {typeof item.starter === 'boolean' ? (
                            item.starter ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">—</span>
                          ) : item.starter}
                        </td>
                        <td className="p-4 text-center text-white bg-amber-950/5">
                          {typeof item.pro === 'boolean' ? (
                            item.pro ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">—</span>
                          ) : item.pro}
                        </td>
                        <td className="p-4 text-center text-slate-400">
                          {typeof item.enterprise === 'boolean' ? (
                            item.enterprise ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">—</span>
                          ) : item.enterprise}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE INQUIRY FORM (CORNER TICKS & HUD SHADOW) ── */}
      <section id="contact-form" className="max-w-3xl mx-auto px-6">
        <div className="tech-card corner-ticks p-8 bg-slate-950/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.12)] rounded-none relative">
          
          {/* Header Telemetry */}
          <div className="flex items-center justify-between font-mono text-[11px] text-cyan-400 border-b border-cyan-500/20 pb-3 mb-6">
            <div className="flex items-center gap-2">
              <Activity size={14} className="animate-pulse text-cyan-400" />
              <span>ACQUISITION GATEWAY //</span>
            </div>
            <span className="text-slate-500">PROT: REQUEST_INBOUND</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans text-center mb-2">
            {t.contactTitle}
          </h2>
          <p className="text-slate-400 text-xs font-mono text-center mb-8 leading-relaxed max-w-xl mx-auto">
            {t.contactSubtitle}
          </p>

          {formSubmitted ? (
            <div className="p-6 bg-emerald-950/40 border border-emerald-500/30 text-center flex flex-col items-center gap-3">
              <span className="w-10 h-10 rounded border border-emerald-500/40 bg-emerald-900/60 flex items-center justify-center text-emerald-400">
                ✓
              </span>
              <div className="font-mono text-xs text-white font-bold tracking-widest">
                {t.successMessage}
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono text-xs text-slate-300 uppercase mb-2">{t.name}</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2.5 bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors rounded-none"
                    placeholder="NGUYEN VAN A //"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-slate-300 uppercase mb-2">{t.email}</label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2.5 bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors rounded-none"
                    placeholder="corporate@gis-project.vn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono text-xs text-slate-300 uppercase mb-2">{t.phone}</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    required 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2.5 bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors rounded-none"
                    placeholder="0901234567 //"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-slate-300 uppercase mb-2">{t.company}</label>
                  <input 
                    type="text" 
                    name="company" 
                    value={formData.company} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2.5 bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors rounded-none"
                    placeholder="GEOSPATIAL CO. //"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-slate-300 uppercase mb-2">{t.size}</label>
                <select 
                  name="size" 
                  value={formData.size} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2.5 bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors rounded-none cursor-pointer"
                >
                  <option value="1-10">1 - 10 {lang === 'vi' ? 'NHÂN SỰ' : 'MEMBERS'}</option>
                  <option value="11-50">11 - 50 {lang === 'vi' ? 'NHÂN SỰ' : 'MEMBERS'}</option>
                  <option value="51-200">51 - 200 {lang === 'vi' ? 'NHÂN SỰ' : 'MEMBERS'}</option>
                  <option value="200+">200+ {lang === 'vi' ? 'NHÂN SỰ' : 'MEMBERS'}</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs text-slate-300 uppercase mb-2">{t.notes}</label>
                <textarea 
                  name="notes" 
                  rows={4} 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2.5 bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors rounded-none resize-none"
                  placeholder="Mô tả chi tiết cấu hình máy chủ / hệ tọa độ sử dụng... //"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs tracking-wider uppercase border border-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2 rounded-none transition-all cursor-pointer"
              >
                <Send size={14} />
                {loading ? 'TRANSMITTING...' : t.submit}
              </Button>

            </form>
          )}

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-20 pt-12 border-t border-slate-900 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 font-mono text-sm font-bold text-white tracking-wider mb-4">
            <Compass size={18} className="text-cyan-400" />
            <span>GEO-SPATIAL <span className="text-cyan-400">3D //</span></span>
          </div>
          <p className="text-slate-400 text-[11px] font-mono leading-relaxed max-w-xl mx-auto mb-6">
            {lang === 'vi' 
              ? 'NỀN TẢNG WEB GIS HỖ TRỢ CHUẨN OGC, WEBGL2, CESIUMJS VÀ 3D TILES 1.1. PHÁT TRIỂN & TỐI ƯU BỞI SAOLATEK VIỆT NAM.'
              : 'ENTERPRISE WEB GIS PLATFORM SUPPORTING OGC, WEBGL2, CESIUMJS AND 3D TILES 1.1. DEVELOPED BY SAOLATEK VIETNAM.'}
          </p>
          <div className="font-mono text-[10px] text-slate-500">
            © 2026 GEO-SPATIAL 3D. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>

    </div>
  );
};
