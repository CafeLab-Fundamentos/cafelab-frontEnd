package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.UpdateIoTMonitoringDataCommand;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources.UpdateIoTMonitoringDataResource;

public class UpdateIoTMonitoringDataCommandFromResourceAssembler {
    public static UpdateIoTMonitoringDataCommand toCommand(
            Long dataId,
            Long userId,
            UpdateIoTMonitoringDataResource resource) {
        return new UpdateIoTMonitoringDataCommand(
                dataId,
                userId,
                resource.sensorConnected(),
                resource.dehumidifierConnected(),
                resource.minTemperature(),
                resource.maxTemperature(),
                resource.minHumidity(),
                resource.maxHumidity());
    }
}
