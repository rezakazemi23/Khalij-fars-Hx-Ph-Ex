import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Eye,
  SlidersHorizontal,
  HeartPulse,
  User,
  Stethoscope,
  FileCheck,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import {
  HospitalFormData,
  initialHospitalFormData,
  buildHospitalPagesHTML,
  buildWordDocumentContent,
  buildDocxBlob,
  isIOSDevice,
  sanitizeFileName,
  calculateClinicalPagination
} from './utils/hospitalSheet';

import { generateStandaloneHtmlString } from './utils/standaloneHtmlGenerator';

const SPECIALTY_PRESETS: Record<string, {
  name: string;
  hpi: Array<{ label: string; target: keyof HospitalFormData; text: string }>;
  pe: Array<{ label: string; target: keyof HospitalFormData; text: string }>;
}> = {
  general: {
    name: 'عمومی و اورژانس (General / Emergency)',
    hpi: [
      { label: '+ علائم حیاتی پایدار', target: 'hpi', text: 'علائم حیاتی بیمار در بدو ورود پایدار است. ' },
      { label: '+ نفی تروما', target: 'hpi', text: 'بیمار سابقه تروما یا آسیب فیزیکی اخیر را نفی می‌کند. ' },
      { label: '+ عدم حساسیت (NKDA)', target: 'allergy', text: 'NKDA (فاقد حساسیت دارویی و غذایی شناخته شده)' }
    ],
    pe: [
      { label: '+ ظاهر عمومی خوب', target: 'pe_ga', text: 'بیمار هوشیار، آگاه، بدون دیسترس حاد تنفسی، ظاهر Ill یا Toxic ندارد.' },
      { label: '+ هوشیاری کامل (GCS=15)', target: 'pe_neuro', text: 'هوشیار و آگاه به زمان، مکان و شخص (GCS: 15/15)، بدون نقص عصبی فوکال.' },
      { label: '+ سمع قلب و ریه نرمال', target: 'pe_cvs', text: 'S1 و S2 نرمال، بدون سوفل؛ ریتم منظم.' }
    ]
  },
  internal: {
    name: 'داخلی (Internal Medicine)',
    hpi: [
      { label: '+ سابقه HTN و DM', target: 'pmh', text: 'سابقه پرفشاری خون (HTN) و دیابت نوع ۲ تحت درمان دارویی. ' },
      { label: '+ نفی درد قلبی و تنگی نفس', target: 'hpi', text: 'بیمار درد قفسه سینه، تپش قلب، ارتپنه و PND را نفی می‌کند. ' },
      { label: '+ داروهای قلبی-داخلی', target: 'drugs_addiction', text: 'مصرف روزانه لوزارتان، متفورمین و آتورواستاتین. ' }
    ],
    pe: [
      { label: "+ ظاهر عمومی داخلی", target: "pe_ga", text: "بیمار هوشیار، در وضعیت نشسته راحت، بدون سیانوز یا ایکتر." },
      { label: "+ سمع ریه شفاف", target: "pe_chest", text: "سمع هر دو ریه شفاف، بدون رال یا ویزینگ." },
      { label: "+ عدم ادم اندام", target: "pe_ext", text: "نبض‌های محیطی قرینه؛ بدون ادم گوده‌گذار." }
    ]
  },
  surgery: {
    name: 'جراحی (General Surgery)',
    hpi: [
      { label: '+ وضعیت ناشتایی (NPO)', target: 'hpi', text: 'بیمار از ۶ ساعت قبل ناشتا (NPO) می‌باشد. ' },
      { label: '+ درد شکم جراحی', target: 'hpi', text: 'بیمار با شکایت درد شکم از چند ساعت قبل همراه با تهوع مراجعه نموده است. ' },
      { label: '+ نفی مصرف ضدانعقاد', target: 'drugs_addiction', text: 'عدم مصرف داروهای ضدانعقاد (آسپرین، وارفارین، پلاویکس). ' }
    ],
    pe: [
      { label: '+ ظاهر عمومی جراحی', target: 'pe_ga', text: 'بیمار هوشیار، به علت درد شکمی کمی بی‌قرار است.' },
      { label: '+ شکم نرم بدون گاردینگ', target: 'pe_abd', text: 'شکم نرم، بدون دیستانسیون، تندرنس، ریباند یا گاردینگ.' },
      { label: '+ تندرنس RLQ', target: 'pe_abd', text: 'تندرنس موضعی در ناحیه RLQ؛ علامت ریباند مثبت.' }
    ]
  },
  pediatrics: {
    name: 'کودکان (Pediatrics)',
    hpi: [
      { label: '+ واکسیناسیون کامل', target: 'pmh', text: 'واکسیناسیون کودک مطابق جدول کشوری کامل است. ' },
      { label: '+ زایمان و رشد طبیعی', target: 'pmh', text: 'حاصل زایمان ترم، وزن تولد نرمال، رشد متناسب با سن. ' }
    ],
    pe: [
      { label: '+ ظاهر عمومی کودک', target: 'pe_ga', text: 'کودک هوشیار، فعال، هیدراتاسیون مخاطی مناسب، بدون دیسترس تنفسی.' },
      { label: '+ فونتانل طبیعی', target: 'pe_skull', text: 'نرموسفال، فونتانل قدامی باز و هم‌سطح.' },
      { label: '+ اتوسکوپی گوش نرمال', target: 'pe_ear', text: 'کانال گوش و پرده تمپان دو طرف طبیعی.' }
    ]
  },
  obgyn: {
    name: 'زنان و زایمان (OB/GYN)',
    hpi: [
      { label: '+ شرح مامایی (G/P/A/L)', target: 'pmh', text: 'G: 2 , P: 1 , Ab: 0 , L: 1. ' },
      { label: '+ حرکات جنین طبیعی', target: 'hpi', text: 'حرکات جنین طبیعی؛ نفی آبریزش (ROM) یا خونریزی واژینال. ' }
    ],
    pe: [
      { label: '+ ظاهر عمومی بارداری', target: 'pe_ga', text: 'بیمار هوشیار و پایدار، بدون ادم صورت یا علائم پره‌اکلامپسی.' },
      { label: '+ معاینه شکم بارداری و FHR', target: 'pe_abd', text: 'صدای قلب جنین (FHR) منظم و طبیعی، بدون کنتراکشن رحمی.' }
    ]
  }
};

