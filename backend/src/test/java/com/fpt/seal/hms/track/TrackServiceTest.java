package com.fpt.seal.hms.track;

import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.topic.TopicRepository;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.dto.TrackRequest;
import com.fpt.seal.hms.track.dto.TrackResponse;
import com.fpt.seal.hms.track.entity.Track;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrackServiceTest {

    @Mock private TrackRepository trackRepository;
    @Mock private EventRepository eventRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private TopicRepository topicRepository;
    @InjectMocks private TrackService trackService;

    private Event event(long id) {
        Event e = new Event();
        e.setId(id);
        return e;
    }

    private Track track(long id, Event e, String name) {
        Track t = new Track();
        t.setId(id);
        t.setEvent(e);
        t.setName(name);
        return t;
    }

    private TrackRequest request(String name, Integer max) {
        TrackRequest r = new TrackRequest();
        r.setName(name);
        r.setDescription("desc");
        r.setMaxTeams(max);
        return r;
    }

    @Test
    void createTrack_persistsUnderEvent() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event(1L)));
        when(trackRepository.save(any(Track.class))).thenAnswer(inv -> {
            Track t = inv.getArgument(0);
            t.setId(5L);
            return t;
        });

        TrackResponse res = trackService.createTrack(1L, request("AI", 4));

        assertThat(res.getName()).isEqualTo("AI");
        assertThat(res.getMaxTeams()).isEqualTo(4);
        assertThat(res.getEventId()).isEqualTo(1L);
    }

    @Test
    void createTrack_throws_whenEventMissing() {
        when(eventRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> trackService.createTrack(9L, request("X", null)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(trackRepository, never()).save(any());
    }

    @Test
    void updateTrack_changesFields() {
        Track existing = track(5L, event(1L), "Old");
        when(trackRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(trackRepository.save(any(Track.class))).thenAnswer(inv -> inv.getArgument(0));

        TrackResponse res = trackService.updateTrack(5L, request("New", 8));

        assertThat(res.getName()).isEqualTo("New");
        assertThat(res.getMaxTeams()).isEqualTo(8);
    }

    @Test
    void updateTrack_throws_whenMissing() {
        when(trackRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> trackService.updateTrack(9L, request("X", null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTrack_detachesTeamsAndTopics_thenDeletes() {
        Event e = event(1L);
        Track t = track(5L, e, "AI");
        Team onTrack = new Team();
        onTrack.setId(100L);
        onTrack.setTrack(t);
        Team otherTrack = new Team();
        otherTrack.setId(101L);
        otherTrack.setTrack(track(6L, e, "Web"));
        Topic topic = new Topic();
        topic.setId(200L);
        topic.setTrack(t);

        when(trackRepository.findById(5L)).thenReturn(Optional.of(t));
        when(teamRepository.findByEventId(1L)).thenReturn(List.of(onTrack, otherTrack));
        when(topicRepository.findByTrackId(5L)).thenReturn(List.of(topic));

        trackService.deleteTrack(5L);

        assertThat(onTrack.getTrack()).isNull();      // detached
        assertThat(otherTrack.getTrack()).isNotNull(); // untouched
        assertThat(topic.getTrack()).isNull();        // detached
        verify(teamRepository).save(onTrack);
        verify(teamRepository, never()).save(otherTrack);
        verify(topicRepository).save(topic);
        verify(trackRepository).delete(t);
    }
}
