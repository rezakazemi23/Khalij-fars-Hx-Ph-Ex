import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateClinicalPagination,
  initialHospitalFormData,
  splitTextIntoVisualLines,
  toFaDigits,
  isLatinText
} from './hospitalSheet';
import { generateStandaloneHtmlString } from './standaloneHtmlGenerator';

test('toFaDigits converts Latin numbers to Persian digits', () => {
  assert.equal(toFaDigits('1403/08/15'), '۱۴۰۳/۰۸/۱۵');
  assert.equal(toFaDigits('R173'), 'R۱۷۳');
});

test('isLatinText detects predominantly English content', () => {
  assert.equal(isLatinText('Acute Coronary Syndrome (ACS) - R/O Unstable Angina'), true);
  assert.equal(isLatinText('درد قفسه سینه فشارنده همراه با تنگی نفس'), false);
  assert.equal(isLatinText('×'), false);
});

test('splitTextIntoVisualLines wraps long lines at word boundaries', () => {
  const sample = 'بیمار با شکایت درد قفسه سینه مراجعه کرده و سابقه بیماری قبلی را نفی می‌کند و وضعیت علائم حیاتی پایدار است';
  const lines = splitTextIntoVisualLines(sample, 40);
  assert.ok(lines.length > 1);
  lines.forEach(l => {
    assert.ok(l.length <= 45);
  });
});

test('Pagination: Default sample data fits within Page 1 line budget without moving items', () => {
  const result = calculateClinicalPagination(initialHospitalFormData);
  assert.equal(result.p2MovedOrgans.length, 0);
  assert.equal(result.p2Sections.length, 0);
  assert.equal(result.p1Organs.length, 5); // GA, Vitals, Skin, Skull, Ear
  assert.equal(result.p1Sections.length, 6); // CC, HPI, PMH, Drugs, Allergy, FH
});

test('Pagination: Moderate overflow moves items strictly from the BOTTOM of Page 1', () => {
  // Give HPI 10 lines so it exceeds Page 1 budget even after padding compression
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
  // It should have moved items from the bottom (Ear first, then Skull if needed)
  assert.ok(result.p2MovedOrgans.length > 0, 'Should have moved at least one organ from the bottom');

  // The first organ moved MUST be Ear (the lowest organ on Page 1)
  const movedKeys = result.p2MovedOrgans.map(o => o.key);
  assert.ok(movedKeys.includes('ear'), 'Ear (the bottom-most item) must be moved to Page 2 first');

  // Page 1 clinical sections (CC, HPI, PMH, Drugs, Allergy, FH) MUST remain intact at top
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
  // All 5 organs should be moved from Page 1 to Page 2 before moving higher sections
  assert.equal(result.p1Organs.length, 0, 'All organs should have been moved from bottom of Page 1');
  assert.equal(result.p2MovedOrgans.length, 5);

  // If clinical sections had to be moved, the first one moved must be Family History (lowest clinical section)!
  if (result.p2Sections.length > 0) {
    const p2Titles = result.p2Sections.map(s => s.fa);
    assert.ok(p2Titles.some(t => t.includes('سوابق فامیلی')), 'Family History should be moved before PMH or CC');
  }
});

test('Pagination: Verification that no item from the top moves while bottom items remain on Page 1', () => {
  // Test across multiple text lengths
  for (let extraLines = 1; extraLines <= 18; extraLines += 3) {
    const testData = {
      ...initialHospitalFormData,
      hpi: Array(extraLines).fill('متن تستی شرح حال بالینی بیمار در بخش').join('\n')
    };
    const res = calculateClinicalPagination(testData);

    // Rule: If Ear is still on Page 1, NO other organ or section may have moved to Page 2!
    const earOnP1 = res.p1Organs.some(o => o.key === 'ear');
    if (earOnP1) {
      assert.equal(res.p2MovedOrgans.length, 0, 'No organs should move if bottom-most Ear is still on Page 1');
      assert.equal(res.p2Sections.length, 0, 'No sections should move if bottom-most Ear is still on Page 1');
    }

    // Rule: If any clinical section moved to Page 2, ALL 5 PE organs MUST already have been moved to Page 2!
    if (res.p2Sections.length > 0) {
      assert.equal(res.p1Organs.length, 0, 'All PE organs must move to Page 2 before any clinical section moves');
    }
  }
});

test('Standalone HTML generator produces valid self-contained HTML', () => {
  const html = generateStandaloneHtmlString();
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('بیمارستان شهدای خلیج فارس بوشهر'));
  assert.ok(html.includes('buildHospitalPagesHTML'));
  assert.ok(html.includes('exportToWordDoc'));
  assert.ok(!html.includes('/fonts/Vazirmatn-Regular.woff2'), 'Should not reference container local relative font paths on user disk');
  assert.ok(html.length > 10000, 'HTML content must be complete');
});

