package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringHistory;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources.IoTMonitoringHistoryResource;

public class IoTMonitoringHistoryResourceFromEntityAssembler {
    public static IoTMonitoringHistoryResource toResourceFromEntity(IoTMonitoringHistory entity) {
        return new IoTMonitoringHistoryResource(
                entity.getId(),
                entity.isConnectionState(),
                entity.getTemperature(),
                entity.getHumidity(),
                entity.getIotMonitoringData().getId(),
                entity.getTimestamp());
    }
}
