package com.fpt.seal.hms.announcement.entity;

import com.fpt.seal.hms.common.entity.BaseEntity;
import com.fpt.seal.hms.event.entity.Event;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "announcement")
@Getter
@Setter
@NoArgsConstructor
public class Announcement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "announcement_id")
    private Long id;

    // Null = global notice visible outside any single event.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_by_email", length = 255)
    private String createdByEmail;

    @Column(name = "target_role", length = 50)
    private String targetRole = "ALL";
}
