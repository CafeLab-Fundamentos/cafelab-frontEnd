package com.cafemetrix.cafelab.iotmonitoring.domain.model.commands;

public record CreateIoTMonitoringDataCommand(
        Long userId,
        boolean sensorConnected,
        boolean dehumidifierConnected,
        double minTemperature,
        double maxTemperature,
        double minHumidity,
        double maxHumidity
) {
}
