package com.cafemetrix.cafelab.iotmonitoring.domain.model.commands;

import java.time.LocalDateTime;

public record CreateIoTMonitoringHistoryCommand(
        Long userId,
        boolean connectionState,
        double temperature,
        double humidity,
        LocalDateTime timestamp
) {
}
