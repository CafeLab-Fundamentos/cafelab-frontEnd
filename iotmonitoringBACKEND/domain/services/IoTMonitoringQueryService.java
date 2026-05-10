package com.cafemetrix.cafelab.iotmonitoring.domain.services;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringData;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringHistory;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.queries.GetIoTMonitoringDataByUserIdQuery;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.queries.GetIoTMonitoringHistoriesByUserIdQuery;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.queries.GetLatestIoTMonitoringHistoryByUserIdQuery;

import java.util.List;
import java.util.Optional;

public interface IoTMonitoringQueryService {
    Optional<IoTMonitoringData> handle(GetIoTMonitoringDataByUserIdQuery query);

    List<IoTMonitoringHistory> handle(GetIoTMonitoringHistoriesByUserIdQuery query);

    Optional<IoTMonitoringHistory> handle(GetLatestIoTMonitoringHistoryByUserIdQuery query);
}
