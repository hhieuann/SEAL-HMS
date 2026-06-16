package com.fpt.seal.hms.chapter.entity;

import com.fpt.seal.hms.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "chapter")
@Getter
@Setter
@NoArgsConstructor
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chapter_id")
    private Long id;

    @Column(name = "chapter_name", length = 150, nullable = false)
    private String name;

    @Column(name = "bonus_point", nullable = false)
    private Integer bonusPoint = 0;
}
