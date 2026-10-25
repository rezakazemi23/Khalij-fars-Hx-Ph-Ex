/**
 * Core clinical pagination and document builder for
 * بیمارستان شهدای خلیج فارس بوشهر - برگ شرح حال و معاینه بدنی (Form R173)
 */

export interface HospitalFormData {
  rec_no: string;
  patient_name: string;
  patient_family: string;
  patient_father: string;
  birth_date: string;
  ward_name: string;
  room_no: string;
  bed_no: string;
  attending_physician: string;
  adm_date: string;
  adm_time: string;
  user_code: string;

  chief_complaint: string;
  hpi: string;
  pmh: string;
  drugs_addiction: string;
  allergy: string;
  family_history: string;

  pe_ga: string;
  vs_bp: string;
  vs_pr: string;
  vs_rr: string;
  vs_t: string;
  vs_spo2: string;
  pe_vitals_note: string;
  pe_skin: string;
  pe_skull: string;
  pe_ear: string;

  pe_head_neck: string;
  pe_eyes: string;
  pe_cvs: string;
  pe_chest: string;
  pe_abd: string;
  pe_ext: string;
  pe_neuro: string;

  clinical_summary: string;
  primary_dx: string;
  examining_physician: string;
  specialtySelect: string;
}

export const initialHospitalFormData: HospitalFormData = {
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
  pe_neuro: 'هوشیار و کاملاً آگاه به زمان، مکان و اشخاص (GCS: 15/15)، اعصاب کرانیال ۲ تا ۱۲ سالم، رفلکس‌های تاندونی عمقی (DTR) متقارن، فاقد نقص فوکال عصبی.',

  clinical_summary: 'آقای ۴۵ ساله با درد تیپیک ایسکمیک قلبی و سابقه فامیلی CAD مثبت، تحت نظر قلبی و انجام EKG سریال و بررسی آنزیم‌های قلبی (Troponin). علائم حیاتی بدو ورود پایدار است.',
  primary_dx: 'Acute Coronary Syndrome (ACS) - R/O Unstable Angina',
  examining_physician: 'دکتر احسان حسینی - رزیدنت داخلی',
  specialtySelect: 'internal'
};

export function toFaDigits(str: string): string {
  return (str || '').trim().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
}

export function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br>');
}

export function isLatinText(str: string): boolean {
  if (!str) return false;
  const clean = str.replace(/<br>/g, '').trim();
  if (!clean || clean === '×') return false;
  const latinCount = (clean.match(/[A-Za-z]/g) || []).length;
  const persianCount = (clean.match(/[\u0600-\u06FF]/g) || []).length;
  return latinCount > persianCount;
}

export function splitTextIntoVisualLines(rawText: string, charsPerLine = 85): string[] {
  if (!rawText) return [''];
  const trimmedRight = rawText.replace(/\s+$/, '');
  if (!trimmedRight) return [''];
  const rawLines = trimmedRight.split(/\r?\n/);
  const visualLines: string[] = [];
  rawLines.forEach(line => {
    if (line.length <= charsPerLine) {
      visualLines.push(line);
    } else {
      let rem = line;
      while (rem.length > charsPerLine) {
        let cut = rem.lastIndexOf(' ', charsPerLine);
        if (cut <= 20) cut = charsPerLine;
        visualLines.push(rem.slice(0, cut));
        rem = rem.slice(cut).trimStart();
      }
      if (rem.length > 0) visualLines.push(rem);
    }
  });
  return visualLines.length > 0 ? visualLines : [''];
}

export function formatLinesArrayParagraph(linesArr: string[], bold = false): string {
  const joined = (linesArr || []).join('\n').trim();
  if (!joined) {
    return `<p dir="rtl" style="margin:0;line-height:1.2;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:10pt;mso-bidi-font-size:10pt;">&nbsp;</p>`;
  }
  const v = esc(linesArr.join('\n'));
  const isEn = isLatinText(joined);
  const dir = isEn ? 'ltr' : 'rtl';
  const align = isEn ? 'left' : 'right';
  const font = isEn ? "'Times New Roman',Arial,sans-serif" : "'Vazirmatn','Vazirmatn','B Nazanin',Tahoma,sans-serif";
  const weight = bold ? 'font-weight:bold;' : '';
  return `<p dir="${dir}" align="${align}" style="margin:0;line-height:1.2;text-align:${align};unicode-bidi:plaintext;font-family:${font};font-size:10pt;mso-bidi-font-size:10pt;${weight}">${v}</p>`;
}

export function getCombinedVitalSigns(data: HospitalFormData): string {
  const parts: string[] = [];
  if (data.vs_bp.trim()) parts.push(`BP: ${data.vs_bp.trim()}`);
  if (data.vs_pr.trim()) parts.push(`PR: ${data.vs_pr.trim()}`);
  if (data.vs_rr.trim()) parts.push(`RR: ${data.vs_rr.trim()}`);
  if (data.vs_t.trim()) parts.push(`T: ${data.vs_t.trim()}`);
  if (data.vs_spo2.trim()) parts.push(`SpO2: ${data.vs_spo2.trim()}`);
  const vitalsStr = parts.join(' , ');
  const note = data.pe_vitals_note.trim();
  if (vitalsStr && note) return `${vitalsStr} (${note})`;
  return vitalsStr || note || '';
}

