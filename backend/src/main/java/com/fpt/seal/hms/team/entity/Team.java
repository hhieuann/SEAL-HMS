package com.fpt.seal.hms.team.entity;

import com.fpt.seal.hms.chapter.entity.Chapter;
import com.fpt.seal.hms.common.entity.BaseEntity;
import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.lecturer.Lecturer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "team")
@Getter
@Setter
@NoArgsConstructor
public class Team extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "team_id")
    private Long id;

    @Column(name = "is_disqualified", nullable = false)
    private Boolean isDisqualified = false;

    @Column(name = "disqualification_reason", columnDefinition = "TEXT")
    private String disqualificationReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private com.fpt.seal.hms.event.entity.Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id")
    private Track track;

    @Column(length = 150, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TeamStatus status = TeamStatus.CREATED;

    @Column(name = "event_score", precision = 8, scale = 2)
    private BigDecimal eventScore;

    @Column(name = "event_rank")
    private Integer eventRank;

    @org.hibernate.annotations.Formula("(SELECT count(*) FROM team_member tm WHERE tm.team_id = team_id AND tm.status = 'ACCEPTED')")
    private Integer memberCount;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "team_mentor",
            joinColumns = @JoinColumn(name = "team_id"),
            inverseJoinColumns = @JoinColumn(name = "lecturer_id")
    )
    private Set<Lecturer> mentors = new HashSet<>();
}
