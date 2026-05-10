package com.cafemetrix.cafelab.iotmonitoring.infrastructure.persistence.jpa.repositories;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IoTMonitoringHistoryRepository extends JpaRepository<IoTMonitoringHistory, Long> {
    List<IoTMonitoringHistory> findByIotMonitoringData_UserIdOrderByTimestampDesc(Long userId, Pageable pageable);

    Optional<IoTMonitoringHistory> findFirstByIotMonitoringData_UserIdOrderByTimestampDesc(Long userId);
}
