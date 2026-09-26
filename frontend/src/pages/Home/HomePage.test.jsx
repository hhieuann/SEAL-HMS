import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import LanguageProvider from '../../i18n/LanguageProvider';
import HomePage from './HomePage';

vi.mock('../../api/apiClient', () => ({ default: { get: vi.fn() } }));

const renderHome = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    </MemoryRouter>
  );

const heroTitle = () => screen.getByRole('heading', { level: 1 });

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
    apiClient.get.mockReset();
    apiClient.get.mockResolvedValue({ data: { data: [] } });
  });

  it('opens on the newest season and switches with the season tabs', async () => {
    renderHome();
    expect(heroTitle()).toHaveTextContent('SEAL Hackathon Summer 2026');

    await userEvent.click(screen.getByRole('button', { name: 'Spring 2026' }));
    expect(heroTitle()).toHaveTextContent('SEAL Hackathon Spring 2026');

    await userEvent.click(screen.getByRole('button', { name: 'Mùa giải sau' }));
    expect(heroTitle()).toHaveTextContent('SEAL Hackathon Fall 2025');
  });

  it('switches to English and remembers the choice', async () => {
    renderHome();
    expect(screen.getAllByRole('link', { name: 'Sự kiện đã qua' }).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getAllByRole('link', { name: 'Past events' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('seal_lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('filters past seasons by year', async () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 3, name: 'SEAL Hackathon Summer 2026' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '2025' }));

    expect(screen.getByRole('heading', { level: 3, name: 'SEAL Hackathon Fall 2025' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'SEAL Hackathon Summer 2026' })).not.toBeInTheDocument();
  });

  it('advertises the next scheduled event from the API', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: [
          { id: 1, name: 'SEAL Hackathon Spring 2026', status: 'COMPLETED', startDate: '2026-04-11' },
          {
            id: 2,
            name: 'SEAL Hackathon Fall 2099',
            status: 'UPCOMING',
            registrationOpen: true,
            registrationStartDate: '2099-09-01',
            registrationEndDate: '2099-09-30',
            startDate: '2099-10-10',
            endDate: '2099-10-11',
            maxTeams: 24,
          },
        ],
      },
    });
    renderHome();

    expect(await screen.findByText('SEAL Hackathon Fall 2099 đang mở đăng ký')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'SEAL Hackathon Fall 2099' })).toBeInTheDocument();
    expect(screen.getByText('Đăng ký: 01 – 30/09/2099')).toBeInTheDocument();
    expect(screen.getByText('Tối đa 24 đội')).toBeInTheDocument();
  });

  it('falls back to "announced soon" when the API has nothing or is down', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'));
    renderHome();

    expect(await screen.findByRole('heading', { name: 'Mùa giải mới sẽ sớm được công bố' })).toBeInTheDocument();
    expect(screen.queryByText(/đang mở đăng ký/)).not.toBeInTheDocument();
  });
});
