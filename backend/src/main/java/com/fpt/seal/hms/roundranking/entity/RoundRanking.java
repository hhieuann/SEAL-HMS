package com.fpt.seal.hms.roundranking.entity;

import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.team.entity.Team;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "round_ranking")
@Getter
@Setter
@NoArgsConstructor
public class RoundRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "round_ranking_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "round_id", nullable = false)
    private Round round;

    /**
     * The weighted average of the judges' scores, before any adjustment. Written only by
     * scoring; keeping it lets a team be shown "88 - 5 = 83" instead of an unexplained 83.
     */
    @Column(name = "raw_score", precision = 8, scale = 2)
    private BigDecimal rawScore;

    /** rawScore - penaltyPoints + bonusPoints. Everything that ranks or displays reads this. */
    @Column(precision = 8, scale = 2)
    private BigDecimal score;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "penalty_points", precision = 8, scale = 2)
    private BigDecimal penaltyPoints = BigDecimal.ZERO;

    @Column(name = "penalty_reason")
    private String penaltyReason;

    @Column(name = "bonus_points", precision = 8, scale = 2)
    private BigDecimal bonusPoints = BigDecimal.ZERO;

    @Column(name = "bonus_reason")
    private String bonusReason;

    /**
     * Why this team was promoted ahead of another it tied with. Set only when a tie sat across
     * the promotion cut-off and a coordinator had to break it.
     */
    @Column(name = "tie_break_reason")
    private String tieBreakReason;

    @Column(name = "is_promoted", nullable = false)
    private Boolean isPromoted = false;

    /**
     * Single place the final score is derived, so scoring and adjustments can never disagree.
     */
    public void recomputeScore() {
        BigDecimal base = rawScore != null ? rawScore : BigDecimal.ZERO;
        BigDecimal penalty = penaltyPoints != null ? penaltyPoints : BigDecimal.ZERO;
        BigDecimal bonus = bonusPoints != null ? bonusPoints : BigDecimal.ZERO;
        this.score = base.subtract(penalty).add(bonus);
    }
}
