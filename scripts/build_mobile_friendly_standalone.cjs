const fs = require('fs');

const fontCss = fs.readFileSync('public/fonts/embedded_vazirmatn.css', 'utf8').trim();

// Extract HTML head & body up to <script>
const existingHtml = fs.readFileSync('public/khalij_fars_hospital_sheet_fixed.html', 'utf8');
const htmlBeforeScript = existingHtml.slice(0, existingHtml.indexOf('<script>'))
  .replace(/دانلود فایل Word \(\.doc\)/g, 'دانلود فایل Word استاندارد (.docx)')
  .replace(/دانلود مستقیم فایل Word \(\.doc\)/g, 'دانلود مستقیم فایل Word اصلی (.docx)')
  .replace(/📄 دانلود Word/g, '📄 دانلود Word (.docx)');

const optimizedScript = `
    // ============================================================================
    // ۱. مدیریت وضعیت تب‌ها، زوم موبایل و بهینه‌سازی رندر (Dirty Flag + Debounce)
    // ============================================================================
    let currentMobileTab = 'form'; // 'form' | 'preview' | 'export'
    let currentZoomMode = 'fit';   // 'fit' | '75' | '100'
    let isFormDirty = true;        // جلوگیری از رندر تکراری هنگام جابه‌جایی تب

    function debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

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
        if (isFormDirty) {
          updatePreview();
        }
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

      container.innerHTML = \`
        <div class="a4-page-scale-wrapper" style="width:\${scaledW}px; height:\${scaledH}px; margin:0 auto 20px auto; position:relative; overflow:visible;">
          <div class="a4-page" style="width:794px; min-height:1123px; transform: scale(\${scale}); transform-origin: top right; position:absolute; top:0; right:0;">
            \${page1}
          </div>
        </div>
        <div class="a4-page-scale-wrapper print-page-break" style="width:\${scaledW}px; height:\${scaledH}px; margin:0 auto 20px auto; position:relative; overflow:visible;">
          <div class="a4-page" style="width:794px; min-height:1123px; transform: scale(\${scale}); transform-origin: top right; position:absolute; top:0; right:0;">
            \${page2}
          </div>
        </div>
      \`;
      isFormDirty = false;
    }

    window.addEventListener('resize', debounce(() => {
      if (currentZoomMode === 'fit') updatePreview();
    }, 200));

    // ============================================================================
    // ۲. داده‌ها و قالب‌های کمکی بالینی
    // ============================================================================
    const STORAGE_KEY = "khalij_fars_ehr_sheet_standalone_v1";
    const allFieldIds = [
      'rec_no','patient_name','patient_family','patient_father','birth_date','ward_name',
      'room_no','bed_no','attending_physician','adm_date','adm_time','user_code',
      'chief_complaint','hpi','pmh','drugs_addiction','allergy','family_history',
      'pe_ga','vs_bp','vs_pr','vs_rr','vs_t','vs_spo2','pe_vitals_note',
      'pe_skin','pe_skull','pe_ear','pe_head_neck','pe_eyes','pe_cvs','pe_chest',
      'pe_abd','pe_ext','pe_neuro','clinical_summary','primary_dx','examining_physician','specialtySelect'
    ];

    const specialtyPresets = {
      general: {
        hpi: [
          { label: "+ علائم حیاتی پایدار", target: "hpi", text: "علائم حیاتی بیمار در بدو ورود پایدار است. " },
          { label: "+ نفی تروما", target: "hpi", text: "بیمار سابقه تروما یا آسیب فیزیکی اخیر را نفی می‌کند. " },
          { label: "+ عدم حساسیت (NKDA)", target: "allergy", text: "NKDA (فاقد حساسیت دارویی و غذایی شناخته شده)" }
        ],
        pe: [
          { label: "+ ظاهر عمومی خوب", target: "pe_ga", text: "بیمار هوشیار، آگاه، بدون دیسترس حاد تنفسی، ظاهر Ill یا Toxic ندارد." },
          { label: "+ هوشیاری کامل (GCS=15)", target: "pe_neuro", text: "هوشیار و آگاه به زمان، مکان و شخص (GCS: 15/15)، بدون نقص عصبی فوکال." },
          { label: "+ سمع قلب و ریه نرمال", target: "pe_cvs", text: "S1 و S2 نرمال، بدون سوفل؛ ریتم منظم." }
        ]
      },
      internal: {
        hpi: [
          { label: "+ سابقه HTN و DM", target: "pmh", text: "سابقه پرفشاری خون (HTN) و دیابت نوع ۲ تحت درمان دارویی. " },
          { label: "+ نفی درد قلبی و تنگی نفس", target: "hpi", text: "بیمار درد قفسه سینه، تپش قلب، ارتپنه و PND را نفی می‌کند. " },
          { label: "+ داروهای قلبی-داخلی", target: "drugs_addiction", text: "مصرف روزانه لوزارتان، متفورمین و آتورواستاتین. " }
        ],
        pe: [
          { label: "+ ظاهر عمومی داخلی", target: "pe_ga", text: "بیمار هوشیار، در وضعیت نشسته راحت، بدون سیانوز یا ایکتر." },
          { label: "+ سمع ریه شفاف", target: "pe_chest", text: "سمع هر دو ریه شفاف، بدون رال یا ویزینگ." },
          { label: "+ عدم ادم اندام", target: "pe_ext", text: "نبض‌های محیطی قرینه؛ بدون ادم گوده‌گذار." }
        ]
      },
      surgery: {
        hpi: [
          { label: "+ وضعیت ناشتایی (NPO)", target: "hpi", text: "بیمار از ۶ ساعت قبل ناشتا (NPO) می‌باشد. " },
          { label: "+ درد شکم جراحی", target: "hpi", text: "بیمار با شکایت درد شکم از چند ساعت قبل همراه با تهوع مراجعه نموده است. " },
          { label: "+ نفی مصرف ضدانعقاد", target: "drugs_addiction", text: "عدم مصرف داروهای ضدانعقاد (آسپرین، وارفارین، پلاویکس). " }
        ],
        pe: [
          { label: "+ ظاهر عمومی جراحی", target: "pe_ga", text: "بیمار هوشیار، به علت درد شکمی کمی بی‌قرار است." },
          { label: "+ شکم نرم بدون گاردینگ", target: "pe_abd", text: "شکم نرم، بدون دیستانسیون، تندرنس، ریباند یا گاردینگ." },
          { label: "+ تندرنس RLQ", target: "pe_abd", text: "تندرنس موضعی در ناحیه RLQ؛ علامت ریباند مثبت." }
        ]
      },
      pediatrics: {
        hpi: [
          { label: "+ واکسیناسیون کامل", target: "pmh", text: "واکسیناسیون کودک مطابق جدول کشوری کامل است. " },
          { label: "+ زایمان و رشد طبیعی", target: "pmh", text: "حاصل زایمان ترم، وزن تولد نرمال، رشد متناسب با سن. " }
        ],
        pe: [
          { label: "+ ظاهر عمومی کودک", target: "pe_ga", text: "کودک هوشیار، فعال، هیدراتاسیون مخاطی مناسب، بدون دیسترس تنفسی." },
          { label: "+ فونتانل طبیعی", target: "pe_skull", text: "نرموسفال، فونتانل قدامی باز و هم‌سطح." },
          { label: "+ اتوسکوپی گوش نرمال", target: "pe_ear", text: "کانال گوش و پرده تمپان دو طرف طبیعی." }
        ]
      },
      obgyn: {
        hpi: [
          { label: "+ شرح مامایی (G/P/A/L)", target: "pmh", text: "G: 2 , P: 1 , Ab: 0 , L: 1. " },
          { label: "+ حرکات جنین طبیعی", target: "hpi", text: "حرکات جنین طبیعی؛ نفی آبریزش (ROM) یا خونریزی واژینال. " }
        ],
        pe: [
          { label: "+ ظاهر عمومی بارداری", target: "pe_ga", text: "بیمار هوشیار و پایدار، بدون ادم صورت یا علائم پره‌اکلامپسی." },
          { label: "+ معاینه شکم بارداری و FHR", target: "pe_abd", text: "صدای قلب جنین (FHR) منظم و طبیعی، بدون کنتراکشن رحمی." }
        ]
      }
    };

    function applySpecialtyTemplate() {
      const val = document.getElementById('specialtySelect').value;
      const hpiBox = document.getElementById('hpiChipsContainer');
      const peBox = document.getElementById('peChipsContainer');
      hpiBox.innerHTML = '';
      peBox.innerHTML = '';
      const preset = specialtyPresets[val] || { hpi: [], pe: [] };
      const makeBtn = (c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip-btn';
        b.textContent = c.label;
        b.onclick = () => {
          const el = document.getElementById(c.target);
          if (el) { el.value = (el.value ? el.value + ' ' : '') + c.text; el.focus(); onFormChangeImmediate(); }
        };
        return b;
      };
      preset.hpi.forEach(c => hpiBox.appendChild(makeBtn(c)));
      preset.pe.forEach(c => peBox.appendChild(makeBtn(c)));
    }

    function fillNormalVitals() {
      document.getElementById('vs_bp').value = '120/80 mmHg';
      document.getElementById('vs_pr').value = '78 /min';
      document.getElementById('vs_rr').value = '16 /min';
      document.getElementById('vs_t').value = '36.8 °C';
      document.getElementById('vs_spo2').value = '98 %';
      onFormChangeImmediate();
    }

    function setNormal(id) {
      const el = document.getElementById(id);
      if (el) { el.value = '×'; onFormChangeImmediate(); }
    }

    function setAllOrgansNormal() {
      ['pe_skin','pe_skull','pe_ear','pe_head_neck','pe_eyes','pe_cvs','pe_chest','pe_abd','pe_ext','pe_neuro'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) el.value = '×';
      });
      onFormChangeImmediate();
    }

    function gv(id) {
      const el = document.getElementById(id);
      return el ? el.value : '';
    }

    function toFaDigits(str) {
      return (str || '').trim().replace(/\\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    }

    function sanitizeControlChars(str) {
      return (str || '')
        .replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\uFFFE\\uFFFF]/g, '')
        .replace(/[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?<![\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]/g, '');
    }

    function esc(s) {
      return sanitizeControlChars(s)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/\\r?\\n/g,"<br>");
    }

    function isLatinText(str) {
      if (!str) return false;
      const clean = str.replace(/<br\\s*\\/?>/gi, '').trim();
      if (!clean || clean === '×') return false;
      const latinCount = (clean.match(/[A-Za-z]/g) || []).length;
      const persianCount = (clean.match(/[\\u0600-\\u06FF]/g) || []).length;
      if (latinCount === 0) return false;
      if (persianCount === 0) return true;
      const firstStrongMatch = clean.match(/[A-Za-z\\u0600-\\u06FF]/);
      const startsWithPersian = firstStrongMatch ? /[\\u0600-\\u06FF]/.test(firstStrongMatch[0]) : false;
      if (startsWithPersian) return false;
      return latinCount > persianCount * 2;
    }

    function getVisualCharLength(str) {
      if (!str) return 0;
      return str.replace(/[\\u200B-\\u200F\\uFEFF\\u064B-\\u065F]/g, '').length;
    }

    // فقط برای محاسبه گنجایش و تخمین تعداد خطوط صفحه اول استفاده می‌شود
    function splitTextIntoVisualLines(rawText, charsPerLine = 80) {
      if (!rawText) return [''];
      const sanitized = sanitizeControlChars(rawText);
      const trimmedRight = sanitized.replace(/\\s+$/, '');
      if (!trimmedRight) return [''];
      const rawLines = trimmedRight.split(/\\r?\\n/);
      const visualLines = [];
      rawLines.forEach(line => {
        if (getVisualCharLength(line) <= charsPerLine) {
          visualLines.push(line);
        } else {
          let rem = line;
          while (getVisualCharLength(rem) > charsPerLine) {
            const zwCount = (rem.slice(0, charsPerLine + 15).match(/[\\u200B-\\u200F\\uFEFF\\u064B-\\u065F]/g) || []).length;
            const maxSliceIdx = Math.min(rem.length, charsPerLine + zwCount);
            let cut = rem.lastIndexOf(' ', maxSliceIdx);
            if (cut <= Math.min(20, Math.floor(charsPerLine * 0.4))) cut = maxSliceIdx;
            visualLines.push(rem.slice(0, cut));
            rem = rem.slice(cut).trimStart();
          }
          if (rem.length > 0) visualLines.push(rem);
        }
      });
      return visualLines.length > 0 ? visualLines : [''];
    }

    function formatLinesArrayParagraph(linesArr, bold) {
      const joined = (linesArr || []).join('\\n').trim();
      if (!joined) {
        return \`<p dir="rtl" style="margin:0;line-height:1.2;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:10pt;mso-bidi-font-size:10pt;">&nbsp;</p>\`;
      }
      const v = esc(linesArr.join('\\n'));
      const isEn = isLatinText(joined);
      const dir = isEn ? 'ltr' : 'rtl';
      const align = isEn ? 'left' : 'right';
      const font = isEn ? "'Times New Roman',Arial,sans-serif" : "'Vazirmatn','B Nazanin',Tahoma,sans-serif";
      const weight = bold ? 'font-weight:bold;' : '';
      return \`<p dir="\${dir}" align="\${align}" style="margin:0;line-height:1.2;text-align:\${align};unicode-bidi:plaintext;font-family:\${font};font-size:10pt;mso-bidi-font-size:10pt;\${weight}">\${v}</p>\`;
    }

    function getCombinedVitalSigns() {
      const parts = [];
      if (gv('vs_bp').trim()) parts.push('BP: ' + gv('vs_bp').trim());
      if (gv('vs_pr').trim()) parts.push('PR: ' + gv('vs_pr').trim());
      if (gv('vs_rr').trim()) parts.push('RR: ' + gv('vs_rr').trim());
      if (gv('vs_t').trim()) parts.push('T: ' + gv('vs_t').trim());
      if (gv('vs_spo2').trim()) parts.push('SpO2: ' + gv('vs_spo2').trim());
      const vitalsStr = parts.join(' , ');
      const note = gv('pe_vitals_note').trim();
      if (vitalsStr && note) return \`\${vitalsStr} (\${note})\`;
      return vitalsStr || note || '';
    }

    // ============================================================================
    // ۳. ساخت جداول تفکیک‌شده پیش‌نمایش با Template Literals و بدون پرش ستونی
    // ============================================================================
    const stTopLblR = "border-top:1pt solid #000;border-right:1pt solid #000;border-bottom:none;border-left:none;padding:1.5pt 4pt 0.5pt 2pt;text-align:right;vertical-align:top;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:9.5pt;font-weight:bold;line-height:1.1;";
    const stTopLblL = "border-top:1pt solid #000;border-left:1pt solid #000;border-bottom:none;border-right:none;padding:1.5pt 2pt 0.5pt 4pt;text-align:left;vertical-align:top;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;font-weight:bold;line-height:1.1;white-space:nowrap;";
    const stBotVal  = "border-top:none;border-bottom:1pt solid #000;border-right:1pt solid #000;border-left:1pt solid #000;padding:0.5pt 4pt 1.5pt 4pt;text-align:center;vertical-align:middle;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:10pt;font-weight:bold;line-height:1.15;";
    const stHeadR   = "border-top:1pt solid #000;border-right:1pt solid #000;border-bottom:none;border-left:none;padding:1.5pt 6pt 0.5pt 6pt;text-align:right;vertical-align:top;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:10pt;font-weight:bold;line-height:1.15;";
    const stHeadL   = "border-top:1pt solid #000;border-left:1pt solid #000;border-bottom:none;border-right:none;padding:1.5pt 6pt 0.5pt 6pt;text-align:left;vertical-align:top;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;font-weight:bold;line-height:1.15;";
    const stBody    = "border-top:none;border-bottom:1pt solid #000;border-right:1pt solid #000;border-left:1pt solid #000;padding:1pt 8pt 2pt 8pt;vertical-align:top;line-height:1.15;";
    const stNoLineR = "border-right:1pt solid #000;border-left:none;border-top:none;border-bottom:none;padding:1.5pt 6pt;text-align:right;vertical-align:middle;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:9.5pt;line-height:1.15;";
    const stNoLineL = "border-left:1pt solid #000;border-right:none;border-top:none;border-bottom:none;padding:1.5pt 6pt;text-align:left;vertical-align:middle;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;line-height:1.15;";

    function makeClinicalBoxFromLines(faTitle, enTitle, linesArr, heightPt, colspanPerSide, isBold) {
      const cSide = colspanPerSide > 1 ? \`colspan="\${colspanPerSide}"\` : '';
      const cFull = \`colspan="\${colspanPerSide * 2}"\`;
      const wR = colspanPerSide === 4 ? '50%' : '55%';
      const wL = colspanPerSide === 4 ? '50%' : '45%';
      return \`
        <tr>
          <td \${cSide} width="\${wR}" dir="rtl" style="\${stHeadR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:10pt;">\${faTitle}:&rlm;</p></td>
          <td \${cSide} width="\${wL}" dir="ltr" style="\${stHeadL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">\${enTitle}:</p></td>
        </tr>
        <tr style="height:\${heightPt}pt;">
          <td \${cFull} style="\${stBody}height:\${heightPt}pt;">\${formatLinesArrayParagraph(linesArr, !!isBold)}</td>
        </tr>
      \`;
    }

    // الگوی ۲ سطری تمام‌عرض برای ارگان‌ها جهت حذف کامل پرش مقادیر بین ستون فارسی و انگلیسی
    function makeBilingualOrganRow(faLabel, enLabel, rawVal, colspanEach, withHorizontalBorders) {
      const cleanVal = (rawVal || '').trim();
      const isEn = isLatinText(cleanVal);
      const valDir = isEn ? 'ltr' : 'rtl';
      const valAlign = isEn ? 'left' : 'right';
      const valFont = isEn ? "'Times New Roman',Arial,sans-serif" : "'Vazirmatn','B Nazanin',Tahoma,sans-serif";
      const bTop = withHorizontalBorders ? "border-top:1pt solid #000;" : "";
      const bBot = withHorizontalBorders ? "border-bottom:1pt solid #000;" : "border-bottom:none;";
      const cSpanAttr = colspanEach > 1 ? \`colspan="\${colspanEach}"\` : '';
      const cFullAttr = \`colspan="\${colspanEach * 2}"\`;
      const wR = colspanEach === 4 ? '50%' : '55%';
      const wL = colspanEach === 4 ? '50%' : '45%';
      return \`
        <tr>
          <td \${cSpanAttr} width="\${wR}" dir="rtl" style="\${stNoLineR}\${bTop}padding:1pt 6pt 0pt 6pt;">
            <p dir="rtl" style="margin:0;line-height:1.1;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:9.5pt;font-weight:bold;">\${faLabel}:&rlm;</p>
          </td>
          <td \${cSpanAttr} width="\${wL}" dir="ltr" style="\${stNoLineL}\${bTop}padding:1pt 6pt 0pt 6pt;">
            <p dir="ltr" style="margin:0;line-height:1.1;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;font-weight:bold;">\${enLabel}:</p>
          </td>
        </tr>
        <tr>
          <td \${cFullAttr} width="100%" dir="\${valDir}" style="border-right:1pt solid #000;border-left:1pt solid #000;border-top:none;\${bBot}padding:0pt 8pt 1.5pt 8pt;text-align:\${valAlign};vertical-align:top;">
            <p dir="\${valDir}" align="\${valAlign}" style="margin:0;line-height:1.15;text-align:\${valAlign};unicode-bidi:plaintext;font-family:\${valFont};font-size:9.5pt;">\${cleanVal ? esc(cleanVal) : '&nbsp;'}</p>
          </td>
        </tr>
      \`;
    }

    function makeStandardFooter(admDate, user, pageNum, totalPages) {
      const d = (admDate || '').trim() || '1405/07/29';
      const u = (user || '').trim() || 'W1361';
      return \`
        <table dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin-top:2pt;border:none;page-break-inside:avoid;">
          <tr style="page-break-inside:avoid;">
            <td colspan="4" dir="rtl" align="right" style="border:none;border-bottom:1.5pt solid #000;padding-bottom:1pt;text-align:right;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:8.5pt;line-height:1.1;">
              <p dir="rtl" style="margin:0;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:8.5pt;font-weight:bold;">طرح استاندارد و بهینه نمودن سیستم مدارک پزشکی ۱۰۰/۲۰ &nbsp;-&nbsp; برگ شرح حال و معاینه بدنی</p>
            </td>
          </tr>
          <tr style="page-break-inside:avoid;">
            <td width="20%" dir="ltr" align="left" style="border:none;padding-top:1pt;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;"><b>User :</b> &nbsp;\${u}</td>
            <td width="35%" dir="ltr" align="left" style="border:none;padding-top:1pt;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;"><b>Date :</b> &nbsp;\${d} 10:23:26 AM</td>
            <td width="25%" dir="ltr" align="left" style="border:none;padding-top:1pt;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;"><b>Report no :</b> &nbsp;R173</td>
            <td width="20%" dir="ltr" align="left" style="border:none;padding-top:1pt;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;"><b>Page :</b> &nbsp;\${pageNum} &nbsp;of &nbsp;\${totalPages}</td>
          </tr>
        </table>
      \`;
    }

    function calculatePaginationState() {
      const vitalsCombined = getCombinedVitalSigns();
      const LINE_PT = 15.5;
      const MAX_P1_LINE_BUDGET = 21.0;

      const rawSections = [
        { key: 'cc', fa: 'شکایت اصلی بیمار', en: 'Chief Complaint', rawText: gv('chief_complaint'), lines: splitTextIntoVisualLines(gv('chief_complaint'), 80), defLines: 1.5, minLines: 1 },
        { key: 'hpi', fa: 'تاریخچه بیماری فعلی', en: 'History of Present Illness', rawText: gv('hpi'), lines: splitTextIntoVisualLines(gv('hpi'), 80), defLines: 4.0, minLines: 2 },
        { key: 'pmh', fa: 'تاریخچه ی بیماریهای قبلی', en: 'Past Diseases History', rawText: gv('pmh'), lines: splitTextIntoVisualLines(gv('pmh'), 80), defLines: 1.8, minLines: 1 },
        { key: 'drugs', fa: 'داروهای در حال مصرف و سایر اعتیادات', en: 'Current Drug Therapy & Other Addiction', rawText: gv('drugs_addiction'), lines: splitTextIntoVisualLines(gv('drugs_addiction'), 80), defLines: 1.8, minLines: 1 },
        { key: 'allergy', fa: 'حساسیت به', en: 'Allergy to', rawText: gv('allergy'), lines: splitTextIntoVisualLines(gv('allergy'), 80), defLines: 1.2, minLines: 1 },
        { key: 'fh', fa: 'سوابق فامیلی', en: 'Family History', rawText: gv('family_history'), lines: splitTextIntoVisualLines(gv('family_history'), 80), defLines: 1.2, minLines: 1 }
      ];

      rawSections.forEach(s => {
        s.textLineCount = s.lines.length;
        s.displayLines = Math.max(s.defLines, s.textLineCount);
      });

      const p1ExamOrgans = [
        { key: 'ga', fa: 'وضعیت ظاهری عمومی', en: 'General Appearance', v: gv('pe_ga').trim(), cost: 1.1 },
        { key: 'vitals', fa: 'علائم حیاتی', en: 'Vital Signs', v: vitalsCombined, cost: 1.1 },
        { key: 'skin', fa: 'پوست', en: 'Skin', v: gv('pe_skin').trim(), cost: 1.1 },
        { key: 'skull', fa: 'جمجمه', en: 'Skull', v: gv('pe_skull').trim(), cost: 1.1 },
        { key: 'ear', fa: 'گوش', en: 'Ear', v: gv('pe_ear').trim(), cost: 1.1 }
      ];

      const getExamBlockCost = (organs) => organs.length === 0 ? 0.8 : (1.1 + organs.reduce((acc, o) => acc + o.cost, 0));
      const getP1TotalUnits = (secs, organs) => secs.reduce((acc, s) => acc + s.displayLines, 0) + getExamBlockCost(organs);

      if (getP1TotalUnits(rawSections, p1ExamOrgans) > MAX_P1_LINE_BUDGET) {
        rawSections.forEach(s => { s.displayLines = Math.max(s.minLines, s.textLineCount); });
      }

      const movedOrgans = [];
      const movedSectionsToP2 = [];

      while (p1ExamOrgans.length > 0 && getP1TotalUnits(rawSections, p1ExamOrgans) > MAX_P1_LINE_BUDGET) {
        movedOrgans.unshift(p1ExamOrgans.pop());
      }
      while (rawSections.length > 2 && getP1TotalUnits(rawSections, p1ExamOrgans) > MAX_P1_LINE_BUDGET) {
        movedSectionsToP2.unshift(rawSections.pop());
      }

      const p1FinalSections = [];
      const p2FinalSections = [];
      let usedOnP1 = getExamBlockCost(p1ExamOrgans);

      for (let i = 0; i < rawSections.length; i++) {
        const sec = rawSections[i];
        const isHpi = sec.key === 'hpi';
        const remainingSecs = rawSections.slice(i + 1).reduce((acc, s) => acc + s.minLines, 0);
        const spaceForThis = MAX_P1_LINE_BUDGET - usedOnP1 - remainingSecs;

        if (spaceForThis >= sec.displayLines || !isHpi) {
          p1FinalSections.push({ fa: sec.fa, en: sec.en, rawText: sec.rawText, lines: sec.lines, heightPt: Math.round(sec.displayLines * LINE_PT) });
          usedOnP1 += sec.displayLines;
        } else {
          const keepLines = Math.max(2, Math.floor(spaceForThis));
          const p1Lines = sec.lines.slice(0, keepLines);
          const p2Lines = sec.lines.slice(keepLines);
          p1FinalSections.push({ fa: sec.fa, en: sec.en, rawText: p1Lines.join('\\n'), lines: p1Lines, heightPt: Math.round(keepLines * LINE_PT) });
          usedOnP1 += keepLines;
          if (p2Lines.length > 0) {
            p2FinalSections.push({ fa: sec.fa + ' (ادامه)', en: sec.en + ' (Continued)', rawText: p2Lines.join('\\n'), lines: p2Lines, heightPt: Math.round(p2Lines.length * LINE_PT) });
          }
        }
      }

      movedSectionsToP2.forEach(s => {
        p2FinalSections.push({ fa: s.fa, en: s.en, rawText: s.rawText, lines: s.lines, heightPt: Math.round(Math.max(s.minLines, s.textLineCount) * LINE_PT) });
      });

      return { p1FinalSections, p1ExamOrgans, movedOrgans, p2FinalSections, LINE_PT };
    }

    function buildHospitalPagesHTML() {
      const recNo = esc(toFaDigits(gv('rec_no'))),
            pName = esc(gv('patient_name').trim()),
            pFamily = esc(gv('patient_family').trim()),
            pFather = esc(gv('patient_father').trim()),
            bDate = esc(toFaDigits(gv('birth_date'))),
            ward = esc(gv('ward_name').trim()),
            room = esc(toFaDigits(gv('room_no'))),
            bed = esc(toFaDigits(gv('bed_no'))),
            doc = esc(gv('attending_physician').trim()),
            admDate = esc(toFaDigits(gv('adm_date'))),
            admTime = esc(toFaDigits(gv('adm_time'))),
            user = esc(gv('user_code').trim());

      const { p1FinalSections, p1ExamOrgans, movedOrgans, p2FinalSections, LINE_PT } = calculatePaginationState();

      const p1BoxesHTML = p1FinalSections
        .map(s => makeClinicalBoxFromLines(s.fa, s.en, [s.rawText], s.heightPt, 1, false))
        .join('');

      let p1ExamBlockHTML = '';
      if (p1ExamOrgans.length > 0) {
        p1ExamBlockHTML = \`
          <tr>
            <td width="50%" dir="rtl" style="\${stHeadR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:10pt;">معاینات بدنی و بررسی های بالینی:&rlm;</p></td>
            <td width="50%" dir="ltr" style="\${stHeadL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">Physical &amp; Clinical Examination:</p></td>
          </tr>
          \${p1ExamOrgans.map(o => makeBilingualOrganRow(o.fa, o.en, o.v, 1, false)).join('')}
          <tr>
            <td width="50%" dir="rtl" style="\${stNoLineR}border-bottom:1pt solid #000;font-weight:bold;"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:9.5pt;">لطفا پشت صفحه را تکمیل کنید</p></td>
            <td width="50%" dir="ltr" style="\${stNoLineL}border-bottom:1pt solid #000;font-weight:bold;"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;">Please Complete the Reverse side</p></td>
          </tr>
        \`;
      } else {
        p1ExamBlockHTML = \`
          <tr>
            <td width="50%" dir="rtl" style="\${stNoLineR}border-top:1pt solid #000;border-bottom:1pt solid #000;font-weight:bold;"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:9.5pt;">لطفا پشت صفحه را تکمیل کنید</p></td>
            <td width="50%" dir="ltr" style="\${stNoLineL}border-top:1pt solid #000;border-bottom:1pt solid #000;font-weight:bold;"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;">Please Complete the Reverse side</p></td>
          </tr>
        \`;
      }

      // تفکیک به ۳ جدول مستقل در صفحه اول (هدر، جدول ۸ ستونی مشخصات بیمار، جدول ۲ ستونی شرح حال)
      const page1 = \`
        <table dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:none;margin-bottom:1pt;">
          <tr>
            <td width="25%" style="border:none;">&nbsp;</td>
            <td width="50%" align="center" valign="middle" style="border:none;text-align:center;padding-bottom:1pt;">
              <p dir="rtl" style="margin:0;line-height:1.1;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:12pt;font-weight:bold;">بیمارستان شهدای خلیج فارس بوشهر</p>
              <p dir="ltr" style="margin:0;line-height:1.1;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;font-weight:bold;">Bushehr Khalij Fars Hospital</p>
              <p dir="rtl" style="margin:0.5pt 0 0 0;line-height:1.1;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:11pt;font-weight:bold;">برگ شرح حال و معاینه بدنی</p>
              <p dir="ltr" style="margin:0;line-height:1.1;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;font-weight:bold;">Medical History &amp; Physical Examination Sheet</p>
            </td>
            <td width="25%" style="border:none;">&nbsp;</td>
          </tr>
        </table>

        <table dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:none;margin-bottom:3pt;">
          <tr>
            <td width="13%" dir="rtl" style="\${stTopLblR}"><p dir="rtl" style="margin:0;">شماره پرونده:&rlm;</p></td>
            <td width="12%" dir="ltr" style="\${stTopLblL}"><p dir="ltr" style="margin:0;">Unit No:</p></td>
            <td colspan="6" width="75%" style="border:none;">&nbsp;</td>
          </tr>
          <tr>
            <td colspan="2" width="25%" dir="rtl" style="\${stBotVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">\${recNo || '&nbsp;'}</p></td>
            <td colspan="6" width="75%" style="border:none;border-bottom:1pt solid #000;">&nbsp;</td>
          </tr>
          <tr>
            <td width="13%" dir="rtl" style="\${stTopLblR}"><p dir="rtl" style="margin:0;">نام خانوادگی:&rlm;</p></td>
            <td width="12%" dir="ltr" style="\${stTopLblL}"><p dir="ltr" style="margin:0;">Last Name:</p></td>
            <td width="13%" dir="rtl" style="\${stTopLblR}"><p dir="rtl" style="margin:0;">نام:&rlm;</p></td>
            <td width="12%" dir="ltr" style="\${stTopLblL}"><p dir="ltr" style="margin:0;">Name:</p></td>
            <td width="14%" dir="rtl" style="\${stTopLblR}"><p dir="rtl" style="margin:0;">بخش:&rlm; &nbsp;\${ward}</p></td>
            <td width="11%" dir="ltr" style="\${stTopLblL}"><p dir="ltr" style="margin:0;">Ward:</p></td>
            <td width="13%" dir="rtl" style="\${stTopLblR}"><p dir="rtl" style="margin:0;">پزشک معالج:&rlm;</p></td>
            <td width="12%" dir="ltr" style="\${stTopLblL}"><p dir="ltr" style="margin:0;">Physician:</p></td>
          </tr>
          <tr>
            <td colspan="2" width="25%" dir="rtl" style="\${stBotVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">\${pFamily || '&nbsp;'}</p></td>
            <td colspan="2" width="25%" dir="rtl" style="\${stBotVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">\${pName || '&nbsp;'}</p></td>
            <td width="14%" dir="rtl" style="\${stNoLineR}font-size:9pt;font-weight:bold;"><p dir="rtl" style="margin:0;">اتاق:&rlm; &nbsp;\${room}</p></td>
            <td width="11%" dir="ltr" style="\${stNoLineL}font-size:8pt;font-weight:bold;"><p dir="ltr" style="margin:0;">Room:</p></td>
            <td colspan="2" width="25%" dir="rtl" style="\${stBotVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">\${doc || '&nbsp;'}</p></td>
          </tr>
          <tr>
            <td width="13%" dir="rtl" style="\${stTopLblR}"><p dir="rtl" style="margin:0;">نام پدر:&rlm;</p></td>
            <td width="12%" dir="ltr" style="\${stTopLblL}"><p dir="ltr" style="margin:0;">Father Name:</p></td>
            <td width="13%" dir="rtl" style="\${stTopLblR}"><p dir="rtl" style="margin:0;">تاریخ تولد:&rlm;</p></td>
            <td width="12%" dir="ltr" style="\${stTopLblL}"><p dir="ltr" style="margin:0;">Birth Date:</p></td>
            <td width="14%" dir="rtl" style="\${stNoLineR}font-size:9pt;font-weight:bold;"><p dir="rtl" style="margin:0;">تخت:&rlm; &nbsp;\${bed}</p></td>
            <td width="11%" dir="ltr" style="\${stNoLineL}font-size:8pt;font-weight:bold;"><p dir="ltr" style="margin:0;">Bed:</p></td>
            <td width="11%" dir="rtl" style="\${stTopLblR}"><p dir="rtl" style="margin:0;">تاریخ پذیرش:&rlm;</p></td>
            <td width="14%" dir="ltr" style="\${stTopLblL}"><p dir="ltr" style="margin:0;">Date of Admission:</p></td>
          </tr>
          <tr>
            <td colspan="2" width="25%" dir="rtl" style="\${stBotVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">\${pFather || '&nbsp;'}</p></td>
            <td colspan="2" width="25%" dir="rtl" style="\${stBotVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">\${bDate || '&nbsp;'}</p></td>
            <td colspan="2" width="25%" dir="rtl" style="\${stBotVal}"><p dir="rtl" style="margin:0;">&nbsp;</p></td>
            <td colspan="2" width="25%" dir="rtl" style="\${stBotVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">\${(admTime ? admTime + ' &nbsp;&nbsp; ' : '') + (admDate || '&nbsp;')}</p></td>
          </tr>
        </table>

        <table dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:none;">
          \${p1BoxesHTML}
          \${p1ExamBlockHTML}
        </table>
        \${makeStandardFooter(gv('adm_date'), user, 1, 2)}
      \`;

      const overflowBoxesHTML = p2FinalSections
        .map(s => makeClinicalBoxFromLines(s.fa, s.en, [s.rawText], s.heightPt, 1, false))
        .join('');
      const page2BaseOrgans = [
        ...movedOrgans,
        { fa: 'سر و گردن', en: 'Head & Neck', v: gv('pe_head_neck') },
        { fa: 'چشم', en: 'Eyes', v: gv('pe_eyes') },
        { fa: 'قلب و عروق', en: 'Cardiovascular', v: gv('pe_cvs') },
        { fa: 'ریه', en: 'Lungs', v: gv('pe_chest') },
        { fa: 'شکم', en: 'Abdomen', v: gv('pe_abd') },
        { fa: 'اندام‌ها', en: 'Extremities', v: gv('pe_ext') },
        { fa: 'سیستم عصبی', en: 'Neurological', v: gv('pe_neuro') }
      ];
      const page2OrgansHTML = page2BaseOrgans.map(o => makeBilingualOrganRow(o.fa, o.en, o.v, 1, true)).join('');

      const overflowPt = p2FinalSections.reduce((s, x) => s + 14 + x.heightPt, 0) + (movedOrgans.length * 14);
      const sumLines = splitTextIntoVisualLines(gv('clinical_summary'), 85);
      const dxLines  = splitTextIntoVisualLines(gv('primary_dx'), 85);
      const sigLines = splitTextIntoVisualLines(gv('examining_physician'), 85);

      const sumH = Math.max(sumLines.length * LINE_PT, Math.max(35, Math.round(110 - overflowPt * 0.5)));
      const dxH  = Math.max(dxLines.length * LINE_PT,  Math.max(24, Math.round(55  - overflowPt * 0.25)));
      const sigH = Math.max(sigLines.length * LINE_PT, Math.max(24, Math.round(48  - overflowPt * 0.20)));

      const page2 = \`
        <table dir="rtl" width="100%" cellspacing="0" cellpadding="2" style="width:100%;border-collapse:collapse;border:none;margin-bottom:2pt;">
          <tr>
            <td align="center" style="border:none;text-align:center;">
              <p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:12pt;font-weight:bold;">برگ شرح حال و معاینه بدنی</p>
              <p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;font-weight:bold;">Medical History &amp; Physical Examination Sheet</p>
            </td>
          </tr>
        </table>

        <table dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:1.5pt solid #000;">
          \${overflowBoxesHTML}
          <tr>
            <td width="55%" dir="rtl" style="\${stHeadR}border-bottom:1pt solid #000;"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:10pt;">معاینات بدنی و بررسیهای اولیه بالینی (ادامه):&rlm;</p></td>
            <td width="45%" dir="ltr" style="\${stHeadL}border-bottom:1pt solid #000;"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">Physical Examination &amp; Clinical Investigation (Continued):</p></td>
          </tr>
          \${page2OrgansHTML}
          <tr>
            <td colspan="2" style="border:1pt solid #000;padding:2.5pt 6pt;background-color:#f8fafc;">
              <p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:9pt;font-weight:bold;color:#475569;">در صورت وجود بیماری یا نقص در مقابل آن توضیح داده شود و در غیر این صورت با علامت <b>×</b> مشخص گردد.</p>
            </td>
          </tr>
          <tr>
            <td width="55%" dir="rtl" style="\${stHeadR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:10pt;">خلاصه:&rlm;</p></td>
            <td width="45%" dir="ltr" style="\${stHeadL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">SUMMARY:</p></td>
          </tr>
          <tr style="height:\${sumH}pt;"><td colspan="2" style="\${stBody}height:\${sumH}pt;">\${formatLinesArrayParagraph([gv('clinical_summary')], false)}</td></tr>
          <tr>
            <td width="55%" dir="rtl" style="\${stHeadR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:10pt;">تشخیص اولیه:&rlm;</p></td>
            <td width="45%" dir="ltr" style="\${stHeadL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">Primary DX:</p></td>
          </tr>
          <tr style="height:\${dxH}pt;"><td colspan="2" style="\${stBody}height:\${dxH}pt;">\${formatLinesArrayParagraph([gv('primary_dx')], true)}</td></tr>
          <tr>
            <td width="55%" dir="rtl" style="\${stHeadR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin',Tahoma,sans-serif;font-size:10pt;">امضاء پزشک معاینه کننده:&rlm;</p></td>
            <td width="45%" dir="ltr" style="\${stHeadL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">Signature of Examining physician:</p></td>
          </tr>
          <tr style="height:\${sigH}pt;"><td colspan="2" style="\${stBody}height:\${sigH}pt;">\${formatLinesArrayParagraph([gv('examining_physician')], false)}</td></tr>
        </table>
        \${makeStandardFooter(gv('adm_date'), user, 2, 2)}
      \`;

      return { page1, page2 };
    }

    function updatePreview() {
      const { page1, page2 } = buildHospitalPagesHTML();
      renderScaledPages(page1, page2);
    }

    function saveToStorage() {
      const obj = {};
      allFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) obj[id] = el.value;
      });
      const st = document.getElementById('saveStatus');
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
        if (st) {
          st.textContent = 'ذخیره شد ✓';
          setTimeout(() => { st.textContent = '✓ آماده'; }, 1500);
        }
      } catch (e) {
        if (st) st.textContent = '⚠ حافظه مرورگر در دسترس نیست';
      }
    }

    // تفکیک کامل رندر پیش‌نمایش و ذخیره‌سازی در LocalStorage با Debounce
    const debouncedPreview = debounce(() => {
      if (window.innerWidth >= 992 || currentMobileTab === 'preview') {
        updatePreview();
      }
    }, 300);

    const debouncedSave = debounce(saveToStorage, 1200);

    function onFormInput() {
      isFormDirty = true;
      debouncedPreview();
      debouncedSave();
    }

    function onFormChangeImmediate() {
      isFormDirty = true;
      if (window.innerWidth >= 992 || currentMobileTab === 'preview') {
        updatePreview();
      }
      saveToStorage();
    }

    function loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const obj = JSON.parse(raw);
          allFieldIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && obj[id] !== undefined) el.value = obj[id];
          });
        } else {
          loadDefaultSample(false);
        }
      } catch (e) {
        loadDefaultSample(false);
      }
    }

    function loadDefaultSample(confirmPrompt = true) {
      if (confirmPrompt && !confirm('آیا می‌خواهید داده‌های نمونه بالینی کامل بارگذاری شوند؟')) return;
      const sample = {
        rec_no: '1403/98241',
        patient_name: 'رضا',
        patient_family: 'خلیلی بوشهری',
        patient_father: 'محمد',
        birth_date: '1358/04/12',
        ward_name: 'داخلی مردان',
        room_no: '304',
        bed_no: '2',
        attending_physician: 'دکتر علیرضا بحرانی',
        adm_date: '1403/08/15',
        adm_time: '09:30',
        user_code: 'W1361',
        chief_complaint: 'درد قفسه سینه فشارنده همراه با تنگی نفس فعالیتی از ۲ روز گذشته',
        hpi: 'بیمار آقای ۴۵ ساله، بدون سابقه ترومای قفسه سینه، با شکایت درد مبهم در ناحیه پره‌کوردیال و رترواسترنال از ۴۸ ساعت قبل مراجعه کرده است. درد با فعالیت تشدید شده و به شانه چپ انتشار دارد. سابقه تعریق سرد و تهوع خفیف ذکر می‌کند. علائم حیاتی در بدو ورود پایدار است.',
        pmh: 'سابقه پرفشاری خون (HTN) و دیس‌لیپیدمی از ۵ سال قبل تحت کنترل دارویی. سابقه دیابت منفی.',
        drugs_addiction: 'قرص لوزارتان ۲۵ میلی‌گرم روزانه، آتورواستاتین ۲۰ میلی‌گرم، نفی مصرف سیگار، الکل و سایر مواد مخدر.',
        allergy: 'NKDA (فاقد حساسیت دارویی و غذایی شناخته شده)',
        family_history: 'سابقه بیماری ایسکمیک قلبی (CAD) در پدر در سن ۵۵ سالگی.',
        pe_ga: 'بیمار هوشیار و آگاه، در وضعیت نشسته راحت، بدون دیسترس حاد تنفسی یا بیقراری.',
        vs_bp: '125/80 mmHg',
        vs_pr: '76 /min',
        vs_rr: '16 /min',
        vs_t: '36.7 °C',
        vs_spo2: '98 %',
        pe_vitals_note: 'در هوای اتاق (Room Air)',
        pe_skin: 'تورگور پوستی طبیعی، فاقد راش، ضایعه، رنگ‌پریدگی یا زردی (ایکتر).',
        pe_skull: 'نرموسفال، بدون تندرنس موضعی، هماتوم یا دفورمیتی استخوانی.',
        pe_ear: 'مجاری شنوایی باز و تمیز، پرده تمپان سالم با رفلکس نوری طبیعی دوطرفه.',
        pe_head_neck: 'مخاطات صورتی، مردمک‌ها ایزوکوریک و واکنش‌پذیر به نور (PERRLA)، بدون برجستگی ورید ژوگولار (JVD: negative).',
        pe_eyes: 'صلبیه بدون ایکتر، ملتحمه شفاف و صورتی، حرکات خارج چشمی (EOM) نرمال و قرینه.',
        pe_cvs: 'صداهای قلبی S1 و S2 نرمال و منظم، بدون سوفل، گالوپ، کلیک یا راب پریکاردیال.',
        pe_chest: 'حرکات قفسه سینه قرینه، صداهای تنفسی شفاف در هر دو ریه، بدون رال، کراکل، رونکای یا ویزینگ.',
        pe_abd: 'شکم نرم و مسطح، بدون تندرنس، ریباند، گاردینگ عضلانی، بدون ارگانومگالی (هپاتواسپلنومگالی).',
        pe_ext: 'نبض‌های محیطی رادیال و دورسالیس‌پدیس قرینه و پر، فاقد ادم گوده‌گذار در هر دو اندام تحتانی، بدون سیانوز کلابینگ.',
        pe_neuro: 'هوشیار و کاملاً آگاه به زمان، مکان و اشخاص (GCS: 15/15)، اعصاب کرانیال ۲ تا ۱۲ سالم، فاقد نقص فوکال عصبی.',
        clinical_summary: 'آقای ۴۵ ساله با درد تیپیک ایسکمیک قلبی و سابقه فامیلی CAD مثبت، تحت نظر قلبی و انجام EKG سریال و بررسی آنزیم‌های قلبی (Troponin). علائم حیاتی بدو ورود پایدار است.',
        primary_dx: 'Acute Coronary Syndrome (ACS) - R/O Unstable Angina',
        examining_physician: 'دکتر احسان حسینی - رزیدنت داخلی',
        specialtySelect: 'internal'
      };

      allFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && sample[id] !== undefined) el.value = sample[id];
      });
      applySpecialtyTemplate();
      onFormChangeImmediate();
    }

    function clearFormConfirm() {
      if (!confirm('آیا مطمئن هستید که می‌خواهید تمام اطلاعات فرم را پاک کنید؟')) return;
      allFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && id !== 'specialtySelect') el.value = '';
      });
      onFormChangeImmediate();
    }

    // ============================================================================
    // ۴. مولد بومی فایل واقعی Word با فرمت استاندارد .docx (Office Open XML ZIP)
    // با جداول تفکیک‌شده، Word-Wrapping طبیعی، حذف پرش ستونی و کشینگ هوشمند
    // ============================================================================
    function xmlEsc(str) {
      return sanitizeControlChars(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    const CRC32_TABLE = (() => {
      const table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
      }
      return table;
    })();

    function crc32Bytes(bytes) {
      let c = 0xffffffff;
      for (let i = 0; i < bytes.length; i++) {
        c = CRC32_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
      }
      return (c ^ 0xffffffff) >>> 0;
    }

    function createZipArchive(files) {
      const encoder = new TextEncoder();
      const entries = files.map(f => {
        const nameBytes = encoder.encode(f.name);
        const dataBytes = encoder.encode(f.content);
        const crc = crc32Bytes(dataBytes);
        return { nameBytes, dataBytes, crc, offset: 0 };
      });

      let localSize = 0;
      let cdSize = 0;
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        e.offset = localSize;
        localSize += 30 + e.nameBytes.length + e.dataBytes.length;
        cdSize += 46 + e.nameBytes.length;
      }

      const totalSize = localSize + cdSize + 22;
      const out = new Uint8Array(totalSize);
      const view = new DataView(out.buffer);
      let pos = 0;

      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        view.setUint32(pos, 0x04034b50, true); pos += 4;
        view.setUint16(pos, 20, true); pos += 2;
        view.setUint16(pos, 0x0800, true); pos += 2;
        view.setUint16(pos, 0, true); pos += 2;
        view.setUint16(pos, 0, true); pos += 2;
        view.setUint16(pos, 0x0021, true); pos += 2;
        view.setUint32(pos, e.crc, true); pos += 4;
        view.setUint32(pos, e.dataBytes.length, true); pos += 4;
        view.setUint32(pos, e.dataBytes.length, true); pos += 4;
        view.setUint16(pos, e.nameBytes.length, true); pos += 2;
        view.setUint16(pos, 0, true); pos += 2;
        out.set(e.nameBytes, pos); pos += e.nameBytes.length;
        out.set(e.dataBytes, pos); pos += e.dataBytes.length;
      }

      const cdOffset = pos;

      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        view.setUint32(pos, 0x02014b50, true); pos += 4;
        view.setUint16(pos, 20, true); pos += 2;
        view.setUint16(pos, 20, true); pos += 2;
        view.setUint16(pos, 0x0800, true); pos += 2;
        view.setUint16(pos, 0, true); pos += 2;
        view.setUint16(pos, 0, true); pos += 2;
        view.setUint16(pos, 0x0021, true); pos += 2;
        view.setUint32(pos, e.crc, true); pos += 4;
        view.setUint32(pos, e.dataBytes.length, true); pos += 4;
        view.setUint32(pos, e.dataBytes.length, true); pos += 4;
        view.setUint16(pos, e.nameBytes.length, true); pos += 2;
        view.setUint16(pos, 0, true); pos += 2;
        view.setUint16(pos, 0, true); pos += 2;
        view.setUint16(pos, 0, true); pos += 2;
        view.setUint16(pos, 0, true); pos += 2;
        view.setUint32(pos, 0, true); pos += 4;
        view.setUint32(pos, e.offset, true); pos += 4;
        out.set(e.nameBytes, pos); pos += e.nameBytes.length;
      }

      view.setUint32(pos, 0x06054b50, true); pos += 4;
      view.setUint16(pos, 0, true); pos += 2;
      view.setUint16(pos, 0, true); pos += 2;
      view.setUint16(pos, entries.length, true); pos += 2;
      view.setUint16(pos, entries.length, true); pos += 2;
      view.setUint32(pos, cdSize, true); pos += 4;
      view.setUint32(pos, cdOffset, true); pos += 4;
      view.setUint16(pos, 0, true); pos += 2;

      return out;
    }

    // استفاده صریح و استاندارد از کلیدهای top, left, bottom, right
    function wBorders(b = {}) {
      const sz = b.size || 6;
      return \`<w:tcBorders>
        \${b.top ? \`<w:top w:val="single" w:sz="\${sz}" w:space="0" w:color="000000"/>\` : '<w:top w:val="nil"/>'}
        \${b.left ? \`<w:left w:val="single" w:sz="\${sz}" w:space="0" w:color="000000"/>\` : '<w:left w:val="nil"/>'}
        \${b.bottom ? \`<w:bottom w:val="single" w:sz="\${sz}" w:space="0" w:color="000000"/>\` : '<w:bottom w:val="nil"/>'}
        \${b.right ? \`<w:right w:val="single" w:sz="\${sz}" w:space="0" w:color="000000"/>\` : '<w:right w:val="nil"/>'}
      </w:tcBorders>\`;
    }

    function wRun(text, opts = {}) {
      const sz = opts.szHalfPt || 20;
      const font = opts.isEn ? 'Times New Roman' : 'B Nazanin';
      const boldTag = opts.bold ? '<w:b/><w:bCs/>' : '';
      const rtlTag = opts.isEn ? '' : '<w:rtl/>';
      const colorTag = opts.color ? \`<w:color w:val="\${opts.color}"/>\` : '';
      return \`<w:r><w:rPr><w:rFonts w:ascii="\${font}" w:hAnsi="\${font}" w:cs="B Nazanin"/>\${boldTag}\${colorTag}<w:sz w:val="\${sz}"/><w:szCs w:val="\${sz}"/>\${rtlTag}</w:rPr><w:t xml:space="preserve">\${xmlEsc(text)}</w:t></w:r>\`;
    }

    function wPara(runsXml, opts = {}) {
      const rtl = opts.rtl !== false;
      const jcTag = opts.align === 'center' ? '<w:jc w:val="center"/>' : '';
      const bidiTag = rtl ? '<w:bidi/>' : '';
      const line = opts.lineDxa || 230;
      const before = opts.beforeDxa !== undefined ? opts.beforeDxa : 10;
      const after = opts.afterDxa !== undefined ? opts.afterDxa : 10;
      return \`<w:p><w:pPr>\${bidiTag}<w:spacing w:before="\${before}" w:after="\${after}" w:line="\${line}" w:lineRule="auto"/>\${jcTag}</w:pPr>\${runsXml}</w:p>\`;
    }

    function wCell(innerParasXml, opts) {
      const spanTag = (opts.gridSpan && opts.gridSpan > 1) ? \`<w:gridSpan w:val="\${opts.gridSpan}"/>\` : '';
      const vAlignTag = \`<w:vAlign w:val="\${opts.vAlign || 'top'}"/>\`;
      const shdTag = opts.shading ? \`<w:shd w:val="clear" w:color="auto" w:fill="\${opts.shading}"/>\` : '';
      return \`<w:tc><w:tcPr><w:tcW w:w="\${opts.widthDxa}" w:type="dxa"/>\${spanTag}\${wBorders(opts.borders || {})}\${shdTag}<w:tcMar><w:top w:w="20" w:type="dxa"/><w:bottom w:w="20" w:type="dxa"/><w:left w:w="75" w:type="dxa"/><w:right w:w="75" w:type="dxa"/></w:tcMar>\${vAlignTag}</w:tcPr>\${innerParasXml}</w:tc>\`;
    }

    // واگذاری شکستن خطوط به موتور Word (فقط شکست بر اساس خطوط واقعی Enter کاربر)
    function makeNaturalWordParas(rawText, bold = false) {
      const trimmed = (rawText || '').trim();
      if (!trimmed) return wPara(wRun(' ', { szHalfPt: 20 }));
      const isEn = isLatinText(trimmed);
      return trimmed
        .split(/\\r?\\n/)
        .map(p => wPara(wRun(p || ' ', { bold: !!bold, szHalfPt: 20, isEn }), { rtl: !isEn }))
        .join('');
    }

    function buildRealDocxBytes() {
      const recNo = toFaDigits(gv('rec_no')),
            pName = gv('patient_name').trim(),
            pFamily = gv('patient_family').trim(),
            pFather = gv('patient_father').trim(),
            bDate = toFaDigits(gv('birth_date')),
            ward = gv('ward_name').trim(),
            room = toFaDigits(gv('room_no')),
            bed = toFaDigits(gv('bed_no')),
            doc = gv('attending_physician').trim(),
            admDate = toFaDigits(gv('adm_date')),
            admTime = toFaDigits(gv('adm_time')),
            user = gv('user_code').trim() || 'W1361';

      const { p1FinalSections, p1ExamOrgans, movedOrgans, p2FinalSections, LINE_PT } = calculatePaginationState();

      const C1 = 1400, C2 = 1293, C3 = 1400, C4 = 1293, C5 = 1508, C6 = 1185, C7 = 1400, C8 = 1293;
      const PAIR = 2693, HALF = 5386, FULL = 10772;
      const P2_R = 5925, P2_L = 4847;

      const makeBoxRows2Col = (fa, en, rawText, heightPt, colR, colL, bold) => {
        const hDxa = Math.max(260, Math.round(heightPt * 18));
        return \`
          <w:tr>
            \${wCell(wPara(wRun(fa + ':', { bold: true, szHalfPt: 19, isEn: false }), { rtl: true }), { widthDxa: colR, borders: { top: true, right: true } })}
            \${wCell(wPara(wRun(en + ':', { bold: true, szHalfPt: 18, isEn: true }), { rtl: false }), { widthDxa: colL, borders: { top: true, left: true } })}
          </w:tr>
          <w:tr>
            <w:trPr><w:trHeight w:val="\${hDxa}" w:hRule="atLeast"/></w:trPr>
            \${wCell(makeNaturalWordParas(rawText, bold), { widthDxa: colR + colL, gridSpan: 2, borders: { bottom: true, left: true, right: true } })}
          </w:tr>
        \`;
      };

      // الگوی ۲ سطری تمام‌عرض برای ردیف ارگان‌ها در DOCX جهت حذف کامل پرش متن
      const makeOrganRow2Col = (fa, en, rawVal, colR, colL, withHorizontalBorders) => {
        const cleanVal = (rawVal || '').trim();
        const isEn = isLatinText(cleanVal);
        return \`
          <w:tr>
            \${wCell(wPara(wRun(fa + ':', { bold: true, szHalfPt: 18, isEn: false }), { rtl: true, beforeDxa: 4, afterDxa: 2, lineDxa: 190 }), { widthDxa: colR, borders: { top: withHorizontalBorders, right: true }, vAlign: 'center' })}
            \${wCell(wPara(wRun(en + ':', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false, beforeDxa: 4, afterDxa: 2, lineDxa: 190 }), { widthDxa: colL, borders: { top: withHorizontalBorders, left: true }, vAlign: 'center' })}
          </w:tr>
          <w:tr>
            \${wCell(wPara(wRun(cleanVal || ' ', { bold: false, szHalfPt: 18, isEn }), { rtl: !isEn, beforeDxa: 2, afterDxa: 6, lineDxa: 200 }), { widthDxa: colR + colL, gridSpan: 2, borders: { bottom: withHorizontalBorders, left: true, right: true }, vAlign: 'top' })}
          </w:tr>
        \`;
      };

      const p1BoxesXml = p1FinalSections
        .map(s => makeBoxRows2Col(s.fa, s.en, s.rawText, s.heightPt, HALF, HALF, false))
        .join('');

      let p1ExamXml = '';
      if (p1ExamOrgans.length > 0) {
        p1ExamXml = \`
          <w:tr>
            \${wCell(wPara(wRun('معاینات بدنی و بررسی های بالینی:', { bold: true, szHalfPt: 19, isEn: false }), { rtl: true }), { widthDxa: HALF, borders: { top: true, right: true } })}
            \${wCell(wPara(wRun('Physical & Clinical Examination:', { bold: true, szHalfPt: 18, isEn: true }), { rtl: false }), { widthDxa: HALF, borders: { top: true, left: true } })}
          </w:tr>
          \${p1ExamOrgans.map(o => makeOrganRow2Col(o.fa, o.en, o.v, HALF, HALF, false)).join('')}
          <w:tr>
            \${wCell(wPara(wRun('لطفا پشت صفحه را تکمیل کنید', { bold: true, szHalfPt: 19, isEn: false }), { rtl: true }), { widthDxa: HALF, borders: { bottom: true, right: true } })}
            \${wCell(wPara(wRun('Please Complete the Reverse side', { bold: true, szHalfPt: 17, isEn: true }), { rtl: false }), { widthDxa: HALF, borders: { bottom: true, left: true } })}
          </w:tr>
        \`;
      } else {
        p1ExamXml = \`
          <w:tr>
            \${wCell(wPara(wRun('لطفا پشت صفحه را تکمیل کنید', { bold: true, szHalfPt: 19, isEn: false }), { rtl: true }), { widthDxa: HALF, borders: { top: true, bottom: true, right: true } })}
            \${wCell(wPara(wRun('Please Complete the Reverse side', { bold: true, szHalfPt: 17, isEn: true }), { rtl: false }), { widthDxa: HALF, borders: { top: true, bottom: true, left: true } })}
          </w:tr>
        \`;
      }

      const makeFooterXml = (pageNum, totalPages) => {
        const d = (gv('adm_date') || '').trim() || '1403/08/15';
        return \`
          <w:tbl>
            <w:tblPr><w:tblW w:w="\${FULL}" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr>
            <w:tblGrid><w:gridCol w:w="2154"/><w:gridCol w:w="3770"/><w:gridCol w:w="2694"/><w:gridCol w:w="2154"/></w:tblGrid>
            <w:tr>
              \${wCell(wPara(wRun('طرح استاندارد و بهینه نمودن سیستم مدارک پزشکی ۱۰۰/۲۰  -  برگ شرح حال و معاینه بدنی', { bold: true, szHalfPt: 17, isEn: false }), { rtl: true }), { widthDxa: FULL, gridSpan: 4, borders: { bottom: true, size: 10 } })}
            </w:tr>
            <w:tr>
              \${wCell(wPara(wRun('User :  ', { bold: true, szHalfPt: 16, isEn: true }) + wRun(user, { szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: 2154, borders: {} })}
              \${wCell(wPara(wRun('Date :  ', { bold: true, szHalfPt: 16, isEn: true }) + wRun(d + ' 10:23:26 AM', { szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: 3770, borders: {} })}
              \${wCell(wPara(wRun('Report no :  ', { bold: true, szHalfPt: 16, isEn: true }) + wRun('R173', { szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: 2694, borders: {} })}
              \${wCell(wPara(wRun(\`Page :  \${pageNum} of \${totalPages}\`, { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: 2154, borders: {} })}
            </w:tr>
          </w:tbl>
        \`;
      };

      const p2OverflowBoxesXml = p2FinalSections
        .map(s => makeBoxRows2Col(s.fa, s.en, s.rawText, s.heightPt, P2_R, P2_L, false))
        .join('');
      const page2OrgansList = [
        ...movedOrgans,
        { fa: 'سر و گردن', en: 'Head & Neck', v: gv('pe_head_neck') },
        { fa: 'چشم', en: 'Eyes', v: gv('pe_eyes') },
        { fa: 'قلب و عروق', en: 'Cardiovascular', v: gv('pe_cvs') },
        { fa: 'ریه', en: 'Lungs', v: gv('pe_chest') },
        { fa: 'شکم', en: 'Abdomen', v: gv('pe_abd') },
        { fa: 'اندام‌ها', en: 'Extremities', v: gv('pe_ext') },
        { fa: 'سیستم عصبی', en: 'Neurological', v: gv('pe_neuro') }
      ];
      const p2OrgansXml = page2OrgansList
        .map(o => makeOrganRow2Col(o.fa, o.en, o.v, P2_R, P2_L, true))
        .join('');

      const overflowPt = p2FinalSections.reduce((s, x) => s + 14 + x.heightPt, 0) + (movedOrgans.length * 14);
      const sumLines = splitTextIntoVisualLines(gv('clinical_summary'), 85);
      const dxLines  = splitTextIntoVisualLines(gv('primary_dx'), 85);
      const sigLines = splitTextIntoVisualLines(gv('examining_physician'), 85);

      const sumH = Math.max(sumLines.length * LINE_PT, Math.max(35, Math.round(110 - overflowPt * 0.5)));
      const dxH  = Math.max(dxLines.length * LINE_PT,  Math.max(24, Math.round(55  - overflowPt * 0.25)));
      const sigH = Math.max(sigLines.length * LINE_PT, Math.max(24, Math.round(48  - overflowPt * 0.20)));

      // تفکیک جداول صفحه ۱ به ۳ بخش مستقل (هدر، جدول ۸ ستونی مشخصات بیمار، جدول ۲ ستونی بالینی)
      const documentXml = \`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    \${wPara(wRun('بیمارستان شهدای خلیج فارس بوشهر', { bold: true, szHalfPt: 24, isEn: false }), { rtl: true, align: 'center', lineDxa: 220, beforeDxa: 0, afterDxa: 4 })}
    \${wPara(wRun('Bushehr Khalij Fars Hospital', { bold: true, szHalfPt: 18, isEn: true }), { rtl: false, align: 'center', lineDxa: 200, beforeDxa: 0, afterDxa: 4 })}
    \${wPara(wRun('برگ شرح حال و معاینه بدنی', { bold: true, szHalfPt: 22, isEn: false }), { rtl: true, align: 'center', lineDxa: 220, beforeDxa: 0, afterDxa: 4 })}
    \${wPara(wRun('Medical History & Physical Examination Sheet', { bold: true, szHalfPt: 17, isEn: true }), { rtl: false, align: 'center', lineDxa: 200, beforeDxa: 0, afterDxa: 20 })}

    <w:tbl>
      <w:tblPr><w:bidiVisual/><w:tblW w:w="\${FULL}" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="\${C1}"/><w:gridCol w:w="\${C2}"/><w:gridCol w:w="\${C3}"/><w:gridCol w:w="\${C4}"/>
        <w:gridCol w:w="\${C5}"/><w:gridCol w:w="\${C6}"/><w:gridCol w:w="\${C7}"/><w:gridCol w:w="\${C8}"/>
      </w:tblGrid>
      <w:tr>
        \${wCell(wPara(wRun('شماره پرونده:', { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C1, borders: { top: true, right: true } })}
        \${wCell(wPara(wRun('Unit No:', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: C2, borders: { top: true, left: true } })}
        \${wCell(wPara(wRun(' ', { szHalfPt: 16 })), { widthDxa: FULL - PAIR, gridSpan: 6, borders: {} })}
      </w:tr>
      <w:tr>
        \${wCell(wPara(wRun(recNo || ' ', { bold: true, szHalfPt: 20, isEn: false }), { rtl: true, align: 'center' }), { widthDxa: PAIR, gridSpan: 2, borders: { bottom: true, left: true, right: true }, vAlign: 'center' })}
        \${wCell(wPara(wRun(' ', { szHalfPt: 16 })), { widthDxa: FULL - PAIR, gridSpan: 6, borders: { bottom: true } })}
      </w:tr>
      <w:tr>
        \${wCell(wPara(wRun('نام خانوادگی:', { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C1, borders: { top: true, right: true } })}
        \${wCell(wPara(wRun('Last Name:', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: C2, borders: { top: true, left: true } })}
        \${wCell(wPara(wRun('نام:', { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C3, borders: { top: true, right: true } })}
        \${wCell(wPara(wRun('Name:', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: C4, borders: { top: true, left: true } })}
        \${wCell(wPara(wRun('بخش:  ' + ward, { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C5, borders: { top: true, right: true } })}
        \${wCell(wPara(wRun('Ward:', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: C6, borders: { top: true, left: true } })}
        \${wCell(wPara(wRun('پزشک معالج:', { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C7, borders: { top: true, right: true } })}
        \${wCell(wPara(wRun('Physician:', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: C8, borders: { top: true, left: true } })}
      </w:tr>
      <w:tr>
        \${wCell(wPara(wRun(pFamily || ' ', { bold: true, szHalfPt: 20, isEn: false }), { rtl: true, align: 'center' }), { widthDxa: PAIR, gridSpan: 2, borders: { bottom: true, left: true, right: true }, vAlign: 'center' })}
        \${wCell(wPara(wRun(pName || ' ', { bold: true, szHalfPt: 20, isEn: false }), { rtl: true, align: 'center' }), { widthDxa: PAIR, gridSpan: 2, borders: { bottom: true, left: true, right: true }, vAlign: 'center' })}
        \${wCell(wPara(wRun('اتاق:  ' + room, { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C5, borders: { right: true }, vAlign: 'center' })}
        \${wCell(wPara(wRun('Room:', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: C6, borders: { left: true }, vAlign: 'center' })}
        \${wCell(wPara(wRun(doc || ' ', { bold: true, szHalfPt: 20, isEn: false }), { rtl: true, align: 'center' }), { widthDxa: PAIR, gridSpan: 2, borders: { bottom: true, left: true, right: true }, vAlign: 'center' })}
      </w:tr>
      <w:tr>
        \${wCell(wPara(wRun('نام پدر:', { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C1, borders: { top: true, right: true } })}
        \${wCell(wPara(wRun('Father Name:', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: C2, borders: { top: true, left: true } })}
        \${wCell(wPara(wRun('تاریخ تولد:', { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C3, borders: { top: true, right: true } })}
        \${wCell(wPara(wRun('Birth Date:', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: C4, borders: { top: true, left: true } })}
        \${wCell(wPara(wRun('تخت:  ' + bed, { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C5, borders: { right: true }, vAlign: 'center' })}
        \${wCell(wPara(wRun('Bed:', { bold: true, szHalfPt: 16, isEn: true }), { rtl: false }), { widthDxa: C6, borders: { left: true }, vAlign: 'center' })}
        \${wCell(wPara(wRun('تاریخ پذیرش:', { bold: true, szHalfPt: 18, isEn: false }), { rtl: true }), { widthDxa: C7, borders: { top: true, right: true } })}
        \${wCell(wPara(wRun('Date of Admission:', { bold: true, szHalfPt: 15, isEn: true }), { rtl: false }), { widthDxa: C8, borders: { top: true, left: true } })}
      </w:tr>
      <w:tr>
        \${wCell(wPara(wRun(pFather || ' ', { bold: true, szHalfPt: 20, isEn: false }), { rtl: true, align: 'center' }), { widthDxa: PAIR, gridSpan: 2, borders: { bottom: true, left: true, right: true }, vAlign: 'center' })}
        \${wCell(wPara(wRun(bDate || ' ', { bold: true, szHalfPt: 20, isEn: false }), { rtl: true, align: 'center' }), { widthDxa: PAIR, gridSpan: 2, borders: { bottom: true, left: true, right: true }, vAlign: 'center' })}
        \${wCell(wPara(wRun(' ', { szHalfPt: 18 })), { widthDxa: PAIR, gridSpan: 2, borders: { bottom: true, left: true, right: true } })}
        \${wCell(wPara(wRun((admTime ? admTime + '   ' : '') + (admDate || ' '), { bold: true, szHalfPt: 20, isEn: false }), { rtl: true, align: 'center' }), { widthDxa: PAIR, gridSpan: 2, borders: { bottom: true, left: true, right: true }, vAlign: 'center' })}
      </w:tr>
    </w:tbl>

    <w:p><w:pPr><w:spacing w:before="0" w:after="40" w:line="40" w:lineRule="exact"/></w:pPr></w:p>

    <w:tbl>
      <w:tblPr><w:bidiVisual/><w:tblW w:w="\${FULL}" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr>
      <w:tblGrid><w:gridCol w:w="\${HALF}"/><w:gridCol w:w="\${HALF}"/></w:tblGrid>
      \${p1BoxesXml}
      \${p1ExamXml}
    </w:tbl>

    \${makeFooterXml(1, 2)}

    <w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>

    \${wPara(wRun('برگ شرح حال و معاینه بدنی', { bold: true, szHalfPt: 22, isEn: false }), { rtl: true, align: 'center', lineDxa: 220, beforeDxa: 0, afterDxa: 4 })}
    \${wPara(wRun('Medical History & Physical Examination Sheet', { bold: true, szHalfPt: 17, isEn: true }), { rtl: false, align: 'center', lineDxa: 200, beforeDxa: 0, afterDxa: 20 })}

    <w:tbl>
      <w:tblPr><w:bidiVisual/><w:tblW w:w="\${FULL}" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr>
      <w:tblGrid><w:gridCol w:w="\${P2_R}"/><w:gridCol w:w="\${P2_L}"/></w:tblGrid>
      \${p2OverflowBoxesXml}
      <w:tr>
        \${wCell(wPara(wRun('معاینات بدنی و بررسیهای اولیه بالینی (ادامه):', { bold: true, szHalfPt: 19, isEn: false }), { rtl: true }), { widthDxa: P2_R, borders: { top: true, bottom: true, right: true } })}
        \${wCell(wPara(wRun('Physical Examination & Clinical Investigation (Continued):', { bold: true, szHalfPt: 18, isEn: true }), { rtl: false }), { widthDxa: P2_L, borders: { top: true, bottom: true, left: true } })}
      </w:tr>
      \${p2OrgansXml}
      <w:tr>
        \${wCell(wPara(wRun('در صورت وجود بیماری یا نقص در مقابل آن توضیح داده شود و در غیر این صورت با علامت × مشخص گردد.', { bold: true, szHalfPt: 18, isEn: false, color: '334155' }), { rtl: true }), { widthDxa: FULL, gridSpan: 2, borders: { top: true, bottom: true, left: true, right: true }, shading: 'F8FAFC' })}
      </w:tr>
      \${makeBoxRows2Col('خلاصه', 'SUMMARY', gv('clinical_summary'), sumH, P2_R, P2_L, false)}
      \${makeBoxRows2Col('تشخیص اولیه', 'Primary DX', gv('primary_dx'), dxH, P2_R, P2_L, true)}
      \${makeBoxRows2Col('امضاء پزشک معاینه کننده', 'Signature of Examining physician', gv('examining_physician'), sigH, P2_R, P2_L, false)}
    </w:tbl>

    \${makeFooterXml(2, 2)}

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/>
      <w:pgMar w:top="397" w:right="567" w:bottom="397" w:left="567" w:header="284" w:footer="284" w:gutter="0"/>
      <w:bidi/>
    </w:sectPr>
  </w:body>
</w:document>\`;

      const contentTypesXml = \`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>\`;

      const rootRelsXml = \`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>\`;

      const docRelsXml = \`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>\`;

      const stylesXml = \`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="B Nazanin" w:eastAsia="B Nazanin"/>
        <w:sz w:val="20"/><w:szCs w:val="20"/>
        <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="fa-IR"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr><w:spacing w:before="0" w:after="0" w:line="230" w:lineRule="auto"/></w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
</w:styles>\`;

      const settingsXml = \`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:view w:val="print"/><w:zoom w:percent="100"/>
  <w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat>
</w:settings>\`;

      return createZipArchive([
        { name: '[Content_Types].xml', content: contentTypesXml },
        { name: '_rels/.rels', content: rootRelsXml },
        { name: 'word/_rels/document.xml.rels', content: docRelsXml },
        { name: 'word/styles.xml', content: stylesXml },
        { name: 'word/settings.xml', content: settingsXml },
        { name: 'word/document.xml', content: documentXml }
      ]);
    }

    // ============================================================================
    // ۵. کشینگ Blob، پشتیبانی اختصاصی iOS و اشتراک‌گذاری/دانلود غیرمسدودکننده
    // ============================================================================
    let lastDocxBlob = null;
    let lastFormHash = '';

    function getFormHash() {
      return allFieldIds.map(id => gv(id)).join('|');
    }

    function generateWordDocBlob() {
      const hash = getFormHash();
      if (lastDocxBlob && hash === lastFormHash) {
        return lastDocxBlob;
      }
      lastDocxBlob = new Blob([buildRealDocxBytes()], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      lastFormHash = hash;
      return lastDocxBlob;
    }

    function isIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    function sanitizeFileName(rawName) {
      const cleaned = sanitizeControlChars(rawName || '')
        .trim()
        .replace(/[\\\\/:*?"<>|]+/g, '_')
        .replace(/\\s+/g, '_');
      return cleaned || 'بیمار';
    }

    function forceDownload(blob, fileName) {
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, fileName);
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
      // نگهداری URL به مدت ۱۵ ثانیه برای تکمیل دانلود در تمام مرورگرهای موبایل (iOS/Android) و دسکتاپ
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 15000);
    }

    function validateBeforeExport() {
      const fam = (gv('patient_family') || '').trim();
      const nam = (gv('patient_name') || '').trim();
      if (!fam && !nam) {
        return confirm('نام و نام خانوادگی بیمار خالی است. آیا مایلید فایل بدون نام بیمار ساخته شود؟');
      }
      return true;
    }

    function exportToWordDoc() {
      if (!validateBeforeExport()) return;

      const st = document.getElementById('saveStatus');
      if (st) st.textContent = '📥 در حال ساخت فایل .docx...';

      try {
        // ساخت سنکرون (<2ms با جدول CRC32 و کش) جهت حفظ توکن User Gesture در iOS Safari و Android
        const blob = generateWordDocBlob();
        const pName = sanitizeFileName(gv('patient_family') || gv('patient_name'));
        const fileName = \`شرح_حال_\${pName}_R173.docx\`;

        if (isIOS() && typeof navigator.canShare === 'function') {
          const file = new File([blob], fileName, {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
          if (navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'برگ شرح حال', text: 'فایل Word بیمارستان خلیج فارس' })
              .then(() => { if (st) st.textContent = '✓ آماده'; })
              .catch(err => {
                if (err && err.name !== 'AbortError') {
                  forceDownload(blob, fileName);
                  if (st) st.textContent = '✓ فایل دانلود شد';
                } else if (st) {
                  st.textContent = '✓ آماده';
                }
              });
            return;
          }
        }

        forceDownload(blob, fileName);
        if (st) {
          st.textContent = '✓ فایل دانلود شد';
          setTimeout(() => { st.textContent = '✓ آماده'; }, 2500);
        }
      } catch (e) {
        console.error('Error building .docx:', e);
        if (st) st.textContent = '⚠ خطا در ساخت فایل';
      }
    }
    window.exportToWordDoc = exportToWordDoc;

    function openMobileModal() {
      const modal = document.getElementById('mobileDlModal');
      if (modal) modal.style.display = 'flex';
    }

    function closeMobileModal() {
      const modal = document.getElementById('mobileDlModal');
      if (modal) modal.style.display = 'none';
    }

    function shareWordOnMobile() {
      if (!validateBeforeExport()) return;

      const st = document.getElementById('saveStatus');
      if (st) st.textContent = '📥 در حال آماده‌سازی فایل .docx...';

      try {
        const blob = generateWordDocBlob();
        const pName = sanitizeFileName(gv('patient_family') || gv('patient_name'));
        const fileName = \`شرح_حال_\${pName}_R173.docx\`;

        if (typeof navigator.canShare === 'function') {
          const file = new File([blob], fileName, {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
          if (navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: 'برگ شرح حال و معاینه بدنی (.docx)',
              text: 'فایل استاندارد Word (.docx) برگه شرح حال بیمارستان شهدای خلیج فارس بوشهر'
            })
              .then(() => { if (st) st.textContent = '✓ آماده'; })
              .catch(err => {
                if (err && err.name !== 'AbortError') {
                  forceDownload(blob, fileName);
                  if (st) st.textContent = '✓ فایل دانلود شد';
                } else if (st) {
                  st.textContent = '✓ آماده';
                }
              });
            return;
          }
        }

        forceDownload(blob, fileName);
        if (st) st.textContent = '✓ فایل دانلود شد';
      } catch (e) {
        console.error('Error sharing .docx:', e);
        if (st) st.textContent = '⚠ خطا در ساخت فایل';
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadFromStorage();
      applySpecialtyTemplate();
      updatePreview();

      allFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', onFormInput);
          el.addEventListener('change', onFormChangeImmediate);
        }
      });
    });
`;

const finalHtml = htmlBeforeScript + '<script>\n' + optimizedScript + '\n  </script>\n</body>\n</html>';

fs.writeFileSync('public/khalij_fars_hospital_sheet_fixed.html', finalHtml);
const tsModuleContent = `// Auto-generated standalone HTML content - synchronized with public/khalij_fars_hospital_sheet_fixed.html\nexport const STANDALONE_HTML = ${JSON.stringify(finalHtml)};\nexport const STANDALONE_HTML_CONTENT = STANDALONE_HTML;\n`;
fs.writeFileSync('src/utils/standaloneHtmlContent.ts', tsModuleContent);
console.log('Successfully built and synchronized public/khalij_fars_hospital_sheet_fixed.html & src/utils/standaloneHtmlContent.ts! Size:', finalHtml.length);

