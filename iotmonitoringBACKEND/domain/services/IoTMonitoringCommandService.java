package com.cafemetrix.cafelab.iotmonitoring.domain.services;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringData;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringHistory;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.CreateIoTMonitoringDataCommand;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.CreateIoTMonitoringHistoryCommand;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.UpdateIoTMonitoringDataCommand;

import java.util.Optional;

public interface IoTMonitoringCommandService {
    Optional<IoTMonitoringData> handle(CreateIoTMonitoringDataCommand command);

    Optional<IoTMonitoringData> handle(UpdateIoTMonitoringDataCommand command);

    Optional<IoTMonitoringHistory> handle(CreateIoTMonitoringHistoryCommand command);

    /** Genera temperatura y humedad en servidor, persiste historial y devuelve la lectura guardada. */
    Optional<IoTMonitoringHistory> simulateReading(Long userId);
}
