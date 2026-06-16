package com.fpt.seal.hms.submission.entity;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.common.entity.BaseEntity;
import com.fpt.seal.hms.common.enums.SubmissionStatus;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "submission")
@Getter
@Setter
@NoArgsConstructor
public class Submission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "round_ranking_id", nullable = false)
    private RoundRanking roundRanking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private Account submittedBy;

    @Column(name = "submission_name", length = 200)
    private String submissionName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "tech_stack_name", length = 200)
    private String techStackName;

    @Column(name = "github_url", length = 300)
    private String githubUrl;

    @Column(name = "demo_url", length = 300)
    private String demoUrl;

    @Column(name = "slide_url", length = 300)
    private String slideUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubmissionStatus status = SubmissionStatus.DRAFT;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
}