// Styling constants for crisp Word and Browser A4 rendering
export const STYLES = {
  topLblR: "border-top:1pt solid #000;border-right:1pt solid #000;border-bottom:none;border-left:none;mso-border-top-alt:solid #000 1pt;mso-border-right-alt:solid #000 1pt;mso-border-bottom-alt:none;mso-border-left-alt:none;padding:1.5pt 4pt 0.5pt 2pt;text-align:right;vertical-align:top;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:9.5pt;mso-bidi-font-size:9.5pt;font-weight:bold;line-height:1.1;",
  topLblL: "border-top:1pt solid #000;border-left:1pt solid #000;border-bottom:none;border-right:none;mso-border-top-alt:solid #000 1pt;mso-border-left-alt:solid #000 1pt;mso-border-bottom-alt:none;mso-border-right-alt:none;padding:1.5pt 2pt 0.5pt 4pt;text-align:left;vertical-align:top;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;mso-bidi-font-size:8pt;font-weight:bold;line-height:1.1;white-space:nowrap;",
  botVal:  "border-top:none;border-bottom:1pt solid #000;border-right:1pt solid #000;border-left:1pt solid #000;mso-border-top-alt:none;mso-border-bottom-alt:solid #000 1pt;mso-border-right-alt:solid #000 1pt;mso-border-left-alt:solid #000 1pt;padding:0.5pt 4pt 1.5pt 4pt;text-align:center;vertical-align:middle;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:10pt;mso-bidi-font-size:10pt;font-weight:bold;line-height:1.15;",
  headR:   "border-top:1pt solid #000;border-right:1pt solid #000;border-bottom:none;border-left:none;mso-border-top-alt:solid #000 1pt;mso-border-right-alt:solid #000 1pt;mso-border-bottom-alt:none;mso-border-left-alt:none;padding:1.5pt 6pt 0.5pt 6pt;text-align:right;vertical-align:top;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:10pt;mso-bidi-font-size:10pt;font-weight:bold;line-height:1.15;",
  headL:   "border-top:1pt solid #000;border-left:1pt solid #000;border-bottom:none;border-right:none;mso-border-top-alt:solid #000 1pt;mso-border-left-alt:solid #000 1pt;mso-border-bottom-alt:none;mso-border-right-alt:none;padding:1.5pt 6pt 0.5pt 6pt;text-align:left;vertical-align:top;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;mso-bidi-font-size:9pt;font-weight:bold;line-height:1.15;",
  body:    "border-top:none;border-bottom:1pt solid #000;border-right:1pt solid #000;border-left:1pt solid #000;mso-border-top-alt:none;mso-border-bottom-alt:solid #000 1pt;mso-border-right-alt:solid #000 1pt;mso-border-left-alt:solid #000 1pt;padding:1pt 8pt 2pt 8pt;vertical-align:top;line-height:1.15;",
  noLineR: "border-right:1pt solid #000;border-left:none;border-top:none;border-bottom:none;mso-border-right-alt:solid #000 1pt;mso-border-left-alt:none;mso-border-top-alt:none;mso-border-bottom-alt:none;padding:1.5pt 6pt;text-align:right;vertical-align:middle;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:9.5pt;mso-bidi-font-size:9.5pt;line-height:1.15;",
  noLineL: "border-left:1pt solid #000;border-right:none;border-top:none;border-bottom:none;mso-border-left-alt:solid #000 1pt;mso-border-right-alt:none;mso-border-top-alt:none;mso-border-bottom-alt:none;padding:1.5pt 6pt;text-align:left;vertical-align:middle;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;mso-bidi-font-size:8.5pt;line-height:1.15;"
};

export function makeClinicalBoxFromLines(
  faTitle: string,
  enTitle: string,
  linesArr: string[],
  heightPt: number,
  colspanPerSide: number,
  isBold = false
): string {
  const cSide = colspanPerSide > 1 ? `colspan="${colspanPerSide}"` : '';
  const cFull = `colspan="${colspanPerSide * 2}"`;
  const wR = colspanPerSide === 4 ? '50%' : '55%';
  const wL = colspanPerSide === 4 ? '50%' : '45%';
  return `
    <tr>
      <td ${cSide} width="${wR}" dir="rtl" style="${STYLES.headR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:10pt;mso-bidi-font-size:10pt;">${faTitle}:&rlm;</p></td>
      <td ${cSide} width="${wL}" dir="ltr" style="${STYLES.headL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">${enTitle}:</p></td>
    </tr>
    <tr style="height:${heightPt}pt;">
      <td ${cFull} style="${STYLES.body}height:${heightPt}pt;">${formatLinesArrayParagraph(linesArr, isBold)}</td>
    </tr>
  `;
}

