package com.fpt.seal.hms;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;

@Disabled("Utility script, not a unit test: needs a live PostgreSQL/Spring context. Run manually from the IDE to reset a password.")
@SpringBootTest
public class ResetPass {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void reset() {
        String[] emails = {"alpha1_member1@example.com", "alpha2_member1@example.com", "alpha1_member2@example.com", "alpha2_member2@example.com"};
        for (String email : emails) {
            Account account = accountRepository.findByEmail(email).orElse(null);
            if (account != null) {
                System.out.println("Found account: " + account.getEmail());
                account.setPassword(passwordEncoder.encode("123456"));
                accountRepository.save(account);
                System.out.println("PASSWORD_RESET_SUCCESSFUL to '123456'");
            }
        }
    }
}
