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
    void leaderboard_empty_whenNoChapters() {
        when(chapterRepository.findAll()).thenReturn(List.of());
        when(teamRepository.findByChapterIsNotNull()).thenReturn(List.of());

        assertThat(chapterService.getLeaderboard()).isEmpty();
    }

    // ---------- CRUD ----------

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