export function makeBilingualOrganRow(
  faLabel: string,
  enLabel: string,
  rawVal: string,
  colspanEach: number,
  withHorizontalBorders = false
): string {
  const cleanVal = (rawVal || '').trim();
  const isEn = isLatinText(cleanVal);
  const faVal = (!isEn && cleanVal) ? esc(cleanVal) : '';
  const enVal = (isEn && cleanVal) ? esc(cleanVal) : '';
  const bTopBot = withHorizontalBorders
    ? "border-top:1pt solid #000;border-bottom:1pt solid #000;mso-border-top-alt:solid #000 1pt;mso-border-bottom-alt:solid #000 1pt;"
    : "";
  const cSpanAttr = colspanEach > 1 ? `colspan="${colspanEach}"` : '';
  const wR = colspanEach === 4 ? '50%' : '55%';
  const wL = colspanEach === 4 ? '50%' : '45%';
  return `
    <tr>
      <td ${cSpanAttr} width="${wR}" dir="rtl" style="${STYLES.noLineR}${bTopBot}">
        <p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:9.5pt;mso-bidi-font-size:9.5pt;"><span style="font-weight:bold;">${faLabel}:&rlm;</span> &nbsp;${faVal}</p>
      </td>
      <td ${cSpanAttr} width="${wL}" dir="ltr" style="${STYLES.noLineL}${bTopBot}">
        <p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;"><span style="font-weight:bold;">${enLabel}:</span> &nbsp;${enVal}</p>
      </td>
    </tr>
  `;
}

export function makeStandardFooter(admDate: string, user: string, pageNum = 1, totalPages = 1): string {
  const d = (admDate || '').trim() || '1405/07/29';
  const u = (user || '').trim() || 'W1361';
  return `
    <table dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;mso-table-dir:bidi;margin-top:2pt;border:none;page-break-inside:avoid;">
      <tr style="page-break-inside:avoid;">
        <td colspan="4" dir="rtl" align="right" style="border:none;border-bottom:1.5pt solid #000;mso-border-bottom-alt:solid #000 1.5pt;padding-bottom:1pt;text-align:right;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:8.5pt;mso-bidi-font-size:8.5pt;line-height:1.1;">
          <p dir="rtl" style="margin:0;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:8.5pt;mso-bidi-font-size:8.5pt;font-weight:bold;">طرح استاندارد و بهینه نمودن سیستم مدارک پزشکی ۱۰۰/۲۰ &nbsp;-&nbsp; برگ شرح حال و معاینه بدنی</p>
        </td>
      </tr>
      <tr style="page-break-inside:avoid;">
        <td width="20%" dir="ltr" align="left" style="border:none;padding-top:1pt;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;"><b>User :</b> &nbsp;${u}</td>
        <td width="35%" dir="ltr" align="left" style="border:none;padding-top:1pt;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;"><b>Date :</b> &nbsp;${d} 10:23:26 AM</td>
        <td width="25%" dir="ltr" align="left" style="border:none;padding-top:1pt;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;"><b>Report no :</b> &nbsp;R173</td>
        <td width="20%" dir="ltr" align="left" style="border:none;padding-top:1pt;font-family:'Times New Roman',Arial,sans-serif;font-size:8pt;"><b>Page :</b> &nbsp;${pageNum} &nbsp;of &nbsp;${totalPages}</td>
      </tr>
    </table>
  `;
}

export interface ClinicalSection {
  key: string;
  fa: string;
  en: string;
  lines: string[];
  defLines: number;
  minLines: number;
  textLineCount: number;
  displayLines: number;
}

export interface OrganRowDef {
  key: string;
  fa: string;
  en: string;
  v: string;
  cost: number;
}

export interface PaginationResult {
  p1Sections: Array<{ fa: string; en: string; lines: string[]; heightPt: number }>;
  p1Organs: OrganRowDef[];
  p2MovedOrgans: OrganRowDef[];
  p2Sections: Array<{ fa: string; en: string; lines: string[]; heightPt: number }>;
  page1OverflowOccurred: boolean;
  totalPage1Units: number;
  maxPage1Budget: number;
}

/**
 * Robust clinical layout pagination:
 * When Page 1 exceeds capacity, elements are moved to Page 2
 * STRICTLY FROM THE BOTTOM OF PAGE 1 to the next page!
 * Order of movable items (from lowest to highest):
 * 1. Ear (pe_ear)
 * 2. Skull (pe_skull)
 * 3. Skin (pe_skin)
 * 4. Vital Signs
 * 5. General Appearance
 * 6. Family History (family_history)
 * 7. Allergy (allergy)
 * 8. Drugs & Addiction (drugs_addiction)
 * 9. Past Medical History (pmh)
 * 10. Only if all above are on Page 2 and HPI still exceeds Page 1 space,
 *     HPI fills Page 1 to the bottom and its trailing lines spill to Page 2.
 */
