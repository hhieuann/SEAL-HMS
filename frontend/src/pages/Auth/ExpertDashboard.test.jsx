import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ExpertDashboard from './ExpertDashboard';

const mocks = vi.hoisted(() => ({
  getAssignedEvents: vi.fn(),
  getAssignments: vi.fn(),
  getTeamsByEvent: vi.fn(),
  getTracksByEvent: vi.fn(),
  getEventRounds: vi.fn(),
}));

vi.mock('../../api/eventService', () => ({
  eventService: {
    getAssignedEvents: mocks.getAssignedEvents,
    getEventRounds: mocks.getEventRounds,
  },
}));

vi.mock('../../api/apiClient', () => ({
  default: {
    get: mocks.getAssignments,
  },
}));

vi.mock('../../api/teamService', () => ({
  teamService: {
    getTeamsByEvent: mocks.getTeamsByEvent,
  },
}));

vi.mock('../../api/trackService', () => ({
  trackService: {
    getTracksByEvent: mocks.getTracksByEvent,
  },
}));

vi.mock('../../api/scoreService', () => ({
  submissionService: {
    getSubmission: vi.fn(),
  },
  scoreService: {
    getScoresByJudge: vi.fn(),
  },
}));

const EVENT = { id: 7, name: 'SEAL Hackathon Spring 2026', status: 'ONGOING' };
const TRACK = { id: 21, name: 'Track A - Medical RAG' };

/** Shape returned by GET /api/v1/users/me/assignments (ExpertAssignmentResponse). */
const judgeAssignment = {
  id: 'JUDGE-1', eventId: 7, eventName: EVENT.name,
  trackId: 21, trackName: TRACK.name,
  teamId: null, teamName: null, role: 'JUDGE', scoringCompleted: false,
};
const mentorAssignment = {
  id: 'MENTOR-3', eventId: 7, eventName: EVENT.name,
  trackId: 22, trackName: 'Track B - Triage',
  teamId: 3, teamName: 'Team Neuron', role: 'MENTOR', scoringCompleted: null,
};

const renderDashboard = (role, name) => {
  localStorage.setItem('userRole', role);
  localStorage.setItem('userName', name);
  localStorage.setItem('userEmail', `${role.toLowerCase()}@seal-hms.local`);
  localStorage.setItem('userId', '3');

  return render(
    <MemoryRouter>
      <ExpertDashboard />
    </MemoryRouter>
  );
};

const switchTo = async (tabName) => {
  const tab = screen.getByRole('button', { name: tabName });
  await userEvent.click(tab);
  return tab;
};

describe('ExpertDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(mocks).forEach(m => m.mockReset());
    mocks.getAssignedEvents.mockResolvedValue({ data: [] });
    mocks.getAssignments.mockResolvedValue({ data: { data: [] } });
    mocks.getTeamsByEvent.mockResolvedValue({ data: [] });
    mocks.getTracksByEvent.mockResolvedValue({ data: [TRACK] });
    mocks.getEventRounds.mockResolvedValue({ data: [] });
  });

  it('renders the event operations home for STAFF', async () => {
    renderDashboard('STAFF', 'Demo Event Staff');

    expect(screen.getByRole('heading', { name: 'Event operations workspace' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No operations assignments yet' })).toBeInTheDocument();
    expect(screen.getByText('Staff assignments')).toBeInTheDocument();
  });

  /** Regression: the Staff block used to sit inside `if (roles.includes('Judge'))`. */
  it('lists an event workspace for STAFF once an event is assigned', async () => {
    mocks.getAssignedEvents.mockResolvedValue({ data: [EVENT] });
    renderDashboard('STAFF', 'Demo Event Staff');

    expect(await screen.findByRole('heading', { name: EVENT.name })).toBeInTheDocument();
    // A metric label only the staff card renders.
    expect(screen.getByText('Management access')).toBeInTheDocument();
  });

  it('lets a LECTURER switch between judging and mentoring work', async () => {
    renderDashboard('LECTURER', 'Demo Lecturer');

    expect(screen.getByRole('heading', { name: 'Academic expert workspace' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No judging assignments yet' })).toBeInTheDocument();

    const mentoringTab = await switchTo('Mentoring');

    expect(screen.getByText('Mentor assignments')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No mentoring assignments yet' })).toBeInTheDocument();
    expect(mentoringTab).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a judge-only lecturer a workspace under Judging and nothing under Mentoring', async () => {
    mocks.getAssignedEvents.mockResolvedValue({ data: [EVENT] });
    mocks.getAssignments.mockResolvedValue({ data: { data: [judgeAssignment] } });

    renderDashboard('LECTURER', 'Demo Lecturer');

    expect(await screen.findByRole('heading', { name: EVENT.name })).toBeInTheDocument();
    expect(screen.getByText(TRACK.name)).toBeInTheDocument();

    await switchTo('Mentoring');

    expect(screen.getByRole('heading', { name: 'No mentoring assignments yet' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: EVENT.name })).not.toBeInTheDocument();
  });

  it('shows a mentor-only lecturer a workspace under Mentoring and nothing under Judging', async () => {
    mocks.getAssignedEvents.mockResolvedValue({ data: [EVENT] });
    mocks.getAssignments.mockResolvedValue({ data: { data: [mentorAssignment] } });

    renderDashboard('LECTURER', 'Demo Lecturer');

    // Judging is the landing tab and must stay empty for a mentor-only lecturer.
    expect(await screen.findByRole('heading', { name: 'No judging assignments yet' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: EVENT.name })).not.toBeInTheDocument();

    await switchTo('Mentoring');

    expect(screen.getByRole('heading', { name: EVENT.name })).toBeInTheDocument();
    expect(screen.getByText('Team Neuron')).toBeInTheDocument();
  });

  /**
   * Judging one track and mentoring a team in a different track is allowed — the
   * conflict rule only bars judging the track that holds a team you mentor.
   */
  it('shows both workspaces when a lecturer judges one track and mentors a team in another', async () => {
    mocks.getAssignedEvents.mockResolvedValue({ data: [EVENT] });
    mocks.getAssignments.mockResolvedValue({
      data: { data: [judgeAssignment, mentorAssignment] },
    });

    renderDashboard('LECTURER', 'Demo Lecturer');

    expect(await screen.findByRole('heading', { name: EVENT.name })).toBeInTheDocument();
    expect(screen.getByText(TRACK.name)).toBeInTheDocument();

    await switchTo('Mentoring');

    expect(screen.getByRole('heading', { name: EVENT.name })).toBeInTheDocument();
    expect(screen.getByText('Team Neuron')).toBeInTheDocument();
  });
});
