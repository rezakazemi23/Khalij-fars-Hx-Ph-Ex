const fs = require('fs');
const path = require('path');

const fontCss = fs.readFileSync('public/fonts/embedded_vazirmatn.css', 'utf8').trim();

// Read clean base HTML logic
const srcFile = require('../src/utils/standaloneHtmlContent.ts').STANDALONE_HTML;

// Extract javascript logic from the existing file so all clinical overflow and export logic remains 100% identical and tested
const scriptMatch = srcFile.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('Script not found!');
  process.exit(1);
}
let rawScript = scriptMatch[1];
const storageIdx = rawScript.indexOf('const STORAGE_KEY');
let jsCode = storageIdx !== -1 ? rawScript.slice(storageIdx) : rawScript;

// We add mobile zoom & tab state to JS
const mobileJsEnhancements = `
    let currentMobileTab = 'form'; // 'form' | 'preview' | 'export'
    let currentZoomMode = 'fit'; // 'fit' | '75' | '100'

    function setMobileTab(tab) {
      currentMobileTab = tab;
      const formSec = document.getElementById('formSectionContainer');
      const prevSec = document.getElementById('previewSectionContainer');
      const expSec = document.getElementById('exportSectionContainer');

      const tabFormBtn = document.getElementById('tabBtnForm');
      const tabPrevBtn = document.getElementById('tabBtnPreview');
      const tabExpBtn  = document.getElementById('tabBtnExport');

      [tabFormBtn, tabPrevBtn, tabExpBtn].forEach(b => { if (b) b.classList.remove('active-tab'); });

      if (tab === 'form') {
        if (formSec) formSec.style.display = 'block';
        if (prevSec) prevSec.style.display = (window.innerWidth >= 992 ? 'block' : 'none');
        if (expSec)  expSec.style.display = 'none';
        if (tabFormBtn) tabFormBtn.classList.add('active-tab');
      } else if (tab === 'preview') {
        if (formSec) formSec.style.display = (window.innerWidth >= 992 ? 'block' : 'none');
        if (prevSec) prevSec.style.display = 'block';
        if (expSec)  expSec.style.display = 'none';
        if (tabPrevBtn) tabPrevBtn.classList.add('active-tab');
        updatePreview();
      } else if (tab === 'export') {
        if (formSec) formSec.style.display = (window.innerWidth >= 992 ? 'block' : 'none');
        if (prevSec) prevSec.style.display = (window.innerWidth >= 992 ? 'block' : 'none');
        if (expSec)  expSec.style.display = 'block';
        if (tabExpBtn) tabExpBtn.classList.add('active-tab');
      }
    }

    function setZoomMode(mode) {
      currentZoomMode = mode;
      document.querySelectorAll('.zoom-mode-btn').forEach(b => b.classList.remove('active-zoom'));
      const activeBtn = document.getElementById('zoomBtn_' + mode);
      if (activeBtn) activeBtn.classList.add('active-zoom');
      updatePreview();
    }

    function renderScaledPages(page1, page2) {
      const container = document.getElementById('livePreviewContainer');
      if (!container) return;

      const screenW = window.innerWidth;
      let scale = 1.0;

      if (currentZoomMode === 'fit') {
        if (screenW < 840) {
          scale = Math.min(1.0, Math.max(0.32, (screenW - 20) / 794));
        } else {
          scale = 1.0;
        }
      } else if (currentZoomMode === '75') {
        scale = 0.75;
      } else if (currentZoomMode === '100') {
        scale = 1.0;
      }

      const scaledW = Math.round(794 * scale);
      const scaledH = Math.round(1123 * scale);

      container.innerHTML = 
        '<div class=\"a4-page-scale-wrapper\" style=\"width:' + scaledW + 'px; height:' + scaledH + 'px; margin:0 auto 20px auto; position:relative; overflow:visible;\">' +
          '<div class=\"a4-page\" style=\"width:794px; min-height:1123px; transform: scale(' + scale + '); transform-origin: top right; position:absolute; top:0; right:0;\">' +
            page1 +
          '</div>' +
        '</div>' +
        '<div class=\"a4-page-scale-wrapper print-page-break\" style=\"width:' + scaledW + 'px; height:' + scaledH + 'px; margin:0 auto 20px auto; position:relative; overflow:visible;\">' +
          '<div class=\"a4-page\" style=\"width:794px; min-height:1123px; transform: scale(' + scale + '); transform-origin: top right; position:absolute; top:0; right:0;\">' +
            page2 +
          '</div>' +
        '</div>';
    }

    window.addEventListener('resize', () => {
      if (currentZoomMode === 'fit') updatePreview();
    });
`;

