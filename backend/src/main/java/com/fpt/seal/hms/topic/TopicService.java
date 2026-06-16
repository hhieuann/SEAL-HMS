package com.fpt.seal.hms.topic;

import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.topic.dto.TopicRequest;
import com.fpt.seal.hms.topic.dto.TopicResponse;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final TopicRepository topicRepository;
    private final TrackRepository trackRepository;

    @Transactional(readOnly = true)
    public List<TopicResponse> getTopicsByTrackId(Long trackId) {
        return topicRepository.findByTrackId(trackId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TopicResponse getTopicById(Long id) {
        Topic topic = findTopicEntityById(id);
        return mapToResponse(topic);
    }

    @Transactional
    public TopicResponse createTopic(Long trackId, TopicRequest request) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with id: " + trackId));

        Topic topic = new Topic();
        topic.setTrack(track);
        topic.setName(request.getName());
        topic.setDescription(request.getDescription());

        return mapToResponse(topicRepository.save(topic));
    }

    @Transactional
    public TopicResponse updateTopic(Long id, TopicRequest request) {
        Topic topic = findTopicEntityById(id);

        topic.setName(request.getName());
        topic.setDescription(request.getDescription());

        return mapToResponse(topicRepository.save(topic));
    }

    @Transactional
    public void deleteTopic(Long id) {
        Topic topic = findTopicEntityById(id);
        topicRepository.delete(topic);
    }

    private Topic findTopicEntityById(Long id) {
        return topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));
    }

    private TopicResponse mapToResponse(Topic topic) {
        TopicResponse response = new TopicResponse();
        response.setId(topic.getId());
        response.setTrackId(topic.getTrack().getId());
        response.setName(topic.getName());
        response.setDescription(topic.getDescription());
        return response;
    }
}
