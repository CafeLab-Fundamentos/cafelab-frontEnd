package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record CreateIoTMonitoringHistoryResource(
        @NotNull Boolean connectionState,
        @NotNull Double temperature,
        @NotNull Double humidity,
        LocalDateTime timestamp
) {
}
