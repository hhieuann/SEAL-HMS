package com.fpt.seal.hms.announcement;

import com.fpt.seal.hms.announcement.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findAllByOrderByCreatedAtDesc();
    // Event page shows its own notices plus the global ones.
    List<Announcement> findByEventIdOrEventIsNullOrderByCreatedAtDesc(Long eventId);
}
