package com.fpt.seal.hms.prize.entity;

import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.team.entity.Team;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "prize")
@Getter
@Setter
@NoArgsConstructor
public class Prize {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prize_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // Null until the prize is awarded to a team.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(length = 150)
    private String name;

    // The placing this prize is for (1 = first place, ...). Drives auto-award by ranking.
    private Integer rank;

    @Column(precision = 12, scale = 2)
    private BigDecimal value;

    @Column(name = "prize_type", length = 50)
    private String prizeType;
}
