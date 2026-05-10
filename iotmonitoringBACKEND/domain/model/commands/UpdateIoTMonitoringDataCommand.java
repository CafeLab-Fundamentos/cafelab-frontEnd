package com.cafemetrix.cafelab.iotmonitoring.domain.model.commands;

public record UpdateIoTMonitoringDataCommand(
        Long dataId,
        Long userId,
        boolean sensorConnected,
        boolean dehumidifierConnected,
        double minTemperature,
        double maxTemperature,
        double minHumidity,
        double maxHumidity
) {
}
