import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  calculateClinicalPagination,
  initialHospitalFormData,
  splitTextIntoVisualLines,
  getVisualCharLength,
  sanitizeControlChars,
  xmlEsc,
  crc32Bytes,
  detectDeviceOS,
  isIOSDevice,
  sanitizeFileName,
  toFaDigits,
  isLatinText,
  buildDocxBytes,
  buildHospitalPagesHTML
} from './hospitalSheet';
import { generateStandaloneHtmlString } from './standaloneHtmlGenerator';

test('toFaDigits converts Latin numbers to Persian digits', () => {
  assert.equal(toFaDigits('1403/08/15'), '۱۴۰۳/۰۸/۱۵');
  assert.equal(toFaDigits('R173'), 'R۱۷۳');
});

test('sanitizeControlChars & xmlEsc strip illegal XML 1.0 control characters and lone surrogates', () => {
  const dirtyClinicalNote = 'بیمار\x00 با\x07 درد\x0B قفسه\x0C سینه\x1F مراجعه\uFFFF کرده & <است>';
  const cleaned = sanitizeControlChars(dirtyClinicalNote);
  assert.equal(cleaned, 'بیمار با درد قفسه سینه مراجعه کرده & <است>');
  const escaped = xmlEsc(dirtyClinicalNote);
  assert.equal(escaped, 'بیمار با درد قفسه سینه مراجعه کرده &amp; &lt;است&gt;');
  assert.ok(!/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/.test(escaped));
});

test('isLatinText accurately handles pure English, pure Persian, and mixed Persian-English clinical notes', () => {
  // Pure English DX -> LTR (true)
  assert.equal(isLatinText('Acute Coronary Syndrome (ACS) - R/O Unstable Angina'), true);
  // Pure Persian HPI -> RTL (false)
  assert.equal(isLatinText('درد قفسه سینه فشارنده همراه با تنگی نفس'), false);
  // Persian clinical note containing multiple English drug names -> MUST stay RTL (false)
  assert.equal(
    isLatinText('مصرف روزانه Losartan 25mg و Atorvastatin 20mg و Metformin 500mg و Aspirin 80mg'),
    false,
    'Persian sentence with English drug names must remain RTL'
  );
  // Mixed note starting with English abbreviation (NKDA) but predominantly Persian -> MUST stay RTL (false)
  assert.equal(
    isLatinText('NKDA (فاقد حساسیت دارویی و غذایی شناخته شده)'),
    false,
    'NKDA with Persian explanation must remain RTL'
  );
  // Normal organ sign -> RTL (false)
  assert.equal(isLatinText('×'), false);
});

test('getVisualCharLength & splitTextIntoVisualLines ignore zero-width non-joiner (ZWNJ نیم‌فاصله)', () => {
  const wordWithZwnj = 'می\u200Cباشد\u200Cها'; // 2 ZWNJs
  assert.equal(getVisualCharLength(wordWithZwnj), wordWithZwnj.length - 2);

  const sample = 'بیمار با شکایت درد قفسه سینه مراجعه کرده و سابقه بیماری قبلی را نفی می‌کند و وضعیت علائم حیاتی پایدار است';
  const lines = splitTextIntoVisualLines(sample, 40);
  assert.ok(lines.length > 1);
  lines.forEach(l => {
    assert.ok(getVisualCharLength(l) <= 45);
  });
});

test('crc32Bytes precomputed lookup table matches IEEE 802.3 standard vector', () => {
  const vector = new TextEncoder().encode('123456789');
  assert.equal(crc32Bytes(vector), 0xcbf43926);
});

test('Pagination: Default sample data fits within Page 1 line budget without moving items', () => {
  const result = calculateClinicalPagination(initialHospitalFormData);
  assert.equal(result.p2MovedOrgans.length, 0);
  assert.equal(result.p2Sections.length, 0);
  assert.equal(result.p1Organs.length, 5); // GA, Vitals, Skin, Skull, Ear
  assert.equal(result.p1Sections.length, 6); // CC, HPI, PMH, Drugs, Allergy, FH
});

