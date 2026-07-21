package com.fpt.seal.hms.announcement;

import com.fpt.seal.hms.announcement.dto.AnnouncementRequest;
import com.fpt.seal.hms.announcement.dto.AnnouncementResponse;
import com.fpt.seal.hms.announcement.entity.Announcement;
import com.fpt.seal.hms.auditlog.AuditLogService;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fpt.seal.hms.trackassignment.TrackAssignmentRepository;
import com.fpt.seal.hms.trackassignment.TrackAssignment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import java.util.stream.Collectors;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final EventRepository eventRepository;
    private final AuditLogService auditLogService;
    private final TrackAssignmentRepository trackAssignmentRepository;

    @Transactional
    public AnnouncementResponse create(String authorEmail, AnnouncementRequest req) {
        Announcement a = new Announcement();
        a.setTitle(req.title());
        a.setContent(req.content());
        a.setCreatedByEmail(authorEmail);
        a.setEvent(resolveEvent(req.eventId()));
        a.setTargetRole(req.targetRole() != null ? req.targetRole() : "ALL");
        Announcement saved = announcementRepository.save(a);
        auditLogService.log("ANNOUNCEMENT_CREATED", "announcement", saved.getId(), saved.getTitle());
        return AnnouncementResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> list(Long eventId, Authentication auth) {
        List<Announcement> items = (eventId == null)
                ? announcementRepository.findAllByOrderByCreatedAtDesc()
                : announcementRepository.findByEventIdOrEventIsNullOrderByCreatedAtDesc(eventId);

        boolean isAdminOrStaff = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));

        if (!isAdminOrStaff) {
            String role = auth.getAuthorities().stream().findFirst().map(GrantedAuthority::getAuthority).orElse("");
            items = items.stream().filter(a -> {
                if ("ALL".equalsIgnoreCase(a.getTargetRole()) || a.getTargetRole() == null) return true;
                
                if (role.equals("ROLE_STUDENT") && "STUDENT".equalsIgnoreCase(a.getTargetRole())) return true;
                if (role.equals("ROLE_GUEST_JUDGE") && "JUDGE".equalsIgnoreCase(a.getTargetRole())) return true;
                
                if (role.equals("ROLE_LECTURER")) {
                    if ("LECTURER".equalsIgnoreCase(a.getTargetRole())) return true;
                    // Check assignments for this lecturer
                    if (eventId != null) {
                        List<TrackAssignment> assignments = trackAssignmentRepository.findByLecturer_Account_Email(auth.getName())
                                .stream().filter(ta -> ta.getTrack() != null && ta.getTrack().getEvent() != null && ta.getTrack().getEvent().getId().equals(eventId)).toList();
                        boolean isMentor = assignments.stream().anyMatch(ta -> ta.getRole().name().equals("MENTOR"));
                        boolean isJudge = assignments.stream().anyMatch(ta -> ta.getRole().name().equals("JUDGE"));
                        if (isMentor && "MENTOR".equalsIgnoreCase(a.getTargetRole())) return true;
                        if (isJudge && "JUDGE".equalsIgnoreCase(a.getTargetRole())) return true;
                    }
                }
                return false;
            }).toList();
        }

        return items.stream().map(AnnouncementResponse::from).toList();
    }

    @Transactional
    public AnnouncementResponse update(Long id, AnnouncementRequest req) {
        Announcement a = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found: " + id));
        a.setTitle(req.title());
        a.setContent(req.content());
        a.setEvent(resolveEvent(req.eventId()));
        auditLogService.log("ANNOUNCEMENT_UPDATED", "announcement", a.getId(), a.getTitle());
        return AnnouncementResponse.from(a);
    }

    @Transactional
    public void delete(Long id) {
        if (!announcementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Announcement not found: " + id);
        }
        announcementRepository.deleteById(id);
        auditLogService.log("ANNOUNCEMENT_DELETED", "announcement", id, null);
    }

    private Event resolveEvent(Long eventId) {
        if (eventId == null) {
            return null; // global announcement
        }
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
    }
}