const oldUpdatePreview = `    function updatePreview() {
      const { page1, page2 } = buildHospitalPagesHTML();
      const container = document.getElementById('livePreviewContainer');
      if (container) {
        container.innerHTML = '<div class="a4-page" id="page1View">' + page1 + '</div>' +
          '<div class="a4-page print-page-break" id="page2View">' + page2 + '</div>';
      }
    }`;

const newUpdatePreview = `    function updatePreview() {
      const { page1, page2 } = buildHospitalPagesHTML();
      renderScaledPages(page1, page2);
    }`;

jsCode = jsCode.replace(oldUpdatePreview, newUpdatePreview);

// Prepend mobile enhancements
jsCode = mobileJsEnhancements + '\n' + jsCode;

// Build the full HTML template
const completeHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <title>برگ شرح حال و معاینه بدنی - بیمارستان شهدای خلیج فارس بوشهر</title>
  <style>
    /* قلم استاندارد وزیرمتن به صورت درون‌برنامه‌ای (بدون نیاز به اینترنت و بدون مشکل فیلترینگ) */
    ${fontCss}

    :root {
      --primary: #0d5c75;
      --primary-dark: #073b4c;
      --secondary: #118ab2;
      --accent: #e76f51;
      --bg: #f1f5f9;
      --border: #cbd5e1;
      --text: #1e293b;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Vazirmatn', 'Noto Sans Arabic', 'Segoe UI', Tahoma, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    }
    body {
      background: var(--bg);
      color: var(--text);
      direction: rtl;
      font-size: 13px;
      padding-bottom: 70px;
      overflow-x: hidden;
      -webkit-text-size-adjust: 100%;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* نوار بالا */
    .top-navbar {
      background: linear-gradient(135deg, var(--primary-dark), var(--primary));
      color: #fff; padding: 10px 14px; position: sticky; top: 0; z-index: 1000;
      box-shadow: 0 3px 10px rgba(0,0,0,0.15);
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
    }
    .brand-title { font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
    .actions-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    
    .btn {
      padding: 7px 11px; border-radius: 6px; border: none; cursor: pointer;
      font-size: 11.5px; font-weight: bold; color: #fff;
      transition: 0.15s; touch-action: manipulation; -webkit-tap-highlight-color: transparent;
      display: inline-flex; align-items: center; gap: 4px; text-decoration: none;
    }
    .btn:active { transform: scale(0.96); }
    .btn-word { background: #2563eb; }
    .btn-word:hover { background: #1d4ed8; }
    .btn-share { background: #7c3aed; }
    .btn-share:hover { background: #5b21b6; }
    .btn-print { background: var(--secondary); }
    .btn-print:hover { background: #0b6988; }
    .btn-sample { background: #059669; }
    .btn-sample:hover { background: #047857; }
    .btn-clear { background: #dc2626; }
    .btn-clear:hover { background: #b91c1c; }
    .save-status { font-size: 11px; color: #a7f3d0; background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 12px; }

    /* تب‌های اختصاصی موبایل */
    .mobile-tab-bar {
      display: flex;
      background: #fff;
      border-bottom: 2px solid var(--border);
      position: sticky;
      top: 48px;
      z-index: 990;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .mobile-tab-btn {
      flex: 1;
      padding: 10px 4px;
      text-align: center;
      font-size: 12px;
      font-weight: bold;
      color: #64748b;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      touch-action: manipulation;
    }
    .mobile-tab-btn.active-tab {
      color: var(--primary);
      border-bottom-color: var(--primary);
      background: #f8fafc;
    }

    .container { max-width: 1180px; margin: 12px auto; padding: 0 10px; }
    .info-badge {
      background: #e0f2fe; color: #0369a1; padding: 10px 14px; border-radius: 8px;
      font-size: 12px; border-right: 4px solid #0284c7; margin-bottom: 12px; line-height: 1.7;
    }
    .specialty-panel {
      background: #fff; border: 1px solid var(--border); border-right: 5px solid var(--accent);
      padding: 12px 14px; border-radius: 8px; margin-bottom: 12px;
    }
    .specialty-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    .specialty-select { padding: 8px 10px; border: 1px solid var(--border); border-radius: 5px; font-weight: bold; color: var(--primary-dark); width: 100%; max-width: 320px; font-size: 13px; }
    .chips-group { display: flex; flex-direction: column; gap: 8px; }
    .chips-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .chips-label { font-size: 11px; font-weight: bold; color: var(--primary-dark); width: 100%; }
    @media (min-width: 640px) { .chips-label { width: auto; min-width: 140px; } }
    .chip-btn { background: #e2e8f0; color: #1e293b; padding: 6px 10px; border-radius: 14px; font-size: 11px; cursor: pointer; border: 1px solid #cbd5e1; touch-action: manipulation; }
    .chip-btn:hover, .chip-btn:active { background: var(--primary); color: #fff; border-color: var(--primary); }

    .card { background: #fff; border-radius: 8px; border: 1px solid var(--border); padding: 12px 14px; margin-bottom: 12px; }
    .card-title { font-size: 13px; font-weight: bold; color: var(--primary-dark); padding-bottom: 8px; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px; }
    
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
    .form-group label { font-weight: bold; font-size: 11px; color: #475569; }
    .form-control {
      padding: 8px 10px; border: 1px solid var(--border); border-radius: 5px; font-size: 13px; outline: none;
      unicode-bidi: plaintext; width: 100%; -webkit-appearance: none;
    }
    @media (max-width: 768px) {
      .form-control { font-size: 14px; } /* جلوگیری از زوم ناخواسته در iOS */
    }
    .form-control:focus { border-color: var(--secondary); box-shadow: 0 0 0 2px rgba(17,138,178,0.15); }
    textarea.form-control { min-height: 55px; resize: vertical; line-height: 1.5; }

    .bilingual-header {
      display: flex; justify-content: space-between; align-items: center;
      background: #f1f5f9; padding: 5px 8px; border-radius: 4px; border-right: 3px solid var(--primary); margin-bottom: 4px;
    }
    .fa-label { font-weight: bold; font-size: 12px; }
    .en-label { direction: ltr; font-family: Arial, sans-serif; font-size: 11px; color: #475569; font-weight: bold; }

    .vitals-box {
      background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;
      padding: 10px; margin-top: 6px; margin-bottom: 10px;
    }
    .vitals-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-top: 6px; }
    @media (max-width: 600px) {
      .vitals-grid { grid-template-columns: repeat(2, 1fr); }
    }

    /* ارگان‌ها در موبایل */
    .organ-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .organ-table th, .organ-table td { border: 1px solid var(--border); padding: 6px 8px; text-align: right; font-size: 12px; }
    .organ-table th { background: #f8fafc; }
    .btn-normal-quick { padding: 5px 8px; background: #e2e8f0; border: 1px solid var(--border); border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: bold; white-space: nowrap; }
    .btn-normal-quick:hover, .btn-normal-quick:active { background: #cbd5e1; }

    /* تولبار زوم برای پیش‌نمایش در موبایل */
    .zoom-toolbar {
      display: flex; justify-content: center; align-items: center; gap: 6px;
      background: #fff; border: 1px solid var(--border); border-radius: 8px;
      padding: 8px 12px; margin: 0 auto 14px auto; max-width: 500px; flex-wrap: wrap;
    }
    .zoom-mode-btn {
      padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1;
      background: #f8fafc; font-size: 11.5px; font-weight: bold; cursor: pointer;
    }
    .zoom-mode-btn.active-zoom {
      background: var(--primary); color: #fff; border-color: var(--primary);
    }

    .a4-scroll-container { width: 100%; overflow-x: auto; padding: 0 4px 24px 4px; -webkit-overflow-scrolling: touch; }
    .a4-preview-wrapper { display: flex; flex-direction: column; align-items: center; width: 100%; }

    /* ابعاد برگه اصلی A4 */
    .a4-page {
      width: 794px;
      min-height: 1123px;
      background: #fff;
      padding: 7mm 10mm;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      border: 1px solid var(--border);
      color: #000;
      font-family: 'B Nazanin', 'Vazirmatn', Tahoma, sans-serif;
      box-sizing: border-box;
    }

    /* نوار پایین برای دسترسی سریع روی گوشی */
    .mobile-bottom-bar {
      display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;
      background: #fff; border-top: 1px solid var(--border); padding: 8px 12px;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.08); justify-content: space-around; gap: 6px;
    }
    @media (max-width: 768px) {
      .mobile-bottom-bar { display: flex; }
      body { padding-bottom: 75px; }
    }

    /* پنل خروجی موبایل */
    .export-card-panel {
      background: #fff; border-radius: 10px; border: 1px solid var(--border);
      padding: 16px; margin: 12px auto; max-width: 600px; text-align: center;
    }
    .export-card-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 8px;
      font-size: 13px; font-weight: bold; color: #fff; border: none; cursor: pointer; text-decoration: none;
    }

    /* مدال دریافت فایل */
    .mobile-dl-modal {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000;
      align-items: center; justify-content: center; padding: 16px;
    }
    .mobile-dl-card {
      background: #fff; border-radius: 10px; max-width: 400px; width: 100%; padding: 18px;
      text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.25);
    }

    /* استایل‌های پرینت بدون به هم‌ریختگی */
    @media print {
      @page { size: A4 portrait; margin: 7mm 10mm; }
      body { background: #fff; padding: 0; margin: 0; overflow: visible; }
      .no-print, .mobile-tab-bar, .mobile-bottom-bar, .top-navbar, .zoom-toolbar, .info-badge, .specialty-panel, .card { display: none !important; }
      #previewSectionContainer { display: block !important; }
      .a4-scroll-container { overflow: visible; padding: 0; margin: 0; width: 100%; }
      .a4-preview-wrapper { display: block; width: 100%; }
      .a4-page-scale-wrapper { width: 100% !important; height: auto !important; margin: 0 !important; }
      .a4-page { width: 100% !important; min-height: auto !important; transform: none !important; position: static !important; padding: 0; margin: 0; box-shadow: none; border: none; }
      .print-page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

  <!-- مدال اشتراک و دانلود -->
  <div class="mobile-dl-modal no-print" id="mobileDlModal">
    <div class="mobile-dl-card">
      <h3 style="color:var(--primary-dark); margin-bottom:8px; font-size:15px;">📥 دریافت و اشتراک‌گذاری فایل</h3>
      <p style="font-size:12px; color:#475569; line-height:1.6; margin-bottom:14px;">
        برای گوشی، پیشنهاد می‌شود از دکمه «اشتراک‌گذاری» استفاده نمایید تا مستقیماً در نرم‌افزار Word گوشی یا شبکه‌های اجتماعی باز شود:
      </p>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button type="button" class="btn btn-share" style="justify-content:center; padding:11px;" onclick="shareWordOnMobile()">
          📲 اشتراک‌گذاری / باز کردن مستقیم در Word
        </button>
        <button type="button" class="btn btn-word" style="justify-content:center; padding:11px;" onclick="exportToWordDoc(); closeMobileModal();">
          📄 دانلود فایل Word (.doc)
        </button>
        <button type="button" class="btn btn-print" style="justify-content:center; padding:11px;" onclick="window.print(); closeMobileModal();">
          🖨️ ذخیره به صورت PDF گوشی
        </button>
        <button type="button" class="btn btn-clear" style="justify-content:center; background:#64748b;" onclick="closeMobileModal()">
          بستن
        </button>
      </div>
    </div>
  </div>

  <!-- نوار بالای دسکتاپ و تبلت -->
  <nav class="top-navbar no-print">
    <div class="brand-title">🏥 برگ شرح حال و معاینه بدنی (R173) - بیمارستان شهدای خلیج فارس بوشهر</div>
    <div class="actions-group">
      <span class="save-status" id="saveStatus">✓ آماده</span>
      <button type="button" class="btn btn-word" onclick="exportToWordDoc()">📄 دانلود Word</button>
      <button type="button" class="btn btn-share" onclick="openMobileModal()">📲 ذخیره/ارسال</button>
      <button type="button" class="btn btn-print" onclick="window.print()">🖨️ چاپ / PDF</button>
      <button type="button" class="btn btn-sample" onclick="loadDefaultSample()">📋 نمونه کامل</button>
      <button type="button" class="btn btn-clear" onclick="clearFormConfirm()">🗑️ پاک کردن</button>
    </div>
  </nav>

  <!-- تب‌های بهینه‌ساز موبایل -->
  <div class="mobile-tab-bar no-print">
    <button type="button" class="mobile-tab-btn active-tab" id="tabBtnForm" onclick="setMobileTab('form')">
      📝 ۱. فرم ورود اطلاعات
    </button>
    <button type="button" class="mobile-tab-btn" id="tabBtnPreview" onclick="setMobileTab('preview')">
      👁️ ۲. پیش‌نمایش برگه رسمی (A4)
    </button>
    <button type="button" class="mobile-tab-btn" id="tabBtnExport" onclick="setMobileTab('export')">
      📥 ۳. دانلود و چاپ
    </button>
  </div>

  <div class="container no-print">
    <!-- بخش فرم ورود اطلاعات -->
    <div id="formSectionContainer">
      <div class="info-badge">
        ✨ <b>سازگاری کامل با موبایل:</b> فرمت A4، قلم استاندارد وزیرمتن، و مدیریت سرریز هوشمند بالینی فعال است. هنگام تایپ طولانی، موارد دقیقاً از انتهای صفحه اول (گوش ⬅️ جمجمه ⬅️ پوست ⬅️ علائم حیاتی ⬅️ وضعیت ظاهری ⬅️ فامیلی) به صفحه دوم منتقل می‌شوند.
      </div>

      <div class="specialty-panel">
        <div class="specialty-header">
          <label style="font-weight:bold;">انتخاب حوزه بالینی جهت کمک‌نگار:</label>
          <select id="specialtySelect" class="specialty-select" onchange="applySpecialtyTemplate()">
            <option value="general">عمومی و اورژانس (General / Emergency)</option>
            <option value="internal" selected>داخلی (Internal Medicine)</option>
            <option value="surgery">جراحی (General Surgery)</option>
            <option value="pediatrics">کودکان (Pediatrics)</option>
            <option value="obgyn">زنان و زایمان (OB/GYN)</option>
          </select>
        </div>
        <div class="chips-group">
          <div class="chips-row">
            <span class="chips-label">🔹 درج سریع در شرح حال (HPI):</span>
            <div class="chips-row" id="hpiChipsContainer"></div>
          </div>
          <div class="chips-row">
            <span class="chips-label">🔸 درج سریع در معاینات (PE):</span>
            <div class="chips-row" id="peChipsContainer"></div>
          </div>
        </div>
      </div>

      <!-- ۱. مشخصات پایه -->
      <div class="card">
        <div class="card-title"><span>۱. مشخصات پایه و پذیرش بیمار</span><span>Report No: R173</span></div>
        <div class="form-grid">
          <div class="form-group"><label>شماره پرونده (Unit No):</label><input type="text" id="rec_no" class="form-control"></div>
          <div class="form-group"><label>نام خانوادگی (Last Name):</label><input type="text" id="patient_family" class="form-control"></div>
          <div class="form-group"><label>نام بیمار (Name):</label><input type="text" id="patient_name" class="form-control"></div>
          <div class="form-group"><label>نام پدر (Father Name):</label><input type="text" id="patient_father" class="form-control"></div>
          <div class="form-group"><label>تاریخ تولد (Birth Date):</label><input type="text" id="birth_date" class="form-control"></div>
          <div class="form-group"><label>بخش (Ward):</label><input type="text" id="ward_name" class="form-control"></div>
          <div class="form-group"><label>اتاق (Room):</label><input type="text" id="room_no" class="form-control"></div>
          <div class="form-group"><label>تخت (Bed):</label><input type="text" id="bed_no" class="form-control"></div>
          <div class="form-group"><label>پزشک معالج (Physician):</label><input type="text" id="attending_physician" class="form-control"></div>
          <div class="form-group"><label>تاریخ پذیرش (Admission Date):</label><input type="text" id="adm_date" class="form-control"></div>
          <div class="form-group"><label>ساعت پذیرش (Time):</label><input type="text" id="adm_time" class="form-control"></div>
          <div class="form-group"><label>کد کاربر (User):</label><input type="text" id="user_code" class="form-control"></div>
        </div>
      </div>

      <!-- ۲. فیلدهای بالینی صفحه اول -->
      <div class="card">
        <div class="card-title"><span>۲. فیلدهای بالینی صفحه اول</span><span>Page 1</span></div>
        <div class="form-group">
          <div class="bilingual-header"><span class="fa-label">شکایت اصلی بیمار:</span><span class="en-label">Chief Complaint:</span></div>
          <textarea id="chief_complaint" class="form-control"></textarea>
        </div>
        <div class="form-group">
          <div class="bilingual-header"><span class="fa-label">تاریخچه بیماری فعلی:</span><span class="en-label">History of Present Illness:</span></div>
          <textarea id="hpi" class="form-control" style="min-height:75px;"></textarea>
        </div>
        <div class="form-group">
          <div class="bilingual-header"><span class="fa-label">تاریخچه ی بیماریهای قبلی:</span><span class="en-label">Past Diseases History:</span></div>
          <textarea id="pmh" class="form-control"></textarea>
        </div>
        <div class="form-group">
          <div class="bilingual-header"><span class="fa-label">داروهای در حال مصرف و اعتیادات:</span><span class="en-label">Current Drugs:</span></div>
          <textarea id="drugs_addiction" class="form-control"></textarea>
        </div>
        <div class="form-group">
          <div class="bilingual-header"><span class="fa-label">حساسیت به:</span><span class="en-label">Allergy to:</span></div>
          <textarea id="allergy" class="form-control" style="min-height:42px;"></textarea>
        </div>
        <div class="form-group">
          <div class="bilingual-header"><span class="fa-label">سوابق فامیلی:</span><span class="en-label">Family History:</span></div>
          <textarea id="family_history" class="form-control" style="min-height:42px;"></textarea>
        </div>

        <!-- معاینات پایه -->
        <div class="form-group" style="margin-bottom:0;">
          <div class="bilingual-header">
            <span class="fa-label">معاینات بدنی (ظاهر عمومی، علائم حیاتی، پوست، جمجمه، گوش):</span>
            <span class="en-label">Physical Examination:</span>
          </div>

          <div class="form-group" style="margin-top:8px;">
            <label>وضعیت ظاهری عمومی (General Appearance):</label>
            <input type="text" id="pe_ga" class="form-control" placeholder="بیمار هوشیار و آگاه...">
          </div>

          <div class="vitals-box">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
              <label style="font-weight:bold; font-size:12px; color:var(--primary-dark);">علائم حیاتی (Vital Signs):</label>
              <button type="button" class="chip-btn" onclick="fillNormalVitals()">درج علائم نرمال</button>
            </div>
            <div class="vitals-grid">
              <div class="form-group" style="margin:0;"><label>فشار خون (BP):</label><input type="text" id="vs_bp" class="form-control" placeholder="120/80" dir="ltr"></div>
              <div class="form-group" style="margin:0;"><label>ضربان قلب (PR):</label><input type="text" id="vs_pr" class="form-control" placeholder="78" dir="ltr"></div>
              <div class="form-group" style="margin:0;"><label>تعداد تنفس (RR):</label><input type="text" id="vs_rr" class="form-control" placeholder="16" dir="ltr"></div>
              <div class="form-group" style="margin:0;"><label>دما (T):</label><input type="text" id="vs_t" class="form-control" placeholder="36.8" dir="ltr"></div>
              <div class="form-group" style="margin:0;"><label>اکسیژن (SpO2):</label><input type="text" id="vs_spo2" class="form-control" placeholder="98%" dir="ltr"></div>
              <div class="form-group" style="margin:0;"><label>توضیح علائم:</label><input type="text" id="pe_vitals_note" class="form-control" placeholder="اختیاری"></div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group" style="margin:0;"><label>پوست (Skin):</label><input type="text" id="pe_skin" class="form-control"></div>
            <div class="form-group" style="margin:0;"><label>جمجمه (Skull):</label><input type="text" id="pe_skull" class="form-control"></div>
            <div class="form-group" style="margin:0;"><label>گوش (Ear):</label><input type="text" id="pe_ear" class="form-control"></div>
          </div>
        </div>
      </div>

      <!-- ۳. فیلدهای صفحه دوم -->
      <div class="card">
        <div class="card-title"><span>۳. ادامه معاینات، خلاصه و تشخیص</span><span>Page 2</span></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
          <span style="font-size:11px; color:#92400e; background:#fffbeb; padding:5px 8px; border-radius:4px; border-right:3px solid #f59e0b;">
            در صورت عدم وجود بیماری با علامت <b>×</b> مشخص شود.
          </span>
          <button type="button" class="chip-btn" onclick="setAllOrgansNormal()" style="background:#0284c7; color:#fff; font-weight:bold; border:none;">
            درج خودکار «×» برای تمام ارگان‌های خالی
          </button>
        </div>

        <table class="organ-table">
          <thead>
            <tr><th style="width:30%;">ارگان</th><th style="width:52%;">شرح معاینه</th><th style="width:18%; text-align:center;">نرمال</th></tr>
          </thead>
          <tbody>
            <tr><td><b>سر و گردن (Head)</b></td><td><input type="text" id="pe_head_neck" class="form-control"></td><td style="text-align:center;"><button type="button" class="btn-normal-quick" onclick="setNormal('pe_head_neck')">× نرمال</button></td></tr>
            <tr><td><b>چشم (Eyes)</b></td><td><input type="text" id="pe_eyes" class="form-control"></td><td style="text-align:center;"><button type="button" class="btn-normal-quick" onclick="setNormal('pe_eyes')">× نرمال</button></td></tr>
            <tr><td><b>قلب و عروق (CVS)</b></td><td><input type="text" id="pe_cvs" class="form-control"></td><td style="text-align:center;"><button type="button" class="btn-normal-quick" onclick="setNormal('pe_cvs')">× نرمال</button></td></tr>
            <tr><td><b>ریه (Lungs)</b></td><td><input type="text" id="pe_chest" class="form-control"></td><td style="text-align:center;"><button type="button" class="btn-normal-quick" onclick="setNormal('pe_chest')">× نرمال</button></td></tr>
            <tr><td><b>شکم (Abd)</b></td><td><input type="text" id="pe_abd" class="form-control"></td><td style="text-align:center;"><button type="button" class="btn-normal-quick" onclick="setNormal('pe_abd')">× نرمال</button></td></tr>
            <tr><td><b>اندام‌ها (Ext)</b></td><td><input type="text" id="pe_ext" class="form-control"></td><td style="text-align:center;"><button type="button" class="btn-normal-quick" onclick="setNormal('pe_ext')">× نرمال</button></td></tr>
            <tr><td><b>سیستم عصبی (Neuro)</b></td><td><input type="text" id="pe_neuro" class="form-control"></td><td style="text-align:center;"><button type="button" class="btn-normal-quick" onclick="setNormal('pe_neuro')">× نرمال</button></td></tr>
          </tbody>
        </table>

        <div class="form-group" style="margin-top:12px;">
          <div class="bilingual-header"><span class="fa-label">خلاصه پرونده:</span><span class="en-label">SUMMARY:</span></div>
          <textarea id="clinical_summary" class="form-control"></textarea>
        </div>
        <div class="form-group">
          <div class="bilingual-header"><span class="fa-label">تشخیص اولیه:</span><span class="en-label">Primary DX:</span></div>
          <input type="text" id="primary_dx" class="form-control">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <div class="bilingual-header"><span class="fa-label">امضاء پزشک معاینه‌کننده:</span><span class="en-label">Signature:</span></div>
          <input type="text" id="examining_physician" class="form-control">
        </div>
      </div>
    </div>

    <!-- بخش خروجی و دانلود اختصاصی موبایل -->
    <div id="exportSectionContainer" style="display:none;">
      <div class="export-card-panel">
        <h3 style="color:var(--primary-dark); margin-bottom:10px; font-size:16px;">📥 دریافت و اشتراک‌گذاری برگه بیمارستان</h3>
        <p style="font-size:12px; color:#64748b; line-height:1.7; margin-bottom:16px;">
          پرونده با اطلاعات وارد شده آماده است. با کلیک بر روی گزینه‌های زیر می‌توانید فایل را ذخیره یا در شبکه‌های اجتماعی ارسال فرمایید:
        </p>

        <button type="button" class="export-card-btn" style="background:#7c3aed;" onclick="shareWordOnMobile()">
          📲 اشتراک‌گذاری در Word / شبکه‌های اجتماعی (مخصوص گوشی)
        </button>

        <button type="button" class="export-card-btn" style="background:#2563eb;" onclick="exportToWordDoc()">
          📄 دانلود مستقیم فایل Word (.doc)
        </button>

        <button type="button" class="export-card-btn" style="background:#0891b2;" onclick="window.print()">
          🖨️ ذخیره به صورت PDF گوشی یا چاپ مستقیم
        </button>

        <div style="margin-top:16px; padding:12px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; text-align:right;">
          <p style="font-size:11px; color:#475569; line-height:1.7; margin:0;">
            💡 <b>نکته برای کاربران موبایل:</b> چنانچه نرم‌افزار Word روی گوشی شما نصب نیست، گزینه <b>«🖨️ ذخیره به صورت PDF»</b> را انتخاب کنید تا مرورگر گوشی، فرم را با بهترین کیفیت به صورت فایل PDF دو صفحه‌ای ذخیره کند.
          </p>
        </div>
      </div>
    </div>

    <!-- بخش پیش‌نمایش دو صفحه A4 با مقیاس هوشمند -->
    <div id="previewSectionContainer">
      <div class="zoom-toolbar no-print">
        <span style="font-size:11.5px; font-weight:bold; color:var(--primary-dark);">اندازه نمایش:</span>
        <button type="button" class="zoom-mode-btn active-zoom" id="zoomBtn_fit" onclick="setZoomMode('fit')">📱 تناسب با صفحه گوشی</button>
        <button type="button" class="zoom-mode-btn" id="zoomBtn_75" onclick="setZoomMode('75')">🔍 ۷۵٪</button>
        <button type="button" class="zoom-mode-btn" id="zoomBtn_100" onclick="setZoomMode('100')">🔍 ۱۰۰٪ (اندازه کامل)</button>
      </div>

      <div class="a4-scroll-container">
        <div class="a4-preview-wrapper" id="livePreviewContainer"></div>
      </div>
    </div>
  </div>

  <!-- نوار دسترسی سریع پایین صفحه در موبایل -->
  <div class="mobile-bottom-bar no-print">
    <button type="button" class="btn btn-word" style="flex:1; justify-content:center; padding:9px 4px; font-size:11px;" onclick="exportToWordDoc()">
      📄 دانلود ورد
    </button>
    <button type="button" class="btn btn-share" style="flex:1; justify-content:center; padding:9px 4px; font-size:11px;" onclick="shareWordOnMobile()">
      📲 ارسال
    </button>
    <button type="button" class="btn btn-print" style="flex:1; justify-content:center; padding:9px 4px; font-size:11px;" onclick="window.print()">
      🖨️ PDF
    </button>
    <button type="button" class="btn btn-sample" style="flex:1; justify-content:center; padding:9px 4px; font-size:11px; background:#0d5c75;" onclick="setMobileTab(currentMobileTab === 'preview' ? 'form' : 'preview')">
      👁️ تغییر نما
    </button>
  </div>

  <script>
${jsCode}
  </script>
</body>
</html>`;

fs.writeFileSync('public/khalij_fars_hospital_sheet_fixed.html', completeHtml);
console.log('Mobile-friendly standalone HTML created successfully! Size: ' + completeHtml.length);
