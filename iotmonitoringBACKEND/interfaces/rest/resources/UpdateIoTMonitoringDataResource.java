package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources;

import jakarta.validation.constraints.NotNull;

public record UpdateIoTMonitoringDataResource(
        @NotNull Boolean sensorConnected,
        @NotNull Boolean dehumidifierConnected,
        @NotNull Double minTemperature,
        @NotNull Double maxTemperature,
        @NotNull Double minHumidity,
        @NotNull Double maxHumidity
) {
}
