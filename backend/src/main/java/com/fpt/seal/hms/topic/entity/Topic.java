package com.fpt.seal.hms.topic.entity;

import com.fpt.seal.hms.track.entity.Track;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "topic")
@Getter
@Setter
@NoArgsConstructor
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "topic_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id")
    private Track track;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private com.fpt.seal.hms.event.entity.Event event;

    @Column(name = "topic_name", length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;
}
