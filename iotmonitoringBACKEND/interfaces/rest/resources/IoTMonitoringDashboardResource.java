package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources;

import java.util.List;

public record IoTMonitoringDashboardResource(
        IoTMonitoringDataResource monitoringData,
        IoTMonitoringHistoryResource currentReading,
        List<IoTMonitoringHistoryResource> readingHistory,
        String sensorStatus,
        String environmentalStatus,
        String dehumidifierStatus,
        List<String> activeAlerts
) {
}
