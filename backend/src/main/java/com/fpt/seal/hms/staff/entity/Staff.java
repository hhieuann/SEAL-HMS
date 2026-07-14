package com.fpt.seal.hms.staff.entity;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "staff")
@Getter
@Setter
@NoArgsConstructor
public class Staff extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String campus;

    @Column(length = 20)
    private String phone;
}