const STORAGE_KEY = 'khalij_fars_ehr_form_react_v1';

export default function App() {
  const [formData, setFormData] = useState<HospitalFormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialHospitalFormData;
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'htmlCode'>('editor');
  const [saveStatus, setSaveStatus] = useState<string>('✓ ذخیره خودکار فعال');
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [copiedCode, setCopiedCode] = useState(false);

  // Debounced Auto-save to localStorage (avoids blocking UI thread on every keystroke)
  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        setSaveStatus('ذخیره شد ✓');
        resetTimer = setTimeout(() => setSaveStatus('✓ ذخیره خودکار فعال'), 1600);
      } catch (e) {
        setSaveStatus('⚠ حافظه مرورگر در دسترس نیست');
      }
    }, 600);
    return () => {
      clearTimeout(saveTimer);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [formData]);

  const handleChange = (field: keyof HospitalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAppendText = (field: keyof HospitalFormData, text: string) => {
    setFormData(prev => {
      const current = prev[field] || '';
      const updated = current ? `${current.trim()} ${text}` : text;
      return { ...prev, [field]: updated };
    });
  };

  const handleSetNormal = (field: keyof HospitalFormData) => {
    handleChange(field, '×');
  };

  const handleSetAllOrgansNormal = () => {
    const organFields: Array<keyof HospitalFormData> = [
      'pe_skin', 'pe_skull', 'pe_ear', 'pe_head_neck', 'pe_eyes',
      'pe_cvs', 'pe_chest', 'pe_abd', 'pe_ext', 'pe_neuro'
    ];
    setFormData(prev => {
      const updated = { ...prev };
      organFields.forEach(f => {
        if (!updated[f] || !updated[f].trim()) {
          updated[f] = '×';
        }
      });
      return updated;
    });
  };

  const handleFillNormalVitals = () => {
    setFormData(prev => ({
      ...prev,
      vs_bp: '120/80 mmHg',
      vs_pr: '78 /min',
      vs_rr: '16 /min',
      vs_t: '36.8 °C',
      vs_spo2: '98 %'
    }));
  };

  const handleResetForm = () => {
    if (!window.confirm('آیا می‌خواهید تمام اطلاعات فرم پاک شود؟')) return;
    setFormData({
      ...initialHospitalFormData,
      patient_name: '',
      patient_family: '',
      patient_father: '',
      rec_no: '',
      birth_date: '',
      ward_name: '',
      room_no: '',
      bed_no: '',
      attending_physician: '',
      adm_date: '',
      adm_time: '',
      user_code: '',
      chief_complaint: '',
      hpi: '',
      pmh: '',
      drugs_addiction: '',
      allergy: '',
      family_history: '',
      pe_ga: '',
      vs_bp: '',
      vs_pr: '',
      vs_rr: '',
      vs_t: '',
      vs_spo2: '',
      pe_vitals_note: '',
      pe_skin: '',
      pe_skull: '',
      pe_ear: '',
      pe_head_neck: '',
      pe_eyes: '',
      pe_cvs: '',
      pe_chest: '',
      pe_abd: '',
      pe_ext: '',
      pe_neuro: '',
      clinical_summary: '',
      primary_dx: '',
      examining_physician: ''
    });
  };

  const handleLoadSample = () => {
    if (window.confirm('آیا می‌خواهید نمونه داده‌های بالینی کامل بارگذاری شوند؟')) {
      setFormData(initialHospitalFormData);
    }
  };

  // Build Pages and calculation result
  const { page1, page2, pagination } = useMemo(() => {
    return buildHospitalPagesHTML(formData);
  }, [formData]);

  const forceDownloadBlob = (blob: Blob, fileName: string) => {
    const nav = window.navigator as Navigator & { msSaveOrOpenBlob?: (b: Blob, n: string) => void };
    if (nav && nav.msSaveOrOpenBlob) {
      nav.msSaveOrOpenBlob(blob, fileName);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Keep object URL alive for 15s so mobile OS download managers (iOS/Android) complete reading
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 15000);
  };

  const handleDownloadWord = () => {
    if (!formData.patient_family.trim() && !formData.patient_name.trim()) {
      if (!window.confirm('نام و نام خانوادگی بیمار خالی است. آیا مایلید فایل بدون نام بیمار دانلود شود؟')) {
        return;
      }
    }

    try {
      setSaveStatus('📥 در حال ساخت فایل .docx...');
      // Build synchronously (<2ms with CRC32 lookup table + cache) to preserve User Activation gesture on iOS/Android
      const blob = buildDocxBlob(formData);
      const name = sanitizeFileName(formData.patient_family || formData.patient_name);
      const fileName = `شرح_حال_${name}_R173.docx`;

      if (isIOSDevice() && typeof navigator.canShare === 'function') {
        const file = new File([blob], fileName, {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        if (navigator.canShare({ files: [file] })) {
          navigator
            .share({ files: [file], title: 'برگ شرح حال', text: 'فایل Word بیمارستان شهدای خلیج فارس' })
            .then(() => setSaveStatus('✓ اشتراک‌گذاری انجام شد'))
            .catch(err => {
              if (err && err.name !== 'AbortError') {
                forceDownloadBlob(blob, fileName);
                setSaveStatus('✓ فایل دانلود شد');
              } else {
                setSaveStatus('✓ ذخیره خودکار فعال');
              }
            });
          return;
        }
      }

      forceDownloadBlob(blob, fileName);
      setSaveStatus('✓ فایل دانلود شد');
    } catch (err) {
      console.error('Error generating .docx file:', err);
      setSaveStatus('⚠ خطا در ساخت فایل');
    }
  };

  const handleDownloadStandaloneHtml = () => {
    try {
      const htmlString = generateStandaloneHtmlString();
      const blob = new Blob(['\ufeff' + htmlString], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = 'khalij_fars_hospital_sheet_fixed.html';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 7000);
    } catch (err) {
      const htmlString = generateStandaloneHtmlString();
      const link = document.createElement('a');
      link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent('\ufeff' + htmlString);
      link.download = 'khalij_fars_hospital_sheet_fixed.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentSpecialty = SPECIALTY_PRESETS[formData.specialtySelect] || SPECIALTY_PRESETS.general;

  // Standalone HTML text for copying
  const standaloneHtmlCode = useMemo(() => generateStandaloneHtmlString(), []);

  const handleCopyCode = () => {
    if (!standaloneHtmlCode) return;
    navigator.clipboard.writeText(standaloneHtmlCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans" dir="rtl">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-teal-950 via-teal-900 to-cyan-900 text-white shadow-md sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-xs border border-white/10">
              <Stethoscope className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="font-bold text-sm md:text-base leading-tight flex items-center gap-2">
                بیمارستان شهدای خلیج فارس بوشهر
                <span className="text-xs bg-cyan-700/60 text-cyan-200 px-2 py-0.5 rounded-full font-medium">فرم استاندارد R173</span>
              </h1>
              <p className="text-xs text-cyan-200/80">برگ شرح حال و معاینه بدنی (۲ صفحه با مدیریت هوشمند سرریز از پایین صفحه)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saveStatus}
            </span>

            <button
              onClick={handleDownloadWord}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="دانلود فایل خروجی استاندارد Word (.docx) سازگار با موبایل و کامپیوتر"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              دانلود ورد اصلی (.docx)
            </button>

            <button
              onClick={handlePrint}
              className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="چاپ مستقیم یا ذخیره با فرمت PDF"
            >
              <Printer className="w-4 h-4 text-cyan-200" />
              چاپ / ذخیره PDF
            </button>

            <button
              onClick={handleDownloadStandaloneHtml}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="دانلود فایل مستقل HTML کامل جهت استفاده آفلاین"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              دانلود فایل مستقل HTML
            </button>

            <button
              onClick={handleLoadSample}
              className="bg-teal-700/80 hover:bg-teal-700 text-white text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="بارگذاری مجدد نمونه بالینی"
            >
              <Sparkles className="w-3.5 h-3.5" />
              نمونه کامل
            </button>

            <button
              onClick={handleResetForm}
              className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="پاک کردن فرم"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              پاک کردن
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-white/10 bg-teal-950/60 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex gap-1 py-1.5">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'editor'
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-cyan-100 hover:bg-white/10'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                ویرایشگر فرم و پیش‌نمایش موازی
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-cyan-100 hover:bg-white/10'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                فقط پیش‌نمایش دو صفحه‌ای A4
              </button>
              <button
                onClick={() => setActiveTab('htmlCode')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'htmlCode'
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-cyan-100 hover:bg-white/10'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                کد HTML نهایی و مستقل
              </button>
            </div>

            {/* Pagination Capacity Indicator */}
            <div className="hidden md:flex items-center gap-3 text-xs text-cyan-100">
              <span className="text-[11px] text-cyan-300">
                گنجایش صفحه اول: <b>{pagination.totalPage1Units}</b> / {pagination.maxPage1Budget} واحد
              </span>
              <div className="w-24 bg-teal-900 rounded-full h-2 overflow-hidden border border-cyan-700/50">
                <div
                  className={`h-full transition-all duration-300 ${
                    pagination.totalPage1Units > pagination.maxPage1Budget
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{
                    width: `${Math.min(100, (pagination.totalPage1Units / pagination.maxPage1Budget) * 100)}%`
                  }}
                />
              </div>
              <span className="text-[11px] bg-teal-800/80 px-2 py-0.5 rounded-sm">
                {pagination.page1OverflowOccurred
                  ? `انتقال منظم از انتهای صفحه به صفحه دوم (${pagination.p2MovedOrgans.length} ارگان منتقل شد)`
                  : 'تمام فیلدها در صفحه اول قرار دارند'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Banner about the solution */}
        <div className="bg-white border border-teal-200 border-r-4 border-r-teal-600 rounded-xl p-4 shadow-xs no-print">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-50 rounded-lg text-teal-700 mt-0.5">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-teal-950">
                  حل قطعی مشکل سرریز خطوط: نظم دقیق و انتقال طبیعی از پایین صفحه اول
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  در نسخه پیشین، با تایپ شرح حال طولانی، متن بلافاصله در همان نقطه شکسته می‌شد یا نظم کادرها به هم می‌ریخت.
                  اکنون الگوریتم اصلاح‌شده مانند کاغذ واقعی عمل می‌کند: با طولانی شدن هر بخش، عناصر <b>دقیقاً از انتهای صفحه اول</b> (گوش ⬅️ جمجمه ⬅️ پوست ⬅️ علائم حیاتی ⬅️ وضعیت ظاهری ⬅️ سوابق فامیلی ⬅️ حساسیت ⬅️ داروها) گام‌به‌گام به بالای صفحه دوم منتقل می‌شوند تا ساختار سند کاملاً بدون نقص باقی بماند.
                </p>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-1 text-xs">
              <span className="font-medium text-slate-500">خروجی‌ها:</span>
              <div className="flex gap-1.5">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-medium border border-blue-200">Word .doc کامل</span>
                <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded text-[11px] font-medium border border-cyan-200">PDF / پرینت A4</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">HTML آفلاین</span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: Editor + Live Preview */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <div className="lg:col-span-5 flex flex-col gap-5 no-print">
              {/* Specialty Selector & Clinical Helpers */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-teal-600" />
                    انتخاب بخش / سرویس بالینی:
                  </label>
                  <select
                    value={formData.specialtySelect}
                    onChange={e => handleChange('specialtySelect', e.target.value)}
                    className="text-xs font-bold text-teal-900 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="general">عمومی و اورژانس (General / Emergency)</option>
                    <option value="internal">داخلی (Internal Medicine)</option>
                    <option value="surgery">جراحی (General Surgery)</option>
                    <option value="pediatrics">کودکان (Pediatrics)</option>
                    <option value="obgyn">زنان و زایمان (OB/GYN)</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                      درج سریع در شرح حال (HPI):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentSpecialty.hpi.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAppendText(chip.target, chip.text)}
                          className="text-[11px] bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 px-2 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                      درج سریع در معاینات (PE):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentSpecialty.pe.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAppendText(chip.target, chip.text)}
                          className="text-[11px] bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 border border-slate-200 hover:border-cyan-300 px-2 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1: Patient Admission Info */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-600" />
                    ۱. مشخصات پایه و پذیرش بیمار
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Report: R173</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">شماره پرونده:</label>
                    <input
                      type="text"
                      value={formData.rec_no}
                      onChange={e => handleChange('rec_no', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">نام خانوادگی:</label>
                    <input
                      type="text"
                      value={formData.patient_family}
                      onChange={e => handleChange('patient_family', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">نام بیمار:</label>
                    <input
                      type="text"
                      value={formData.patient_name}
                      onChange={e => handleChange('patient_name', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">نام پدر:</label>
                    <input
                      type="text"
                      value={formData.patient_father}
                      onChange={e => handleChange('patient_father', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">تاریخ تولد:</label>
                    <input
                      type="text"
                      value={formData.birth_date}
                      onChange={e => handleChange('birth_date', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">بخش بستری:</label>
                    <input
                      type="text"
                      value={formData.ward_name}
                      onChange={e => handleChange('ward_name', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">اتاق / تخت:</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="اتاق"
                        value={formData.room_no}
                        onChange={e => handleChange('room_no', e.target.value)}
                        className="w-1/2 px-2 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden text-center"
                      />
                      <input
                        type="text"
                        placeholder="تخت"
                        value={formData.bed_no}
                        onChange={e => handleChange('bed_no', e.target.value)}
                        className="w-1/2 px-2 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden text-center"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">پزشک معالج:</label>
                    <input
                      type="text"
                      value={formData.attending_physician}
                      onChange={e => handleChange('attending_physician', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">تاریخ پذیرش:</label>
                    <input
                      type="text"
                      value={formData.adm_date}
                      onChange={e => handleChange('adm_date', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ساعت پذیرش:</label>
                    <input
                      type="text"
                      value={formData.adm_time}
                      onChange={e => handleChange('adm_time', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">کد کاربر (User):</label>
                    <input
                      type="text"
                      value={formData.user_code}
                      onChange={e => handleChange('user_code', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Fields (Page 1) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    ۲. فیلدهای بالینی صفحه اول
                  </h3>
                  <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-medium">Page 1</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700">شکایت اصلی بیمار:</label>
                      <span className="text-[10px] text-slate-400 font-mono">Chief Complaint</span>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.chief_complaint}
                      onChange={e => handleChange('chief_complaint', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700">تاریخچه بیماری فعلی:</label>
                      <span className="text-[10px] text-slate-400 font-mono">History of Present Illness (HPI)</span>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.hpi}
                      onChange={e => handleChange('hpi', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden leading-relaxed"
                      placeholder="شرح بیماری فعلی... با طولانی شدن این فیلد، ارگان‌های پایینی صفحه یک‌به‌یک به صفحه ۲ می‌روند."
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700">تاریخچه بیماری‌های قبلی:</label>
                      <span className="text-[10px] text-slate-400 font-mono">Past Diseases History</span>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.pmh}
                      onChange={e => handleChange('pmh', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700">داروهای مصرفی و سایر اعتیادات:</label>
                      <span className="text-[10px] text-slate-400 font-mono">Current Drug Therapy & Addiction</span>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.drugs_addiction}
                      onChange={e => handleChange('drugs_addiction', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-700">حساسیت به:</label>
                        <span className="text-[10px] text-slate-400 font-mono">Allergy to</span>
                      </div>
                      <input
                        type="text"
                        value={formData.allergy}
                        onChange={e => handleChange('allergy', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-700">سوابق فامیلی:</label>
                        <span className="text-[10px] text-slate-400 font-mono">Family History</span>
                      </div>
                      <input
                        type="text"
                        value={formData.family_history}
                        onChange={e => handleChange('family_history', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Physical Exam (Base) */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      وضعیت ظاهری عمومی (General Appearance):
                    </label>
                    <input
                      type="text"
                      value={formData.pe_ga}
                      onChange={e => handleChange('pe_ga', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:border-teal-500 focus:outline-hidden"
                      placeholder="مثال: هوشیار، آگاه، بدون دیسترس حاد"
                    />
                  </div>

                  {/* Vitals Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-teal-900">علائم حیاتی (Vital Signs):</span>
                      <button
                        type="button"
                        onClick={handleFillNormalVitals}
                        className="text-[10px] bg-white border border-slate-300 hover:border-teal-500 text-teal-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        درج علائم حیاتی نرمال
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 block">BP:</label>
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="120/80"
                          value={formData.vs_bp}
                          onChange={e => handleChange('vs_bp', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">PR:</label>
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="78"
                          value={formData.vs_pr}
                          onChange={e => handleChange('vs_pr', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">RR:</label>
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="16"
                          value={formData.vs_rr}
                          onChange={e => handleChange('vs_rr', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">T (°C):</label>
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="36.8"
                          value={formData.vs_t}
                          onChange={e => handleChange('vs_t', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">SpO2 (%):</label>
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="98"
                          value={formData.vs_spo2}
                          onChange={e => handleChange('vs_spo2', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">توضیح:</label>
                        <input
                          type="text"
                          placeholder="اختیاری..."
                          value={formData.pe_vitals_note}
                          onChange={e => handleChange('pe_vitals_note', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">پوست (Skin):</label>
                      <input
                        type="text"
                        value={formData.pe_skin}
                        onChange={e => handleChange('pe_skin', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">جمجمه (Skull):</label>
                      <input
                        type="text"
                        value={formData.pe_skull}
                        onChange={e => handleChange('pe_skull', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">گوش (Ear):</label>
                      <input
                        type="text"
                        value={formData.pe_ear}
                        onChange={e => handleChange('pe_ear', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Specialized Organs & Page 2 */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 flex-wrap gap-2">
                  <h3 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    ۳. ارگان‌های بالینی صفحه دوم و تشخیص نهایی
                  </h3>
                  <button
                    type="button"
                    onClick={handleSetAllOrgansNormal}
                    className="text-[10px] bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 rounded font-medium transition-colors cursor-pointer"
                  >
                    درج علامت «×» برای همه ارگان‌های خالی
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { key: 'pe_head_neck', labelFa: 'سر و گردن', labelEn: 'Head & Neck' },
                    { key: 'pe_eyes', labelFa: 'چشم', labelEn: 'Eyes' },
                    { key: 'pe_cvs', labelFa: 'قلب و عروق', labelEn: 'Cardiovascular' },
                    { key: 'pe_chest', labelFa: 'ریه', labelEn: 'Lungs' },
                    { key: 'pe_abd', labelFa: 'شکم', labelEn: 'Abdomen' },
                    { key: 'pe_ext', labelFa: 'اندام‌ها', labelEn: 'Extremities' },
                    { key: 'pe_neuro', labelFa: 'سیستم عصبی', labelEn: 'Neurological' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="w-24 text-[11px] font-bold text-slate-700 shrink-0">
                        {item.labelFa}:
                      </span>
                      <input
                        type="text"
                        value={formData[item.key as keyof HospitalFormData]}
                        onChange={e => handleChange(item.key as keyof HospitalFormData, e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-slate-200 rounded text-xs focus:border-teal-500 focus:outline-hidden"
                        placeholder="شرح بالینی یا علامت ×"
                      />
                      <button
                        type="button"
                        onClick={() => handleSetNormal(item.key as keyof HospitalFormData)}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded cursor-pointer transition-colors shrink-0"
                      >
                        × نرمال
                      </button>
                    </div>
                  ))}

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">خلاصه (SUMMARY):</label>
                      <textarea
                        rows={2}
                        value={formData.clinical_summary}
                        onChange={e => handleChange('clinical_summary', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs focus:border-teal-500 focus:outline-hidden leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">تشخیص اولیه (Primary DX):</label>
                      <input
                        type="text"
                        value={formData.primary_dx}
                        onChange={e => handleChange('primary_dx', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs focus:border-teal-500 focus:outline-hidden font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        امضاء و نام پزشک معاینه کننده (Signature):
                      </label>
                      <input
                        type="text"
                        value={formData.examining_physician}
                        onChange={e => handleChange('examining_physician', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-7 flex flex-col gap-4 sticky top-20">
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs no-print">
                <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-teal-600" />
                  پیش‌نمایش زنده برگه رسمی بیمارستان (۲ صفحه A4)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewZoom(z => Math.max(50, z - 10))}
                    className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    title="کوچک‌نمایی"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-medium text-slate-600 w-12 text-center">
                    {previewZoom}%
                  </span>
                  <button
                    onClick={() => setPreviewZoom(z => Math.min(130, z + 10))}
                    className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    title="بزرگ‌نمایی"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewZoom(100)}
                    className="text-[11px] text-teal-700 hover:bg-teal-50 px-2 py-0.5 rounded cursor-pointer border border-teal-200"
                  >
                    ۱۰۰٪
                  </button>
                </div>
              </div>

              {/* Scrollable A4 Preview Surface */}
              <div className="overflow-x-auto pb-8 rounded-xl bg-slate-300/60 p-4 border border-slate-300 shadow-inner max-h-[85vh] overflow-y-auto">
                <div
                  className="flex flex-col gap-6 items-center transition-transform origin-top"
                  style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
                >
                  {/* Page 1 */}
                  <div
                    className="bg-white text-black shadow-xl border border-slate-400 p-[7mm_10mm] box-border"
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      fontFamily: "'B Nazanin', Tahoma, Arial, sans-serif"
                    }}
                    dangerouslySetInnerHTML={{ __html: page1 }}
                  />

                  {/* Page 2 */}
                  <div
                    className="bg-white text-black shadow-xl border border-slate-400 p-[7mm_10mm] box-border print-page-break"
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      fontFamily: "'B Nazanin', Tahoma, Arial, sans-serif"
                    }}
                    dangerouslySetInnerHTML={{ __html: page2 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Full Preview Mode */}
        {activeTab === 'preview' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs no-print">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-teal-950">نمای چاپ و پیش‌نمایش تمام‌صفحه A4</span>
                <span className="text-xs text-slate-500">
                  (آماده چاپ روی برگه فیزیکی یا خروجی PDF بدون کادرهای اضافی)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  چاپ این فرم (Print / PDF)
                </button>
                <button
                  onClick={handleDownloadWord}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  دانلود نسخه Word (.doc)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto pb-12 rounded-xl bg-slate-300/70 p-6 flex justify-center">
              <div className="flex flex-col gap-8 items-center">
                <div
                  className="bg-white text-black shadow-2xl border border-slate-400 p-[7mm_10mm] box-border"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    fontFamily: "'B Nazanin', Tahoma, Arial, sans-serif"
                  }}
                  dangerouslySetInnerHTML={{ __html: page1 }}
                />

                <div
                  className="bg-white text-black shadow-2xl border border-slate-400 p-[7mm_10mm] box-border print-page-break"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    fontFamily: "'B Nazanin', Tahoma, Arial, sans-serif"
                  }}
                  dangerouslySetInnerHTML={{ __html: page2 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Standalone HTML Code & Direct Export */}
        {activeTab === 'htmlCode' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col gap-4 no-print">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <b>درباره خطای Cookie check هنگام باز کردن فایل در کامپیوتر:</b><br />
                در نسخه قبل هنگام کلیک روی دانلود، مرورگر به جای فایل اصلی، صفحه امنیتی پروکسی سرور را دانلود می‌کرد. اکنون دانلود به صورت مستقیم در حافظه مرورگر شما (In-Memory Blob) انجام می‌شود و فایل دانلودی ۱۰۰٪ کامل و آفلاین است. همچنین می‌توانید با زدن دکمه <b>«کپی کامل کد»</b>، کد زیر را مستقیماً در یک فایل با نام <code className="bg-amber-100 px-1 rounded">sheet.html</code> در کامپیوتر خود ذخیره کنید.
              </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-sm text-teal-950 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-teal-600" />
                  کد کامل و اصلاح‌شده فایل مستقل HTML (تک‌فایلی و آفلاین)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  حاوی تمام استایل‌ها، فونت استاندارد، الگوریتم اصلاح‌شده صفحه‌بندی از پایین صفحه و خروجی Word
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <FileCheck className="w-4 h-4" />}
                  {copiedCode ? 'کد کپی شد!' : 'کپی کامل کد'}
                </button>

                <button
                  onClick={handleDownloadStandaloneHtml}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  دانلود مستقیم و مطمئن فایل HTML
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={standaloneHtmlCode}
                onClick={e => (e.target as HTMLTextAreaElement).select()}
                className="w-full bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto h-[480px] leading-relaxed resize-y focus:outline-hidden"
                dir="ltr"
              />
            </div>
          </div>
        )}
      </main>

      {/* Hidden print container with strict A4 styling */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        <div
          className="bg-white text-black p-[7mm_10mm] box-border"
          style={{ width: '100%', minHeight: 'auto', fontFamily: "'B Nazanin', Tahoma, Arial, sans-serif" }}
          dangerouslySetInnerHTML={{ __html: page1 }}
        />
        <div style={{ pageBreakBefore: 'always' }} />
        <div
          className="bg-white text-black p-[7mm_10mm] box-border"
          style={{ width: '100%', minHeight: 'auto', fontFamily: "'B Nazanin', Tahoma, Arial, sans-serif" }}
          dangerouslySetInnerHTML={{ __html: page2 }}
        />
      </div>
    </div>
  );
}
