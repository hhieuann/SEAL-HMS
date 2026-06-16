package com.fpt.seal.hms.topic.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TopicRequest {


    @Size(max = 200, message = "Topic name must be at most 200 characters")
    private String name;

    private String description;
}
