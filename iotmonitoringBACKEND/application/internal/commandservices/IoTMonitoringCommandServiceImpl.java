package com.cafemetrix.cafelab.iotmonitoring.application.internal.commandservices;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringData;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringHistory;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.CreateIoTMonitoringDataCommand;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.CreateIoTMonitoringHistoryCommand;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.UpdateIoTMonitoringDataCommand;
import com.cafemetrix.cafelab.iotmonitoring.domain.services.IoTMonitoringCommandService;
import com.cafemetrix.cafelab.iotmonitoring.infrastructure.persistence.jpa.repositories.IoTMonitoringDataRepository;
import com.cafemetrix.cafelab.iotmonitoring.infrastructure.persistence.jpa.repositories.IoTMonitoringHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class IoTMonitoringCommandServiceImpl implements IoTMonitoringCommandService {
    private final IoTMonitoringDataRepository dataRepository;
    private final IoTMonitoringHistoryRepository historyRepository;

    public IoTMonitoringCommandServiceImpl(
            IoTMonitoringDataRepository dataRepository,
            IoTMonitoringHistoryRepository historyRepository) {
        this.dataRepository = dataRepository;
        this.historyRepository = historyRepository;
    }

    @Override
    @Transactional
    public Optional<IoTMonitoringData> handle(CreateIoTMonitoringDataCommand command) {
        if (dataRepository.findByUserId(command.userId()).isPresent()) {
            throw new IllegalArgumentException("Ya existe configuración IoT para este usuario");
        }
        validateRanges(
                command.minTemperature(),
                command.maxTemperature(),
                command.minHumidity(),
                command.maxHumidity());
        return Optional.of(dataRepository.save(new IoTMonitoringData(command)));
    }

    @Override
    @Transactional
    public Optional<IoTMonitoringData> handle(UpdateIoTMonitoringDataCommand command) {
        validateRanges(
                command.minTemperature(),
                command.maxTemperature(),
                command.minHumidity(),
                command.maxHumidity());
        return dataRepository.findByIdAndUserId(command.dataId(), command.userId())
                .map(entity -> {
                    entity.applyUpdate(command);
                    return dataRepository.save(entity);
                });
    }

    @Override
    @Transactional
    public Optional<IoTMonitoringHistory> handle(CreateIoTMonitoringHistoryCommand command) {
        return dataRepository.findByUserId(command.userId())
                .map(data -> historyRepository.save(new IoTMonitoringHistory(command, data)));
    }

    @Override
    @Transactional
    public Optional<IoTMonitoringHistory> simulateReading(Long userId) {
        Optional<IoTMonitoringData> dataOpt = dataRepository.findByUserId(userId);
        if (dataOpt.isEmpty()) {
            return Optional.empty();
        }
        IoTMonitoringData data = dataOpt.get();
        ThreadLocalRandom r = ThreadLocalRandom.current();
        double temperature = Math.round((10.0 + r.nextDouble(20.0)) * 10.0) / 10.0;
        double humidity = Math.round(40.0 + r.nextDouble(40.0));
        var command =
                new CreateIoTMonitoringHistoryCommand(
                        userId,
                        data.isSensorConnected(),
                        temperature,
                        humidity,
                        LocalDateTime.now());
        return handle(command);
    }

    private void validateRanges(
            double minTemperature,
            double maxTemperature,
            double minHumidity,
            double maxHumidity) {
        if (minTemperature > maxTemperature) {
            throw new IllegalArgumentException("minTemperature no puede ser mayor que maxTemperature");
        }
        if (minHumidity > maxHumidity) {
            throw new IllegalArgumentException("minHumidity no puede ser mayor que maxHumidity");
        }
    }
}
