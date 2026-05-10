package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources;

import java.time.LocalDateTime;

public record IoTMonitoringHistoryResource(
        Long id,
        boolean connectionState,
        double temperature,
        double humidity,
        Long iotMonitoringDataId,
        LocalDateTime timestamp
) {
}