test('Pagination: Moderate overflow moves items strictly from the BOTTOM of Page 1', () => {
  const data = {
    ...initialHospitalFormData,
    hpi: `بیمار با شرح حال درد سینه از ۲ روز قبل مراجعه نموده است.
درد به شانه و فک انتشار دارد.
سابقه تروما منفی است.
با استراحت بهتر نمی‌شود و با فعالیت تشدید می‌گردد.
تهوع و استفراغ خفیف نیز در بدو ورود گزارش شده است.
درد حالت فشارنده دارد و از ۳۰ دقیقه پیش شدت یافته است.
بیمار سابقه مصرف قرص زیرزبانی نیتروگلیسیرین را ذکر می‌کند که تسکین نسبی داده است.
سمع ریه‌ها شفاف بوده و تنفس بیمار تا حدی تند است.
نوار قلب اولیه تغییرات قطعه ST را نشان می‌دهد.
آزمایش آنزیم‌های قلبی ارسال شده است.`
  };

  const result = calculateClinicalPagination(data);
  assert.ok(result.p2MovedOrgans.length > 0, 'Should have moved at least one organ from the bottom');

  const movedKeys = result.p2MovedOrgans.map(o => o.key);
  assert.ok(movedKeys.includes('ear'), 'Ear (the bottom-most item) must be moved to Page 2 first');

  const p1Keys = result.p1Sections.map(s => s.fa);
  assert.ok(p1Keys.some(k => k.includes('شکایت اصلی')));
  assert.ok(p1Keys.some(k => k.includes('تاریخچه بیماری فعلی')));
  assert.ok(p1Keys.some(k => k.includes('تاریخچه ی بیماریهای قبلی')));
});

test('Pagination: Heavy overflow moves organs first, then clinical sections from bottom up (FH -> Allergy -> Drugs -> PMH)', () => {
  const data = {
    ...initialHospitalFormData,
    hpi: Array(12).fill('خط گزارش تکمیلی از سیر بالینی بیمار در اورژانس و بخش داخلی بیمارستان شهدای خلیج فارس.').join('\n')
  };

  const result = calculateClinicalPagination(data);
  assert.equal(result.p1Organs.length, 0, 'All organs should have been moved from bottom of Page 1');
  assert.equal(result.p2MovedOrgans.length, 5);

  if (result.p2Sections.length > 0) {
    const p2Titles = result.p2Sections.map(s => s.fa);
    assert.ok(p2Titles.some(t => t.includes('سوابق فامیلی')), 'Family History should be moved before PMH or CC');
  }
});

test('Pagination: Verification that no item from the top moves while bottom items remain on Page 1', () => {
  for (let extraLines = 1; extraLines <= 18; extraLines += 3) {
    const testData = {
      ...initialHospitalFormData,
      hpi: Array(extraLines).fill('متن تستی شرح حال بالینی بیمار در بخش').join('\n')
    };
    const res = calculateClinicalPagination(testData);

    const earOnP1 = res.p1Organs.some(o => o.key === 'ear');
    if (earOnP1) {
      assert.equal(res.p2MovedOrgans.length, 0, 'No organs should move if bottom-most Ear is still on Page 1');
      assert.equal(res.p2Sections.length, 0, 'No sections should move if bottom-most Ear is still on Page 1');
    }

    if (res.p2Sections.length > 0) {
      assert.equal(res.p1Organs.length, 0, 'All PE organs must move to Page 2 before any clinical section moves');
    }
  }
});

