package com.fpt.seal.hms.chapter;

import com.fpt.seal.hms.chapter.dto.ChapterLeaderboardEntry;
import com.fpt.seal.hms.chapter.dto.ChapterRequest;
import com.fpt.seal.hms.chapter.dto.ChapterResponse;
import com.fpt.seal.hms.chapter.entity.Chapter;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Chapter management + the year-long Chapter Leaderboard.
 *
 * <p>A chapter accumulates bonus points from the event placements of the teams that opted
 * into it, across every hackathon of the year (a team keeps its {@code chapter} link and its
 * final {@code eventRank}). Placement bonuses: champion (rank 1) = 20, runner-up (2) = 15,
 * third (3) = 10, otherwise 0. The chapter's manual {@code bonusPoint} (default 0) is a
 * per-regulation adjustment added on top. Chapters are then dense-ranked by total points:
 * equal totals share a rank and the next lower total is the immediately following rank
 * (1, 1, 2, 3 …). Teams created without a chapter simply never appear here — they only get
 * their per-event ranking.
 */
@Service
@RequiredArgsConstructor
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final TeamRepository teamRepository;

    /**
     * Whether a team's event belongs to the given year. Uses the event end date (when
     * results are finalised), falling back to the start date. If neither is known the team
     * is included (we cannot prove it is from another year).
     */
    static boolean isFromYear(Team team, int year) {
        if (team.getEvent() == null) return true;
        java.time.LocalDate date = team.getEvent().getEndDate() != null
                ? team.getEvent().getEndDate() : team.getEvent().getStartDate();
        return date == null || date.getYear() == year;
    }

    /** Placement bonus for a team's final rank in its event. */
    static int placementBonus(Integer eventRank) {
        if (eventRank == null) return 0;
        return switch (eventRank) {
            case 1 -> 20;
            case 2 -> 15;
            case 3 -> 10;
            default -> 0;
        };
    }

    @Transactional(readOnly = true)
    public List<ChapterResponse> listChapters() {
        return chapterRepository.findAll().stream().map(ChapterResponse::from).toList();
    }

    @Transactional
    public ChapterResponse createChapter(ChapterRequest req) {
        Chapter c = new Chapter();
        c.setName(req.name());
        c.setBonusPoint(req.bonusPoint() != null ? req.bonusPoint() : 0);
        return ChapterResponse.from(chapterRepository.save(c));
    }

    @Transactional
    public ChapterResponse updateChapter(Long id, ChapterRequest req) {
        Chapter c = chapterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter not found: " + id));
        c.setName(req.name());
        if (req.bonusPoint() != null) c.setBonusPoint(req.bonusPoint());
        return ChapterResponse.from(chapterRepository.save(c));
    }

    @Transactional
    public void deleteChapter(Long id) {
        if (!chapterRepository.existsById(id)) {
            throw new ResourceNotFoundException("Chapter not found: " + id);
        }
        chapterRepository.deleteById(id);
    }

    /** Compute the dense-ranked Chapter Leaderboard across all events of the year. */
    @Transactional(readOnly = true)
    public List<ChapterLeaderboardEntry> getLeaderboard() {
        // Every chapter starts on the board (with its manual adjustment as the base).
        Map<Long, Chapter> chapters = new LinkedHashMap<>();
        Map<Long, Integer> totals = new LinkedHashMap<>();
        Map<Long, Integer> teamCounts = new LinkedHashMap<>();
        for (Chapter c : chapterRepository.findAll()) {
            chapters.put(c.getId(), c);
            totals.put(c.getId(), c.getBonusPoint() != null ? c.getBonusPoint() : 0);
            teamCounts.put(c.getId(), 0);
        }

        // Accumulate placement bonuses from each chapter-affiliated team's event result,
        // counting only events of the CURRENT year so points do not carry over between years.
        int currentYear = java.time.Year.now().getValue();
        for (Team team : teamRepository.findByChapterIsNotNull()) {
            Long cid = team.getChapter().getId();
            if (!totals.containsKey(cid)) continue; // defensive: chapter deleted
            if (!isFromYear(team, currentYear)) continue; // different year -> not counted
            int bonus = placementBonus(team.getEventRank());
            totals.merge(cid, bonus, Integer::sum);
            if (team.getEventRank() != null) {
                teamCounts.merge(cid, 1, Integer::sum);
            }
        }

        // Sort by total desc, then name for stable output.
        List<Long> ordered = new ArrayList<>(chapters.keySet());
        ordered.sort(Comparator
                .comparingInt((Long id) -> totals.get(id)).reversed()
                .thenComparing(id -> chapters.get(id).getName(), Comparator.nullsLast(String::compareTo)));

        // Dense ranking: same total -> same rank; next lower total -> rank + 1.
        List<ChapterLeaderboardEntry> board = new ArrayList<>();
        int rank = 0;
        Integer prevTotal = null;
        for (Long id : ordered) {
            int total = totals.get(id);
            if (prevTotal == null || total != prevTotal) {
                rank++;
                prevTotal = total;
            }
            Chapter c = chapters.get(id);
            board.add(new ChapterLeaderboardEntry(rank, id, c.getName(), total, teamCounts.get(id)));
        }
        return board;
    }
}
