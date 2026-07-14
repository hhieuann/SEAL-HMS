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

    @Column(precision = 8, scale = 2)
    private BigDecimal score;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "penalty_points", precision = 8, scale = 2)
    private BigDecimal penaltyPoints = BigDecimal.ZERO;

    @Column(name = "penalty_reason")
    private String penaltyReason;

    @Column(name = "is_promoted", nullable = false)
    private Boolean isPromoted = false;
}
