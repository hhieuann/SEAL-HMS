package com.fpt.seal.hms.demo;

import com.fpt.seal.hms.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Seeds and removes demo data, so a walkthrough can start from a populated event.
 *
 * Guarded twice over. {@code @ConditionalOnProperty} means the bean — and therefore the route —
 * only exists when {@code app.demo.enabled=true}, which it is not by default; on a normal
 * deployment these paths simply 404. On top of that the caller must be an ADMIN. Role alone
 * would not be enough for an endpoint that creates accounts and bulk data.
 */
@RestController
@RequestMapping("/api/v1/admin/demo")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
public class DemoController {

    private final DemoDataService demoDataService;

    /** Build a demo event, up to whichever stage was asked for. */
    @PostMapping("/seed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DemoSeedResult>> seed(@Valid @RequestBody(required = false) DemoSeedRequest request) {
        DemoSeedResult result = demoDataService.seed(request != null ? request : new DemoSeedRequest());
        return ResponseEntity.ok(ApiResponse.ok("Demo data created", result));
    }

    /** Remove every demo event and demo account. Real data is untouched. */
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DemoPurgeResult>> purge() {
        return ResponseEntity.ok(ApiResponse.ok("Demo data removed", demoDataService.purge()));
    }
}
