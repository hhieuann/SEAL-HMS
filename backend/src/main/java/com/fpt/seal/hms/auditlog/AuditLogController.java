package com.fpt.seal.hms.auditlog;

import com.fpt.seal.hms.auditlog.entity.AuditLog;
import com.fpt.seal.hms.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    /** Latest audit entries, newest first. Admin/Staff only. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<List<AuditLog>>> latest(
            @RequestParam(defaultValue = "100") int limit) {
        int size = Math.min(Math.max(limit, 1), 500);
        return ResponseEntity.ok(ApiResponse.ok(
                auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, size)).getContent()));
    }
}