export function calculateClinicalPagination(data: HospitalFormData): PaginationResult {
  const LINE_PT = 15.5;
  const MAX_P1_LINE_BUDGET = 21.0;

  const vitalsCombined = getCombinedVitalSigns(data);

  // 1. All clinical sections in canonical top-down order
  const rawSections: ClinicalSection[] = [
    { key: 'cc', fa: 'شکایت اصلی بیمار', en: 'Chief Complaint', lines: splitTextIntoVisualLines(data.chief_complaint, 85), defLines: 1.5, minLines: 1, textLineCount: 1, displayLines: 1.5 },
    { key: 'hpi', fa: 'تاریخچه بیماری فعلی', en: 'History of Present Illness', lines: splitTextIntoVisualLines(data.hpi, 85), defLines: 4.0, minLines: 2, textLineCount: 1, displayLines: 4.0 },
    { key: 'pmh', fa: 'تاریخچه ی بیماریهای قبلی', en: 'Past Diseases History', lines: splitTextIntoVisualLines(data.pmh, 85), defLines: 1.8, minLines: 1, textLineCount: 1, displayLines: 1.8 },
    { key: 'drugs', fa: 'داروهای در حال مصرف و سایر اعتیادات', en: 'Current Drug Therapy & Other Addiction', lines: splitTextIntoVisualLines(data.drugs_addiction, 85), defLines: 1.8, minLines: 1, textLineCount: 1, displayLines: 1.8 },
    { key: 'allergy', fa: 'حساسیت به', en: 'Allergy to', lines: splitTextIntoVisualLines(data.allergy, 85), defLines: 1.2, minLines: 1, textLineCount: 1, displayLines: 1.2 },
    { key: 'fh', fa: 'سوابق فامیلی', en: 'Family History', lines: splitTextIntoVisualLines(data.family_history, 85), defLines: 1.2, minLines: 1, textLineCount: 1, displayLines: 1.2 }
  ];

  rawSections.forEach(s => {
    s.textLineCount = s.lines.length;
    s.displayLines = Math.max(s.defLines, s.textLineCount);
  });

  // 2. Organs on Page 1 in top-down order (Header + GA + Vitals + Skin + Skull + Ear)
  const p1ExamOrgans: OrganRowDef[] = [
    { key: 'ga', fa: 'وضعیت ظاهری عمومی', en: 'General Appearance', v: data.pe_ga.trim(), cost: 1.1 },
    { key: 'vitals', fa: 'علائم حیاتی', en: 'Vital Signs', v: vitalsCombined, cost: 1.1 },
    { key: 'skin', fa: 'پوست', en: 'Skin', v: data.pe_skin.trim(), cost: 1.1 },
    { key: 'skull', fa: 'جمجمه', en: 'Skull', v: data.pe_skull.trim(), cost: 1.1 },
    { key: 'ear', fa: 'گوش', en: 'Ear', v: data.pe_ear.trim(), cost: 1.1 }
  ];

  const getExamBlockCost = (organs: OrganRowDef[]) => {
    if (organs.length === 0) return 0.8; // just the prompt line
    return 1.1 + organs.reduce((acc, o) => acc + o.cost, 0); // header + organs
  };

  const getP1TotalUnits = (secs: ClinicalSection[], organs: OrganRowDef[]) => {
    return secs.reduce((acc, s) => acc + s.displayLines, 0) + getExamBlockCost(organs);
  };

  // Phase 1: If tight on space, compress padding down towards minimum lines
  if (getP1TotalUnits(rawSections, p1ExamOrgans) > MAX_P1_LINE_BUDGET) {
    rawSections.forEach(s => {
      s.displayLines = Math.max(s.minLines, s.textLineCount);
    });
  }

  const movedOrgans: OrganRowDef[] = [];
  const movedSectionsToP2: ClinicalSection[] = [];

  // Phase 2: Move items FROM THE BOTTOM OF PAGE 1 to Page 2
  // Step 2a: Move bottom organs one by one (Ear -> Skull -> Skin -> Vitals -> GA)
  while (p1ExamOrgans.length > 0 && getP1TotalUnits(rawSections, p1ExamOrgans) > MAX_P1_LINE_BUDGET) {
    const popped = p1ExamOrgans.pop()!;
    movedOrgans.unshift(popped);
  }

  // Step 2b: If still exceeding space and all PE organs moved, move bottom clinical sections one by one!
  // Bottom-most clinical sections: FH -> Allergy -> Drugs -> PMH
  while (rawSections.length > 2 && getP1TotalUnits(rawSections, p1ExamOrgans) > MAX_P1_LINE_BUDGET) {
    const poppedSec = rawSections.pop()!;
    movedSectionsToP2.unshift(poppedSec);
  }

  // Step 2c: If only CC and HPI remain on Page 1 and space is STILL exceeded:
  // HPI fills whatever space is left on Page 1, and only its trailing lines overflow to Page 2!
  const p1FinalSections: Array<{ fa: string; en: string; lines: string[]; heightPt: number }> = [];
  const p2FinalSections: Array<{ fa: string; en: string; lines: string[]; heightPt: number }> = [];

  // Add all sections that fit on Page 1
  let usedOnP1 = getExamBlockCost(p1ExamOrgans);
  for (let i = 0; i < rawSections.length; i++) {
    const sec = rawSections[i];
    const isHpi = sec.key === 'hpi';
    const remainingSecs = rawSections.slice(i + 1).reduce((acc, s) => acc + s.minLines, 0);
    const spaceForThis = MAX_P1_LINE_BUDGET - usedOnP1 - remainingSecs;

    if (spaceForThis >= sec.displayLines || !isHpi) {
      // fits cleanly or is not HPI
      p1FinalSections.push({
        fa: sec.fa,
        en: sec.en,
        lines: sec.lines,
        heightPt: Math.round(sec.displayLines * LINE_PT)
      });
      usedOnP1 += sec.displayLines;
    } else {
      // HPI is very large: fill page 1 to the bottom and spill trailing lines
      const keepLines = Math.max(2, Math.floor(spaceForThis));
      const p1Lines = sec.lines.slice(0, keepLines);
      const p2Lines = sec.lines.slice(keepLines);

      p1FinalSections.push({
        fa: sec.fa,
        en: sec.en,
        lines: p1Lines,
        heightPt: Math.round(keepLines * LINE_PT)
      });
      usedOnP1 += keepLines;

      if (p2Lines.length > 0) {
        p2FinalSections.push({
          fa: sec.fa + ' (ادامه)',
          en: sec.en + ' (Continued)',
          lines: p2Lines,
          heightPt: Math.round(p2Lines.length * LINE_PT)
        });
      }
    }
  }

  // Add the moved full sections (PMH, Drugs, Allergy, FH) to Page 2 in their canonical order
  movedSectionsToP2.forEach(s => {
    p2FinalSections.push({
      fa: s.fa,
      en: s.en,
      lines: s.lines,
      heightPt: Math.round(Math.max(s.minLines, s.textLineCount) * LINE_PT)
    });
  });

  const overflowOccurred = movedOrgans.length > 0 || movedSectionsToP2.length > 0 || p2FinalSections.length > 0;

  return {
    p1Sections: p1FinalSections,
    p1Organs: p1ExamOrgans,
    p2MovedOrgans: movedOrgans,
    p2Sections: p2FinalSections,
    page1OverflowOccurred: overflowOccurred,
    totalPage1Units: Math.round(usedOnP1 * 10) / 10,
    maxPage1Budget: MAX_P1_LINE_BUDGET
  };
}

