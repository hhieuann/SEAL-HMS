import { describe, it, expect } from 'vitest';
import { pickUpcomingEvent, upcomingStatus } from './upcomingEvent';

const TODAY = '2026-09-26';

describe('pickUpcomingEvent', () => {
  it('prefers a running event over announced ones', () => {
    const events = [
      { id: 1, status: 'UPCOMING', startDate: '2026-10-01' },
      { id: 2, status: 'ONGOING', startDate: '2026-09-20', endDate: '2026-09-30' },
    ];
    expect(pickUpcomingEvent(events, TODAY).id).toBe(2);
  });

  it('picks the soonest start among events of the same status', () => {
    const events = [
      { id: 1, status: 'PLANNED', startDate: '2026-12-01' },
      { id: 2, status: 'PLANNED', startDate: '2026-11-01' },
    ];
    expect(pickUpcomingEvent(events, TODAY).id).toBe(2);
  });

  it('ignores finished, cancelled and already-ended events', () => {
    const events = [
      { id: 1, status: 'COMPLETED', startDate: '2026-08-15' },
      { id: 2, status: 'CANCELLED', startDate: '2026-10-01' },
      { id: 3, status: 'PLANNED', startDate: '2026-01-01', endDate: '2026-01-02' },
    ];
    expect(pickUpcomingEvent(events, TODAY)).toBeNull();
    expect(pickUpcomingEvent(undefined, TODAY)).toBeNull();
  });
});

describe('upcomingStatus', () => {
  it('maps an event to the announcement wording', () => {
    expect(upcomingStatus({ status: 'ONGOING', registrationOpen: true })).toBe('live');
    expect(upcomingStatus({ status: 'UPCOMING', registrationOpen: true })).toBe('open');
    expect(upcomingStatus({ status: 'PLANNED', registrationOpen: false })).toBe('upcoming');
  });
});
