package com.fpt.seal.hms.score.entity;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.criterion.entity.Criterion;
import com.fpt.seal.hms.submission.entity.Submission;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "score")
@Getter
@Setter
@NoArgsConstructor
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "score_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "judge_account_id", nullable = false)
    private Account judgeAccount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criterion_id", nullable = false)
    private Criterion criterion;

    @Column(precision = 6, scale = 2)
    private BigDecimal score;

    @Column(columnDefinition = "TEXT")
    private String comment;
}
