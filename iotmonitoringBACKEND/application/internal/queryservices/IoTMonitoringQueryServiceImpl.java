package com.cafemetrix.cafelab.iotmonitoring.application.internal.queryservices;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringData;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringHistory;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.queries.GetIoTMonitoringDataByUserIdQuery;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.queries.GetIoTMonitoringHistoriesByUserIdQuery;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.queries.GetLatestIoTMonitoringHistoryByUserIdQuery;
import com.cafemetrix.cafelab.iotmonitoring.domain.services.IoTMonitoringQueryService;
import com.cafemetrix.cafelab.iotmonitoring.infrastructure.persistence.jpa.repositories.IoTMonitoringDataRepository;
import com.cafemetrix.cafelab.iotmonitoring.infrastructure.persistence.jpa.repositories.IoTMonitoringHistoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IoTMonitoringQueryServiceImpl implements IoTMonitoringQueryService {
    private final IoTMonitoringDataRepository dataRepository;
    private final IoTMonitoringHistoryRepository historyRepository;

    public IoTMonitoringQueryServiceImpl(
            IoTMonitoringDataRepository dataRepository,
            IoTMonitoringHistoryRepository historyRepository) {
        this.dataRepository = dataRepository;
        this.historyRepository = historyRepository;
    }

    @Override
    public Optional<IoTMonitoringData> handle(GetIoTMonitoringDataByUserIdQuery query) {
        return dataRepository.findByUserId(query.userId());
    }

    @Override
    public List<IoTMonitoringHistory> handle(GetIoTMonitoringHistoriesByUserIdQuery query) {
        int safeLimit = Math.max(1, Math.min(query.limit(), 100));
        return historyRepository.findByIotMonitoringData_UserIdOrderByTimestampDesc(
                query.userId(),
                PageRequest.of(0, safeLimit));
    }

    @Override
    public Optional<IoTMonitoringHistory> handle(GetLatestIoTMonitoringHistoryByUserIdQuery query) {
        return historyRepository.findFirstByIotMonitoringData_UserIdOrderByTimestampDesc(query.userId());
    }
}
