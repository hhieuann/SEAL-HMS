package com.fpt.seal.hms.topic.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TopicResponse {
    private Long id;
    private Long trackId;
    private String name;
    private String description;
}
