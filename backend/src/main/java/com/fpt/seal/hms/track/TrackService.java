package com.fpt.seal.hms.track;

import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.track.dto.TrackRequest;
import com.fpt.seal.hms.track.dto.TrackResponse;
import com.fpt.seal.hms.track.entity.Track;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrackService {

    private final TrackRepository trackRepository;
    private final EventRepository eventRepository;

    @Transactional(readOnly = true)
    public List<TrackResponse> getTracksByEventId(Long eventId) {
        return trackRepository.findByEventId(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TrackResponse getTrackById(Long id) {
        Track track = findTrackEntityById(id);
        return mapToResponse(track);
    }

    @Transactional
    public TrackResponse createTrack(Long eventId, TrackRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        Track track = new Track();
        track.setEvent(event);
        track.setName(request.getName());
        track.setDescription(request.getDescription());
        track.setMaxTeams(request.getMaxTeams());

        return mapToResponse(trackRepository.save(track));
    }

    @Transactional
    public TrackResponse updateTrack(Long id, TrackRequest request) {
        Track track = findTrackEntityById(id);

        track.setName(request.getName());
        track.setDescription(request.getDescription());
        track.setMaxTeams(request.getMaxTeams());

        return mapToResponse(trackRepository.save(track));
    }

    @Transactional
    public void deleteTrack(Long id) {
        Track track = findTrackEntityById(id);
        trackRepository.delete(track);
    }

    private Track findTrackEntityById(Long id) {
        return trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with id: " + id));
    }

    private TrackResponse mapToResponse(Track track) {
        TrackResponse response = new TrackResponse();
        response.setId(track.getId());
        response.setEventId(track.getEvent().getId());
        response.setName(track.getName());
        response.setDescription(track.getDescription());
        response.setMaxTeams(track.getMaxTeams());
        return response;
    }
}
