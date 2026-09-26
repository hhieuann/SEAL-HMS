import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LanguageProvider from '../../i18n/LanguageProvider';
import SeasonDetail from './SeasonDetail';

const renderSeason = (slug) =>
  render(
    <MemoryRouter initialEntries={[`/seasons/${slug}`]}>
      <LanguageProvider>
        <Routes>
          <Route path="/seasons/:slug" element={<SeasonDetail />} />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>
  );

describe('SeasonDetail', () => {
  beforeEach(() => {
    localStorage.clear();
    window.scrollTo = vi.fn();
  });

  it('shows the Summer 2026 recap with its finalists and prizes', () => {
    renderSeason('summer-2026');

    expect(screen.getByRole('heading', { level: 1, name: 'SEAL Hackathon Summer 2026' })).toBeInTheDocument();
    expect(screen.getByText(/AI-Driven Smart Operations/)).toBeInTheDocument();
    expect(screen.getByText('15 – 16/08/2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '6 đội vào vòng chung kết' })).toBeInTheDocument();
    ['Open to work', 'CharIOT', 'Ae Miền Trung', 'VETERAN', 'KHTN', 'Bridge'].forEach((team) => {
      expect(screen.getByText(team)).toBeInTheDocument();
    });
    expect(screen.getByText('7.000.000đ')).toBeInTheDocument();
  });

  it('renders in English after switching language', async () => {
    renderSeason('summer-2026');
    await userEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByText('15–16 Aug 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '6 teams in the finals' })).toBeInTheDocument();
    expect(screen.getByText('7,000,000 VND')).toBeInTheDocument();
  });

  it('lists the Spring 2026 judging criteria', () => {
    renderSeason('spring-2026');
    expect(screen.getByRole('heading', { name: 'Tiêu chí chấm điểm' })).toBeInTheDocument();
    expect(screen.getByText('Kiến trúc Agentic RAG & giải thuật')).toBeInTheDocument();
  });

  it('says details are coming for a season with no records yet', () => {
    renderSeason('fall-2025');
    expect(screen.getByText('Thông tin chi tiết của mùa giải này đang được cập nhật.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Kết quả chung cuộc' })).not.toBeInTheDocument();
  });

  it('shows a not-found message for an unknown season', () => {
    renderSeason('winter-1999');
    expect(screen.getByRole('heading', { name: 'Không tìm thấy mùa giải' })).toBeInTheDocument();
  });
});
