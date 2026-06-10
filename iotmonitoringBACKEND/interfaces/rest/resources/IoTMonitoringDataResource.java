package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources;

public record IoTMonitoringDataResource(
        Long id,
        boolean sensorConnected,
        boolean dehumidifierConnected,
        double minTemperature,
        double maxTemperature,
        double minHumidity,
        double maxHumidity,
        Long userId
) {
}
