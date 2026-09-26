// Chooses which live event the home page advertises: one running now beats one that is
// announced, and among those the soonest start date wins. Events that already ended are
// skipped even if their status was never moved on.

const PRIORITY = { ONGOING: 0, UPCOMING: 1, PLANNED: 2 };

const statusOf = (event) => String(event?.status || '').toUpperCase();

const todayIso = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export function pickUpcomingEvent(events, today = todayIso()) {
  const candidates = (events || []).filter(
    (event) => statusOf(event) in PRIORITY && !(event.endDate && event.endDate < today)
  );
  candidates.sort(
    (a, b) =>
      PRIORITY[statusOf(a)] - PRIORITY[statusOf(b)] ||
      (a.startDate || '9999').localeCompare(b.startDate || '9999')
  );
  return candidates[0] || null;
}

// 'live' | 'open' | 'upcoming' — picks the announcement wording.
export function upcomingStatus(event) {
  if (statusOf(event) === 'ONGOING') return 'live';
  if (event.registrationOpen) return 'open';
  return 'upcoming';
}