/**
 * Builds the complete HTML for Page 1 and Page 2
 */
export function buildHospitalPagesHTML(data: HospitalFormData, isForWord = false): { page1: string; page2: string; pagination: PaginationResult } {
  const recNo = esc(toFaDigits(data.rec_no));
  const pName = esc(data.patient_name.trim());
  const pFamily = esc(data.patient_family.trim());
  const pFather = esc(data.patient_father.trim());
  const bDate = esc(toFaDigits(data.birth_date));
  const ward = esc(data.ward_name.trim());
  const room = esc(toFaDigits(data.room_no));
  const bed = esc(toFaDigits(data.bed_no));
  const doc = esc(data.attending_physician.trim());
  const admDate = esc(toFaDigits(data.adm_date));
  const admTime = esc(toFaDigits(data.adm_time));
  const user = esc(data.user_code.trim());

  const pagination = calculateClinicalPagination(data);

  // --- Page 1 Clinical Boxes ---
  const p1BoxesHTML = pagination.p1Sections
    .map(s => makeClinicalBoxFromLines(s.fa, s.en, s.lines, s.heightPt, 4, false))
    .join('');

  // --- Page 1 Physical Exam block ---
  let p1ExamBlockHTML = '';
  if (pagination.p1Organs.length > 0) {
    p1ExamBlockHTML = `
      <tr>
        <td colspan="4" width="50%" dir="rtl" style="${STYLES.headR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:10pt;mso-bidi-font-size:10pt;">معاینات بدنی و بررسی های بالینی:&rlm;</p></td>
        <td colspan="4" width="50%" dir="ltr" style="${STYLES.headL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">Physical &amp; Clinical Examination:</p></td>
      </tr>
      ${pagination.p1Organs.map(o => makeBilingualOrganRow(o.fa, o.en, o.v, 4, false)).join('')}
      <tr>
        <td colspan="4" width="50%" dir="rtl" style="${STYLES.noLineR}border-bottom:1pt solid #000;mso-border-bottom-alt:solid #000 1pt;font-weight:bold;">
          <p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:9.5pt;mso-bidi-font-size:9.5pt;">لطفا پشت صفحه را تکمیل کنید</p>
        </td>
        <td colspan="4" width="50%" dir="ltr" style="${STYLES.noLineL}border-bottom:1pt solid #000;mso-border-bottom-alt:solid #000 1pt;font-weight:bold;">
          <p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;">Please Complete the Reverse side</p>
        </td>
      </tr>
    `;
  } else {
    p1ExamBlockHTML = `
      <tr>
        <td colspan="4" width="50%" dir="rtl" style="${STYLES.noLineR}border-top:1pt solid #000;border-bottom:1pt solid #000;font-weight:bold;">
          <p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:9.5pt;">لطفا پشت صفحه را تکمیل کنید</p>
        </td>
        <td colspan="4" width="50%" dir="ltr" style="${STYLES.noLineL}border-top:1pt solid #000;border-bottom:1pt solid #000;font-weight:bold;">
          <p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;">Please Complete the Reverse side</p>
        </td>
      </tr>
    `;
  }

  // --- Page 1 Complete Markup ---
  const page1 = `
    <table dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;mso-table-dir:bidi;border:none;margin-bottom:1pt;">
      <tr>
        <td width="25%" style="border:none;">&nbsp;</td>
        <td width="50%" align="center" valign="middle" style="border:none;text-align:center;padding-bottom:1pt;">
          <p dir="rtl" style="margin:0;line-height:1.1;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:12pt;mso-bidi-font-size:12pt;font-weight:bold;">بیمارستان شهدای خلیج فارس بوشهر</p>
          <p dir="ltr" style="margin:0;line-height:1.1;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;font-weight:bold;">Bushehr Khalij Fars Hospital</p>
          <p dir="rtl" style="margin:0.5pt 0 0 0;line-height:1.1;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:11pt;mso-bidi-font-size:11pt;font-weight:bold;">برگ شرح حال و معاینه بدنی</p>
          <p dir="ltr" style="margin:0;line-height:1.1;font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;font-weight:bold;">Medical History &amp; Physical Examination Sheet</p>
        </td>
        <td width="25%" style="border:none;">&nbsp;</td>
      </tr>
    </table>

    <table dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;mso-table-dir:bidi;border:none;">
      <tr>
        <td width="13%" dir="rtl" style="${STYLES.topLblR}"><p dir="rtl" style="margin:0;">شماره پرونده:&rlm;</p></td>
        <td width="12%" dir="ltr" style="${STYLES.topLblL}"><p dir="ltr" style="margin:0;">Unit No:</p></td>
        <td colspan="6" width="75%" style="border:none;mso-border-alt:none;">&nbsp;</td>
      </tr>
      <tr>
        <td colspan="2" width="25%" dir="rtl" style="${STYLES.botVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">${recNo || '&nbsp;'}</p></td>
        <td colspan="6" width="75%" style="border:none;border-bottom:1pt solid #000;mso-border-bottom-alt:solid #000 1pt;">&nbsp;</td>
      </tr>

      <tr>
        <td width="13%" dir="rtl" style="${STYLES.topLblR}"><p dir="rtl" style="margin:0;">نام خانوادگی:&rlm;</p></td>
        <td width="12%" dir="ltr" style="${STYLES.topLblL}"><p dir="ltr" style="margin:0;">Last Name:</p></td>
        <td width="13%" dir="rtl" style="${STYLES.topLblR}"><p dir="rtl" style="margin:0;">نام:&rlm;</p></td>
        <td width="12%" dir="ltr" style="${STYLES.topLblL}"><p dir="ltr" style="margin:0;">Name:</p></td>
        <td width="14%" dir="rtl" style="${STYLES.topLblR}"><p dir="rtl" style="margin:0;">بخش:&rlm; &nbsp;${ward}</p></td>
        <td width="11%" dir="ltr" style="${STYLES.topLblL}"><p dir="ltr" style="margin:0;">Ward:</p></td>
        <td width="13%" dir="rtl" style="${STYLES.topLblR}"><p dir="rtl" style="margin:0;">پزشک معالج:&rlm;</p></td>
        <td width="12%" dir="ltr" style="${STYLES.topLblL}"><p dir="ltr" style="margin:0;">Physician:</p></td>
      </tr>
      <tr>
        <td colspan="2" width="25%" dir="rtl" style="${STYLES.botVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">${pFamily || '&nbsp;'}</p></td>
        <td colspan="2" width="25%" dir="rtl" style="${STYLES.botVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">${pName || '&nbsp;'}</p></td>
        <td width="14%" dir="rtl" style="${STYLES.noLineR}font-size:9pt;font-weight:bold;"><p dir="rtl" style="margin:0;">اتاق:&rlm; &nbsp;${room}</p></td>
        <td width="11%" dir="ltr" style="${STYLES.noLineL}font-size:8pt;font-weight:bold;"><p dir="ltr" style="margin:0;">Room:</p></td>
        <td colspan="2" width="25%" dir="rtl" style="${STYLES.botVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">${doc || '&nbsp;'}</p></td>
      </tr>

      <tr>
        <td width="13%" dir="rtl" style="${STYLES.topLblR}"><p dir="rtl" style="margin:0;">نام پدر:&rlm;</p></td>
        <td width="12%" dir="ltr" style="${STYLES.topLblL}"><p dir="ltr" style="margin:0;">Father Name:</p></td>
        <td width="13%" dir="rtl" style="${STYLES.topLblR}"><p dir="rtl" style="margin:0;">تاریخ تولد:&rlm;</p></td>
        <td width="12%" dir="ltr" style="${STYLES.topLblL}"><p dir="ltr" style="margin:0;">Birth Date:</p></td>
        <td width="14%" dir="rtl" style="${STYLES.noLineR}font-size:9pt;font-weight:bold;"><p dir="rtl" style="margin:0;">تخت:&rlm; &nbsp;${bed}</p></td>
        <td width="11%" dir="ltr" style="${STYLES.noLineL}font-size:8pt;font-weight:bold;"><p dir="ltr" style="margin:0;">Bed:</p></td>
        <td width="11%" dir="rtl" style="${STYLES.topLblR}"><p dir="rtl" style="margin:0;">تاریخ پذیرش:&rlm;</p></td>
        <td width="14%" dir="ltr" style="${STYLES.topLblL}"><p dir="ltr" style="margin:0;">Date of Admission:</p></td>
      </tr>
      <tr>
        <td colspan="2" width="25%" dir="rtl" style="${STYLES.botVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">${pFather || '&nbsp;'}</p></td>
        <td colspan="2" width="25%" dir="rtl" style="${STYLES.botVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">${bDate || '&nbsp;'}</p></td>
        <td colspan="2" width="25%" dir="rtl" style="${STYLES.botVal}"><p dir="rtl" style="margin:0;">&nbsp;</p></td>
        <td colspan="2" width="25%" dir="rtl" style="${STYLES.botVal}"><p dir="rtl" align="center" style="margin:0;text-align:center;">${(admTime ? admTime + ' &nbsp;&nbsp; ' : '') + (admDate || '&nbsp;')}</p></td>
      </tr>

      <tr style="height:3pt;">
        <td colspan="8" style="border-top:1pt solid #000;border-bottom:1pt solid #000;border-left:none;border-right:none;mso-border-top-alt:solid #000 1pt;mso-border-bottom-alt:solid #000 1pt;mso-border-left-alt:none;mso-border-right-alt:none;font-size:1pt;line-height:1pt;">&nbsp;</td>
      </tr>

      ${p1BoxesHTML}
      ${p1ExamBlockHTML}
    </table>
    ${makeStandardFooter(data.adm_date, user, 1, 2)}
  `;

  // --- Page 2 Overflow Boxes & Organs ---
  const overflowBoxesHTML = pagination.p2Sections
    .map(s => makeClinicalBoxFromLines(s.fa, s.en, s.lines, s.heightPt, 1, false))
    .join('');

  // Page 2 Organs: any moved organs from Page 1 come first, followed by Head & Neck, Eyes, etc.
  const page2BaseOrgans: Array<{ fa: string; en: string; v: string }> = [
    ...pagination.p2MovedOrgans.map(o => ({ fa: o.fa, en: o.en, v: o.v })),
    { fa: 'سر و گردن', en: 'Head & Neck', v: data.pe_head_neck },
    { fa: 'چشم', en: 'Eyes', v: data.pe_eyes },
    { fa: 'قلب و عروق', en: 'Cardiovascular', v: data.pe_cvs },
    { fa: 'ریه', en: 'Lungs', v: data.pe_chest },
    { fa: 'شکم', en: 'Abdomen', v: data.pe_abd },
    { fa: 'اندام‌ها', en: 'Extremities', v: data.pe_ext },
    { fa: 'سیستم عصبی', en: 'Neurological', v: data.pe_neuro }
  ];
  const page2OrgansHTML = page2BaseOrgans.map(o => makeBilingualOrganRow(o.fa, o.en, o.v, 1, true)).join('');

  // Dynamic heights for Summary, Primary DX, Signature on Page 2
  const LINE_PT = 15.5;
  const overflowPt = pagination.p2Sections.reduce((acc, x) => acc + 14 + x.heightPt, 0) + (pagination.p2MovedOrgans.length * 14);
  const sumLines = splitTextIntoVisualLines(data.clinical_summary, 85);
  const dxLines = splitTextIntoVisualLines(data.primary_dx, 85);
  const sigLines = splitTextIntoVisualLines(data.examining_physician, 85);

  const sumH = Math.max(sumLines.length * LINE_PT, Math.max(35, Math.round(110 - overflowPt * 0.5)));
  const dxH  = Math.max(dxLines.length * LINE_PT,  Math.max(24, Math.round(55  - overflowPt * 0.25)));
  const sigH = Math.max(sigLines.length * LINE_PT, Math.max(24, Math.round(48  - overflowPt * 0.20)));

  const page2 = `
    <table dir="rtl" width="100%" cellspacing="0" cellpadding="2" style="width:100%;border-collapse:collapse;mso-table-dir:bidi;border:none;margin-bottom:2pt;">
      <tr>
        <td align="center" style="border:none;text-align:center;">
          <p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:12pt;mso-bidi-font-size:12pt;font-weight:bold;">برگ شرح حال و معاینه بدنی</p>
          <p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;font-weight:bold;">Medical History &amp; Physical Examination Sheet</p>
        </td>
      </tr>
    </table>

    <table dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;mso-table-dir:bidi;border:1.5pt solid #000;mso-border-alt:solid #000 1pt;">
      ${overflowBoxesHTML}
      <tr>
        <td width="55%" dir="rtl" style="${STYLES.headR}border-bottom:1pt solid #000;mso-border-bottom-alt:solid #000 1pt;">
          <p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:10pt;mso-bidi-font-size:10pt;">معاینات بدنی و بررسیهای اولیه بالینی (ادامه):&rlm;</p>
        </td>
        <td width="45%" dir="ltr" style="${STYLES.headL}border-bottom:1pt solid #000;mso-border-bottom-alt:solid #000 1pt;">
          <p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">Physical Examination &amp; Clinical Investigation (Continued):</p>
        </td>
      </tr>
      ${page2OrgansHTML}
      <tr>
        <td colspan="2" style="border:1pt solid #000;mso-border-alt:solid #000 1pt;padding:2.5pt 6pt;background-color:#f8fafc;">
          <p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:9pt;font-weight:bold;color:#475569;">
            در صورت وجود بیماری یا نقص در مقابل آن توضیح داده شود و در غیر این صورت با علامت <b>×</b> مشخص گردد.
          </p>
        </td>
      </tr>
      <tr>
        <td width="55%" dir="rtl" style="${STYLES.headR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:10pt;">خلاصه:&rlm;</p></td>
        <td width="45%" dir="ltr" style="${STYLES.headL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">SUMMARY:</p></td>
      </tr>
      <tr style="height:${sumH}pt;">
        <td colspan="2" style="${STYLES.body}height:${sumH}pt;">${formatLinesArrayParagraph(sumLines, false)}</td>
      </tr>
      <tr>
        <td width="55%" dir="rtl" style="${STYLES.headR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:10pt;">تشخیص اولیه:&rlm;</p></td>
        <td width="45%" dir="ltr" style="${STYLES.headL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">Primary DX:</p></td>
      </tr>
      <tr style="height:${dxH}pt;">
        <td colspan="2" style="${STYLES.body}height:${dxH}pt;">${formatLinesArrayParagraph(dxLines, true)}</td>
      </tr>
      <tr>
        <td width="55%" dir="rtl" style="${STYLES.headR}"><p dir="rtl" style="margin:0;line-height:1.15;font-family:'Vazirmatn','B Nazanin','Noto Sans Arabic',Tahoma,sans-serif;font-size:10pt;">امضاء پزشک معاینه کننده:&rlm;</p></td>
        <td width="45%" dir="ltr" style="${STYLES.headL}"><p dir="ltr" style="margin:0;line-height:1.15;font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;">Signature of Examining physician:</p></td>
      </tr>
      <tr style="height:${sigH}pt;">
        <td colspan="2" style="${STYLES.body}height:${sigH}pt;">${formatLinesArrayParagraph(sigLines, false)}</td>
      </tr>
    </table>
    ${makeStandardFooter(data.adm_date, user, 2, 2)}
  `;

  return { page1, page2, pagination };
}

