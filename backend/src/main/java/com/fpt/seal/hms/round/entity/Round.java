package com.fpt.seal.hms.round.entity;

import com.fpt.seal.hms.common.entity.BaseEntity;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.event.entity.Event;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "round")
@Getter
@Setter
@NoArgsConstructor
public class Round extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "round_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "round_name", length = 150)
    private String name;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "duration_hours")
    private Double durationHours;

    @Column(name = "promotion_top_n")
    private Integer promotionTopN;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoundStatus status = RoundStatus.CREATED;

    @Column(name = "round_seq", nullable = false)
    private Integer roundSeq = 1;
}
