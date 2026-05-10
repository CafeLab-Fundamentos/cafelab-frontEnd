package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.CreateIoTMonitoringDataCommand;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources.CreateIoTMonitoringDataResource;

public class CreateIoTMonitoringDataCommandFromResourceAssembler {
    public static CreateIoTMonitoringDataCommand toCommand(
            Long userId,
            CreateIoTMonitoringDataResource resource) {
        return new CreateIoTMonitoringDataCommand(
                userId,
                resource.sensorConnected(),
                resource.dehumidifierConnected(),
                resource.minTemperature(),
                resource.maxTemperature(),
                resource.minHumidity(),
                resource.maxHumidity());
    }
}
