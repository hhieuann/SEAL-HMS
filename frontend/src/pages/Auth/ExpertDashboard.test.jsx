import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ExpertDashboard from './ExpertDashboard';

const mocks = vi.hoisted(() => ({
  getAssignedEvents: vi.fn(),
  getAssignments: vi.fn(),
}));

vi.mock('../../api/eventService', () => ({
  eventService: {
    getAssignedEvents: mocks.getAssignedEvents,
  },
}));

vi.mock('../../api/apiClient', () => ({
  default: {
    get: mocks.getAssignments,
  },
}));

vi.mock('../../api/teamService', () => ({
  teamService: {
    getTeamsByEvent: vi.fn(),
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

describe('ExpertDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.getAssignedEvents.mockReset();
    mocks.getAssignments.mockReset();
    mocks.getAssignedEvents.mockResolvedValue({ data: [] });
    mocks.getAssignments.mockResolvedValue({ data: { data: [] } });
  });

  it('renders the event operations home for STAFF', async () => {
    renderDashboard('STAFF', 'Demo Event Staff');

    expect(screen.getByRole('heading', { name: 'Event operations workspace' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No operations assignments yet' })).toBeInTheDocument();
    expect(screen.getByText('Staff assignments')).toBeInTheDocument();
  });

  it('renders the evaluation home for JUDGE', async () => {
    renderDashboard('JUDGE', 'Demo Judge');

    expect(screen.getByRole('heading', { name: 'Evaluation workspace' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No judging assignments yet' })).toBeInTheDocument();
    expect(screen.getByText('Judge assignments')).toBeInTheDocument();
  });

  it('lets a LECTURER switch between judging and mentoring work', async () => {
    renderDashboard('LECTURER', 'Demo Lecturer');

    expect(screen.getByRole('heading', { name: 'Academic expert workspace' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No judging assignments yet' })).toBeInTheDocument();

    const mentoringTab = screen.getByRole('button', { name: 'Mentoring' });
    await userEvent.click(mentoringTab);

    expect(screen.getByText('Mentor assignments')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No mentoring assignments yet' })).toBeInTheDocument();
    expect(mentoringTab).toHaveAttribute('aria-pressed', 'true');
  });
});
