package com.fpt.seal.hms.auditlog;

import com.fpt.seal.hms.auditlog.entity.AuditLog;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Records important admin/staff actions (account approval, round transition, prize
 * award...). The actor is read from the security context so callers only pass what
 * happened. Failures are swallowed — an audit hiccup must never break the action itself.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public void log(String action, String entityType, Long entityId, String detail) {
        try {
            AuditLog entry = new AuditLog();
            entry.setActorEmail(currentActor());
            entry.setAction(action);
            entry.setEntityType(entityType);
            entry.setEntityId(entityId);
            entry.setDetail(detail);
            entry.setCreatedAt(LocalDateTime.now());
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Audit log failed for action {}: {}", action, e.getMessage());
        }
    }

    private String currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
