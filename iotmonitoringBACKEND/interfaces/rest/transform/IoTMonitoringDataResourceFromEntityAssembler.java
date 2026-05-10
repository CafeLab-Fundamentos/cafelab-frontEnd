package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringData;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources.IoTMonitoringDataResource;

public class IoTMonitoringDataResourceFromEntityAssembler {
    public static IoTMonitoringDataResource toResourceFromEntity(IoTMonitoringData entity) {
        return new IoTMonitoringDataResource(
                entity.getId(),
                entity.isSensorConnected(),
                entity.isDehumidifierConnected(),
                entity.getMinTemperature(),
                entity.getMaxTemperature(),
                entity.getMinHumidity(),
                entity.getMaxHumidity(),
                entity.getUserId());
    }
}