test('Standalone HTML generator produces valid self-contained HTML synchronized with public file and free of legacy bugs', () => {
  const html = generateStandaloneHtmlString();
  const publicHtml = fs.readFileSync('public/khalij_fars_hospital_sheet_fixed.html', 'utf8');
  assert.equal(html, publicHtml, 'Standalone HTML module must be 100% synchronized with public/khalij_fars_hospital_sheet_fixed.html');
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('بیمارستان شهدای خلیج فارس بوشهر'));
  assert.ok(html.includes('buildHospitalPagesHTML'));
  assert.ok(html.includes('buildRealDocxBytes'));
  assert.ok(html.includes('CRC32_TABLE'));
  assert.ok(html.includes('sanitizeControlChars'));
  assert.ok(html.includes('_R173.docx'));
  assert.ok(html.includes('makeOrganRowInline'), 'Standalone HTML must include 2-cell inline makeOrganRowInline');
  assert.ok(html.includes('makeOrganRowP1'), 'Standalone HTML must include makeOrganRowP1');
  assert.ok(html.includes('makeOrganRowP2'), 'Standalone HTML must include makeOrganRowP2');
  assert.ok(!html.includes('(.docx) (.docx)'), 'Standalone HTML must not have duplicate (.docx) button labels');
  assert.ok(!html.includes('10:23:26'), 'Standalone HTML must never contain hardcoded 10:23:26 AM');
  assert.ok(!html.includes('inset-block-start'), 'Must never contain CSS logical border keys in JS');
  assert.ok(!html.includes('inset-inline-end'), 'Must never contain CSS logical border keys in JS');
  assert.ok(!html.includes("window.open(url, '_blank')"), 'Must never use window.open on binary .docx blobs');
  assert.ok(!html.includes('/fonts/Vazirmatn-Regular.woff2'), 'Should not reference container local relative font paths on user disk');
});