/**
 * Builds a complete Word document (.doc) with XML MSO header and page breaks
 */
export function buildWordDocumentContent(data: HospitalFormData): string {
  const { page1, page2 } = buildHospitalPagesHTML(data, true);

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"
      lang="fa" dir="rtl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>برگ شرح حال و معاینه بدنی</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
      <w:DisplayHorizontalDrawingGridEvery>0</w:DisplayHorizontalDrawingGridEvery>
      <w:DisplayVerticalDrawingGridEvery>2</w:DisplayVerticalDrawingGridEvery>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 595.3pt 841.9pt; /* A4 */
      margin: 19.8pt 28.3pt 19.8pt 28.3pt; /* 7mm 10mm */
      mso-header-margin: 14.2pt;
      mso-footer-margin: 14.2pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    p, table, td, span, div {
      font-family: 'B Nazanin', Tahoma, Arial, sans-serif;
      mso-bidi-font-family: 'B Nazanin';
    }
    br.pageBreak {
      page-break-before: always;
      mso-break-type: section-break;
    }
  </style>
</head>
<body style="tab-interval:36.0pt;direction:rtl;margin:0;padding:0;">
  <div class="Section1">
    ${page1}
    <br class="pageBreak" clear="all" style="page-break-before:always;mso-break-type:section-break;" />
    ${page2}
  </div>
</body>
</html>`;
}
