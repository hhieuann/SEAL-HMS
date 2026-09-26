// Date and money formatting for the public pages. Dates arrive as ISO "YYYY-MM-DD"
// strings (the backend's LocalDate); they are read as calendar dates, never through
// `new Date(string)`, so the visitor's timezone can't shift them by a day.

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

const pad = (n) => String(n).padStart(2, '0');

const viDate = ({ day, month, year }) => `${pad(day)}/${pad(month)}/${year}`;
const enDate = ({ day, month, year }) => `${day} ${EN_MONTHS[month - 1]} ${year}`;

export function formatDate(value, lang) {
  const date = parseDate(value);
  if (!date) return null;
  return lang === 'en' ? enDate(date) : viDate(date);
}

// "15 – 16/08/2026" / "15–16 Aug 2026", collapsing the parts both ends share.
export function formatDateRange(start, end, lang) {
  const from = parseDate(start);
  const to = parseDate(end);
  if (!from) return to ? formatDate(end, lang) : null;
  if (!to || (from.year === to.year && from.month === to.month && from.day === to.day)) {
    return formatDate(start, lang);
  }

  const sameYear = from.year === to.year;
  const sameMonth = sameYear && from.month === to.month;

  if (lang === 'en') {
    if (sameMonth) return `${from.day}–${enDate(to)}`;
    if (sameYear) return `${from.day} ${EN_MONTHS[from.month - 1]} – ${enDate(to)}`;
    return `${enDate(from)} – ${enDate(to)}`;
  }
  if (sameMonth) return `${pad(from.day)} – ${viDate(to)}`;
  if (sameYear) return `${pad(from.day)}/${pad(from.month)} – ${viDate(to)}`;
  return `${viDate(from)} – ${viDate(to)}`;
}

// 7000000 -> "7.000.000đ" (vi) / "7,000,000 VND" (en)
export function formatMoney(amount, lang) {
  const grouped = String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.');
  return lang === 'en' ? `${grouped} VND` : `${grouped}đ`;
}
