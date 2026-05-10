package com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.transform;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.CreateIoTMonitoringHistoryCommand;
import com.cafemetrix.cafelab.iotmonitoring.interfaces.rest.resources.CreateIoTMonitoringHistoryResource;

public class CreateIoTMonitoringHistoryCommandFromResourceAssembler {
    public static CreateIoTMonitoringHistoryCommand toCommand(
            Long userId,
            CreateIoTMonitoringHistoryResource resource) {
        return new CreateIoTMonitoringHistoryCommand(
                userId,
                resource.connectionState(),
                resource.temperature(),
                resource.humidity(),
                resource.timestamp());
    }
}