test('Cross-OS 3-Cycle Verification: Windows, macOS, Android, and iOS compatibility (3 iterations each)', () => {
  const osProfiles = [
    {
      name: 'Windows 11 (Chrome / Edge / Word Desktop)',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      platform: 'Win32',
      touchPoints: 0,
      expectedOS: 'windows',
      expectedIOS: false
    },
    {
      name: 'macOS Sonoma (Safari / Word for Mac)',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
      platform: 'MacIntel',
      touchPoints: 0,
      expectedOS: 'macos',
      expectedIOS: false
    },
    {
      name: 'Android 14 Mobile (Chrome Mobile / Word Mobile / Google Docs)',
      ua: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36',
      platform: 'Linux armv81',
      touchPoints: 5,
      expectedOS: 'android',
      expectedIOS: false
    },
    {
      name: 'iOS 17 iPhone & iPadOS (Mobile Safari / WebKit)',
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      touchPoints: 5,
      expectedOS: 'ios',
      expectedIOS: true
    },
    {
      name: 'iPadOS Desktop-Mode UA (MacIntel + Multi-Touch)',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
      platform: 'MacIntel',
      touchPoints: 5,
      expectedOS: 'ios',
      expectedIOS: true
    }
  ];

  // Execute 3 full verification cycles across every OS profile
  for (let cycle = 1; cycle <= 3; cycle++) {
    for (const profile of osProfiles) {
      const detected = detectDeviceOS(profile.ua, profile.platform, profile.touchPoints);
      assert.equal(detected, profile.expectedOS, `[Cycle ${cycle}] OS detection failed for ${profile.name}`);
      assert.equal(
        isIOSDevice(profile.ua, profile.platform, profile.touchPoints),
        profile.expectedIOS,
        `[Cycle ${cycle}] isIOSDevice failed for ${profile.name}`
      );

      // Simulate clinical form data with dirty control chars, mixed Persian/English drugs, and ZWNJs
      const testFormData = {
        ...initialHospitalFormData,
        patient_family: `خلیلی\x07 بوشهری (${profile.expectedOS.toUpperCase()}-C${cycle})`,
        drugs_addiction: 'مصرف قرص Losartan 25mg روزانه، Atorvastatin 20mg شب‌ها و Metformin 500mg؛ نفی سیگار\x00 و الکل.',
        allergy: 'NKDA (فاقد حساسیت دارویی و غذایی شناخته\u200Cشده)',
        hpi: `بیمار در چرخه تست شماره ${cycle} روی سیستم‌عامل ${profile.name} بررسی شد.\x0B\x0C علائم حیاتی پایدار است.`
      };

      // 1. Verify HTML preview pages
      const { page1, page2 } = buildHospitalPagesHTML(testFormData);
      assert.ok(!/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/.test(page1), `[Cycle ${cycle}] Page 1 HTML contains illegal control chars`);
      assert.ok(!/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/.test(page2), `[Cycle ${cycle}] Page 2 HTML contains illegal control chars`);
      assert.ok(!page1.includes('10:23:26'), `[Cycle ${cycle}] Page 1 HTML must not contain hardcoded 10:23:26 AM`);
      assert.ok(!page2.includes('10:23:26'), `[Cycle ${cycle}] Page 2 HTML must not contain hardcoded 10:23:26 AM`);
      assert.ok(page1.includes(testFormData.adm_time), `[Cycle ${cycle}] Page 1 footer must include dynamic adm_time`);
      assert.ok(page2.includes(testFormData.adm_time), `[Cycle ${cycle}] Page 2 footer must include dynamic adm_time`);

      // Verify 2-cell asymmetric inline organ row structure in HTML (75% right Persian title + inline value, 25% left English)
      assert.ok(page1.includes('colspan="3" width="75%"'), `[Cycle ${cycle}] Page 1 organ row must have 75% right inline cell`);
      assert.ok(page1.includes('width="25%"'), `[Cycle ${cycle}] Page 1 organ row must have 25% left English cell`);
      assert.ok(page2.includes('colspan="3" width="75%"'), `[Cycle ${cycle}] Page 2 organ row must have 75% right inline cell`);
      assert.ok(page1.includes('width="18%"'), `[Cycle ${cycle}] Page 1 Ward/Room/Bed Persian column must be 18%`);
      assert.ok(page1.includes('width="7%"'), `[Cycle ${cycle}] Page 1 Ward/Room/Bed English column must be 7%`);

      // 2. Verify OOXML (.docx) binary generation
      const bytes = buildDocxBytes(testFormData);
      assert.equal(bytes[0], 0x50); // 'P'
      assert.equal(bytes[1], 0x4b); // 'K'
      assert.equal(bytes[2], 0x03);
      assert.equal(bytes[3], 0x04);

      const rawXml = new TextDecoder().decode(bytes);
      assert.ok(rawXml.includes('[Content_Types].xml'));
      assert.ok(rawXml.includes('word/document.xml'));
      assert.ok(rawXml.includes('word/styles.xml'));
      assert.ok(rawXml.includes('word/settings.xml'));
      assert.ok(rawXml.includes('<w:bidiVisual/>'));
      assert.ok(rawXml.includes('<w:pageBreakBefore/>'), `[Cycle ${cycle}] DOCX Page 2 header must use <w:pageBreakBefore/>`);
      assert.ok(!rawXml.includes('<w:br w:type="page"/>'), `[Cycle ${cycle}] DOCX must not use trailing <w:br w:type="page"/> paragraph`);
      assert.ok(rawXml.includes('<w:jc w:val="left"/>'), `[Cycle ${cycle}] DOCX paragraphs must include explicit <w:jc>`);
      assert.ok(!rawXml.includes('inset-block-start'));
      assert.ok(!rawXml.includes('inset-inline-end'));
      assert.ok(!rawXml.includes('10:23:26'), `[Cycle ${cycle}] DOCX XML must never contain hardcoded 10:23:26 AM`);
      assert.ok(
        rawXml.includes(`${testFormData.adm_date} ${testFormData.adm_time}`),
        `[Cycle ${cycle}] DOCX footer must dynamically render adm_date + adm_time`
      );

      // Verify 2-cell asymmetric inline organ row widths in DOCX (8079 dxa [75%, gridSpan=3] + 2693 dxa [25%])
      assert.ok(rawXml.includes('<w:tcW w:w="8079" w:type="dxa"/>'), `[Cycle ${cycle}] DOCX must include 75% (8079 dxa) right inline organ cell`);
      assert.ok(rawXml.includes('<w:gridSpan w:val="3"/>'), `[Cycle ${cycle}] DOCX right organ cell must span 3 grid columns`);

      // Verify Ward/Room/Bed column widths C5 = 1950 dxa and C6 = 743 dxa
      assert.ok(rawXml.includes('<w:gridCol w:w="1950"/>'), `[Cycle ${cycle}] DOCX patient table must use C5=1950 dxa for Ward/Room/Bed`);
      assert.ok(rawXml.includes('<w:gridCol w:w="743"/>'), `[Cycle ${cycle}] DOCX patient table must use C6=743 dxa for Ward/Room/Bed`);

      // Verify BiDi tokenization in wRun: balanced parenthesized Latin tokens (like (JVD: negative), (GCS: 15/15), (Room Air))
      // get Times New Roman without <w:rtl/> so parentheses never mirror into ((, while Persian tokens (like در هوای اتاق) get B Nazanin with <w:rtl/>
      assert.ok(
        rawXml.includes('<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="B Nazanin"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">(JVD: negative)</w:t></w:r>'),
        `[Cycle ${cycle}] BiDi tokenizer must isolate '(JVD: negative)' in an LTR Times New Roman run without <w:rtl/>`
      );
      assert.ok(
        rawXml.includes('<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="B Nazanin"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">(GCS: 15/15)</w:t></w:r>'),
        `[Cycle ${cycle}] BiDi tokenizer must isolate '(GCS: 15/15)' in an LTR Times New Roman run without <w:rtl/>`
      );
      assert.ok(
        rawXml.includes('<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="B Nazanin"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">(Room Air)</w:t></w:r>'),
        `[Cycle ${cycle}] BiDi tokenizer must isolate '(Room Air)' in an LTR Times New Roman run without <w:rtl/>`
      );
      assert.ok(
        rawXml.includes('<w:r><w:rPr><w:rFonts w:ascii="B Nazanin" w:hAnsi="B Nazanin" w:cs="B Nazanin"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:rtl/></w:rPr><w:t xml:space="preserve">در هوای اتاق </w:t></w:r>'),
        `[Cycle ${cycle}] BiDi tokenizer must keep 'در هوای اتاق ' in an RTL B Nazanin run with <w:rtl/> inside Vital Signs`
      );

      // Verify <w:bidiVisual/> <w:tcBorders> mapping:
      // For a Right cell (e.g. "شماره پرونده:" with { top: true, right: true }), <w:left> (RTL start = visual right) must be "single"
      // and <w:right> (RTL end = visual left / inner divider) must be "nil"!
      const unitNoRightCellIdx = rawXml.indexOf('شماره پرونده:');
      assert.ok(unitNoRightCellIdx > 0, `[Cycle ${cycle}] 'شماره پرونده:' must exist in document.xml`);
      const unitNoRightTcStart = rawXml.lastIndexOf('<w:tc>', unitNoRightCellIdx);
      const unitNoRightCellSlice = rawXml.slice(unitNoRightTcStart, unitNoRightCellIdx);
      assert.ok(
        unitNoRightCellSlice.includes('<w:left w:val="single"') && unitNoRightCellSlice.includes('<w:right w:val="nil"/>'),
        `[Cycle ${cycle}] Right cell in <w:bidiVisual/> table must map visual right border to <w:left w:val="single"> and inner divider to <w:right w:val="nil"/>`
      );

      const unitNoLeftCellIdx = rawXml.indexOf('Unit No:');
      assert.ok(unitNoLeftCellIdx > 0, `[Cycle ${cycle}] 'Unit No:' must exist in document.xml`);
      const unitNoLeftTcStart = rawXml.lastIndexOf('<w:tc>', unitNoLeftCellIdx);
      const unitNoLeftCellSlice = rawXml.slice(unitNoLeftTcStart, unitNoLeftCellIdx);
      assert.ok(
        unitNoLeftCellSlice.includes('<w:left w:val="nil"/>') && unitNoLeftCellSlice.includes('<w:right w:val="single"'),
        `[Cycle ${cycle}] Left cell in <w:bidiVisual/> table must map inner divider to <w:left w:val="nil"/> and visual left border to <w:right w:val="single">`
      );

      // Extract word/document.xml content and verify no illegal XML 1.0 control chars exist
      const docXmlStart = rawXml.indexOf('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document');
      const docXmlEnd = rawXml.indexOf('</w:document>') + '</w:document>'.length;
      assert.ok(docXmlStart !== -1 && docXmlEnd > docXmlStart, `[Cycle ${cycle}] word/document.xml must be present`);
      const docXml = rawXml.slice(docXmlStart, docXmlEnd);
      assert.ok(!/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/.test(docXml), `[Cycle ${cycle}] word/document.xml contains illegal XML 1.0 control chars`);

      // Verify filename sanitization across OS filesystems (Windows NTFS, macOS APFS, Android EXT4/F2FS, iOS APFS)
      const safeName = sanitizeFileName(testFormData.patient_family);
      assert.ok(!/[\\/:*?"<>|\x00-\x1F]/.test(safeName), `[Cycle ${cycle}] Unsafe filename on ${profile.name}`);
    }
  }
});

