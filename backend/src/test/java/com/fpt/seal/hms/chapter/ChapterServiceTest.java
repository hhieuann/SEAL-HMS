package com.fpt.seal.hms.chapter;

import com.fpt.seal.hms.chapter.dto.ChapterLeaderboardEntry;
import com.fpt.seal.hms.chapter.dto.ChapterRequest;
import com.fpt.seal.hms.chapter.dto.ChapterResponse;
import com.fpt.seal.hms.chapter.entity.Chapter;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChapterServiceTest {

    @Mock private ChapterRepository chapterRepository;
    @Mock private TeamRepository teamRepository;
    @InjectMocks private ChapterService chapterService;

    private Chapter chapter(long id, String name, int bonus) {
        Chapter c = new Chapter();
        c.setId(id);
        c.setName(name);
        c.setBonusPoint(bonus);
        return c;
    }

    private Team team(Chapter c, Integer eventRank) {
        Team t = new Team();
        t.setChapter(c);
        t.setEventRank(eventRank);
        return t;
    }

    private Team teamInYear(Chapter c, Integer eventRank, int year) {
        Team t = team(c, eventRank);
        com.fpt.seal.hms.event.entity.Event e = new com.fpt.seal.hms.event.entity.Event();
        e.setEndDate(java.time.LocalDate.of(year, 6, 15));
        t.setEvent(e);
        return t;
    }

    // ---------- placement bonus rule ----------

    @Test
    void placementBonus_champion20_runnerUp15_third10_else0() {
        assertThat(ChapterService.placementBonus(1)).isEqualTo(20);
        assertThat(ChapterService.placementBonus(2)).isEqualTo(15);
        assertThat(ChapterService.placementBonus(3)).isEqualTo(10);
        assertThat(ChapterService.placementBonus(4)).isZero();
        assertThat(ChapterService.placementBonus(null)).isZero();
    }

    // ---------- leaderboard ----------

    @Test
    void leaderboard_sumsPlacementBonusesAcrossTeams() {
        Chapter alpha = chapter(1L, "Alpha", 0);
        Chapter beta = chapter(2L, "Beta", 0);
        when(chapterRepository.findAll()).thenReturn(List.of(alpha, beta));
        // Alpha: a champion (20) + a third (10) = 30 ; Beta: a runner-up (15) = 15
        when(teamRepository.findByChapterIsNotNull()).thenReturn(List.of(
                team(alpha, 1), team(alpha, 3), team(beta, 2), team(alpha, 8)));

        List<ChapterLeaderboardEntry> board = chapterService.getLeaderboard();

        assertThat(board).extracting(ChapterLeaderboardEntry::chapterName, ChapterLeaderboardEntry::totalPoints,
                        ChapterLeaderboardEntry::rank)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Alpha", 30, 1),
                        org.assertj.core.groups.Tuple.tuple("Beta", 15, 2));
        assertThat(board.get(0).teamCount()).isEqualTo(3); // 3 ranked teams (rank 8 still counts as participated)
    }

    @Test
    void leaderboard_denseRanking_tiesShareRank_nextIsPlusOne() {
        Chapter a = chapter(1L, "A", 0), b = chapter(2L, "B", 0), c = chapter(3L, "C", 0);
        when(chapterRepository.findAll()).thenReturn(List.of(a, b, c));
        // A and B both total 20 (each a champion); C totals 10 (a third)
        when(teamRepository.findByChapterIsNotNull()).thenReturn(List.of(
                team(a, 1), team(b, 1), team(c, 3)));

        List<ChapterLeaderboardEntry> board = chapterService.getLeaderboard();

        // A=20 rank1, B=20 rank1, C=10 rank2  (dense: next lower total is rank 2, not 3)
        assertThat(board).extracting(ChapterLeaderboardEntry::totalPoints, ChapterLeaderboardEntry::rank)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(20, 1),
                        org.assertj.core.groups.Tuple.tuple(20, 1),
                        org.assertj.core.groups.Tuple.tuple(10, 2));
    }

    @Test
    void leaderboard_includesManualBonusPointAdjustment() {
        Chapter a = chapter(1L, "A", 5); // manual +5 on top of placements
        when(chapterRepository.findAll()).thenReturn(List.of(a));
        when(teamRepository.findByChapterIsNotNull()).thenReturn(List.of(team(a, 1))); // +20

        List<ChapterLeaderboardEntry> board = chapterService.getLeaderboard();

        assertThat(board.get(0).totalPoints()).isEqualTo(25); // 20 + 5
    }

    @Test
    void leaderboard_chapterWithNoRankedTeams_stillListedWithZero() {
        Chapter a = chapter(1L, "A", 0);
        when(chapterRepository.findAll()).thenReturn(List.of(a));
        when(teamRepository.findByChapterIsNotNull()).thenReturn(List.of(team(a, null))); // no final rank

        List<ChapterLeaderboardEntry> board = chapterService.getLeaderboard();

        assertThat(board).hasSize(1);
        assertThat(board.get(0).totalPoints()).isZero();
        assertThat(board.get(0).teamCount()).isZero(); // null rank not counted as participated
    }

    @Test
    void leaderboard_countsOnlyCurrentYearEvents() {
        int thisYear = java.time.Year.now().getValue();
        Chapter a = chapter(1L, "A", 0);
        when(chapterRepository.findAll()).thenReturn(List.of(a));
        // champion this year (+20) counts; champion last year (+20) must NOT carry over
        when(teamRepository.findByChapterIsNotNull()).thenReturn(List.of(
                teamInYear(a, 1, thisYear), teamInYear(a, 1, thisYear - 1)));

        List<ChapterLeaderboardEntry> board = chapterService.getLeaderboard();

        assertThat(board.get(0).totalPoints()).isEqualTo(20); // only this year's champion
        assertThat(board.get(0).teamCount()).isEqualTo(1);
    }

    @Test
    void isFromYear_usesEndDate_fallsBackToStart_andIncludesWhenUnknown() {
        int y = 2026;
        Chapter c = chapter(1L, "C", 0);

        Team withEnd = team(c, 1);
        com.fpt.seal.hms.event.entity.Event e1 = new com.fpt.seal.hms.event.entity.Event();
        e1.setEndDate(java.time.LocalDate.of(y, 3, 1));
        withEnd.setEvent(e1);
        assertThat(ChapterService.isFromYear(withEnd, y)).isTrue();
        assertThat(ChapterService.isFromYear(withEnd, y + 1)).isFalse();

        Team startOnly = team(c, 1);
        com.fpt.seal.hms.event.entity.Event e2 = new com.fpt.seal.hms.event.entity.Event();
        e2.setStartDate(java.time.LocalDate.of(y, 1, 1)); // no end date -> use start
        startOnly.setEvent(e2);
        assertThat(ChapterService.isFromYear(startOnly, y)).isTrue();

        Team noDates = team(c, 1);
        noDates.setEvent(new com.fpt.seal.hms.event.entity.Event()); // unknown -> included
        assertThat(ChapterService.isFromYear(noDates, y)).isTrue();

        Team noEvent = team(c, 1); // no event at all -> included
        assertThat(ChapterService.isFromYear(noEvent, y)).isTrue();
    }

    @Test
    void leaderboard_empty_whenNoChapters() {
        when(chapterRepository.findAll()).thenReturn(List.of());
        when(teamRepository.findByChapterIsNotNull()).thenReturn(List.of());

        assertThat(chapterService.getLeaderboard()).isEmpty();
    }

    // ---------- CRUD ----------

    @Test
    void createChapter_keepsProvidedBonus() {
        when(chapterRepository.save(any(Chapter.class))).thenAnswer(inv -> {
            Chapter c = inv.getArgument(0);
            c.setId(10L);
            return c;
        });

        ChapterResponse res = chapterService.createChapter(new ChapterRequest("FPT Da Nang", 8));

        assertThat(res.name()).isEqualTo("FPT Da Nang");
        assertThat(res.bonusPoint()).isEqualTo(8); // explicit bonus kept as-is
    }

    @Test
    void createChapter_defaultsBonusToZero_whenNull() {
        when(chapterRepository.save(any(Chapter.class))).thenAnswer(inv -> {
            Chapter c = inv.getArgument(0);
            c.setId(9L);
            return c;
        });

        ChapterResponse res = chapterService.createChapter(new ChapterRequest("FPT HCM", null));

        assertThat(res.name()).isEqualTo("FPT HCM");
        assertThat(res.bonusPoint()).isZero();
    }

    @Test
    void updateChapter_throws_whenMissing() {
        when(chapterRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chapterService.updateChapter(9L, new ChapterRequest("X", 0)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateChapter_changesNameAndBonus_whenBonusProvided() {
        Chapter existing = chapter(1L, "Old name", 5);
        when(chapterRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(chapterRepository.save(any(Chapter.class))).thenAnswer(inv -> inv.getArgument(0));

        ChapterResponse res = chapterService.updateChapter(1L, new ChapterRequest("New name", -3));

        assertThat(res.name()).isEqualTo("New name");
        assertThat(res.bonusPoint()).isEqualTo(-3); // negative adjustment applied
    }

    @Test
    void updateChapter_keepsExistingBonus_whenBonusOmitted() {
        Chapter existing = chapter(1L, "Old name", 7);
        when(chapterRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(chapterRepository.save(any(Chapter.class))).thenAnswer(inv -> inv.getArgument(0));

        ChapterResponse res = chapterService.updateChapter(1L, new ChapterRequest("Renamed", null));

        assertThat(res.name()).isEqualTo("Renamed");
        assertThat(res.bonusPoint()).isEqualTo(7); // untouched when the request omits it
    }

    @Test
    void leaderboard_nullBonusPoint_treatedAsZero() {
        Chapter a = chapter(1L, "A", 0);
        a.setBonusPoint(null); // legacy row with no bonus set
        when(chapterRepository.findAll()).thenReturn(List.of(a));
        when(teamRepository.findByChapterIsNotNull()).thenReturn(List.of(team(a, 2))); // +15

        List<ChapterLeaderboardEntry> board = chapterService.getLeaderboard();

        assertThat(board.get(0).totalPoints()).isEqualTo(15); // null base counted as 0
    }

    @Test
    void leaderboard_ignoresTeamWhoseChapterIsNoLongerListed() {
        Chapter listed = chapter(1L, "Listed", 0);
        Chapter removed = chapter(99L, "Removed", 0); // not returned by findAll
        when(chapterRepository.findAll()).thenReturn(List.of(listed));
        when(teamRepository.findByChapterIsNotNull()).thenReturn(List.of(
                team(listed, 1), team(removed, 1))); // the orphan must be skipped

        List<ChapterLeaderboardEntry> board = chapterService.getLeaderboard();

        assertThat(board).hasSize(1);
        assertThat(board.get(0).chapterName()).isEqualTo("Listed");
        assertThat(board.get(0).totalPoints()).isEqualTo(20); // only the listed chapter's champion
    }

    @Test
    void deleteChapter_throws_whenMissing() {
        when(chapterRepository.existsById(9L)).thenReturn(false);

        assertThatThrownBy(() -> chapterService.deleteChapter(9L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(chapterRepository, never()).deleteById(any());
    }

    @Test
    void deleteChapter_deletes_whenExists() {
        when(chapterRepository.existsById(1L)).thenReturn(true);

        chapterService.deleteChapter(1L);

        verify(chapterRepository).deleteById(1L);
    }

    @Test
    void listChapters_mapsAll() {
        when(chapterRepository.findAll()).thenReturn(List.of(chapter(1L, "A", 0), chapter(2L, "B", 0)));

        assertThat(chapterService.listChapters()).extracting(ChapterResponse::name).containsExactly("A", "B");
    }
}
