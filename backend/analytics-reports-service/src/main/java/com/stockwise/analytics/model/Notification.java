package com.stockwise.analytics.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/** Notification — persisted notification records per user. */
@Document(collection = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    private String id;

    private String title;
    private String message;
    private String type;          // success, warning, error, info

    @Indexed
    private String userId;        // owner of the notification
    private String userName;

    private boolean read;

    private LocalDateTime createdAt;
}
