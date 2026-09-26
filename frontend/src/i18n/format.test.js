import { describe, it, expect } from 'vitest';
import { formatDate, formatDateRange, formatMoney } from './format';
import { translate, pickLocalized } from './translate';

describe('formatDateRange', () => {
  it('collapses a range inside one month', () => {
    expect(formatDateRange('2026-08-15', '2026-08-16', 'vi')).toBe('15 – 16/08/2026');
    expect(formatDateRange('2026-08-15', '2026-08-16', 'en')).toBe('15–16 Aug 2026');
  });

  it('keeps both months when the range crosses one', () => {
    expect(formatDateRange('2026-09-28', '2026-10-02', 'vi')).toBe('28/09 – 02/10/2026');
    expect(formatDateRange('2026-09-28', '2026-10-02', 'en')).toBe('28 Sep – 2 Oct 2026');
  });

  it('shows a single date when start and end match or end is missing', () => {
    expect(formatDateRange('2026-04-12', '2026-04-12', 'vi')).toBe('12/04/2026');
    expect(formatDateRange('2026-04-12', null, 'en')).toBe('12 Apr 2026');
  });

  it('returns null without a usable start or end', () => {
    expect(formatDateRange(null, null, 'vi')).toBeNull();
    expect(formatDate('not-a-date', 'vi')).toBeNull();
  });
});

describe('formatMoney', () => {
  it('groups thousands the way each language expects', () => {
    expect(formatMoney(7000000, 'vi')).toBe('7.000.000đ');
    expect(formatMoney(1500000, 'en')).toBe('1,500,000 VND');
  });
});

describe('translate', () => {
  it('fills placeholders and falls back to Vietnamese, then to the key', () => {
    expect(translate('en', 'past.finalists', { n: 6 })).toBe('6 finalists');
    expect(translate('vi', 'past.finalists', { n: 6 })).toBe('6 đội chung kết');
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
  });

  it('picks the requested language from a localized field', () => {
    expect(pickLocalized({ vi: 'Chủ đề', en: 'Theme' }, 'en')).toBe('Theme');
    expect(pickLocalized({ vi: 'Chủ đề' }, 'en')).toBe('Chủ đề');
    expect(pickLocalized('plain', 'en')).toBe('plain');
  });
});
