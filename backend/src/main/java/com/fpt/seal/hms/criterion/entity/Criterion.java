package com.fpt.seal.hms.criterion.entity;

import com.fpt.seal.hms.round.entity.Round;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "criterion")
@Getter
@Setter
@NoArgsConstructor
public class Criterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "criterion_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "round_id", nullable = false)
    private Round round;

    @Column(name = "criteria_name", length = 200)
    private String name;

    @Column(name = "max_score", precision = 6, scale = 2)
    private BigDecimal maxScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;
}
