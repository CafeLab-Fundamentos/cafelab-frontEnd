package com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.CreateIoTMonitoringHistoryCommand;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Table(name = "IoTMonitoringHistories")
@Getter
public class IoTMonitoringHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "connectionState", nullable = false)
    private boolean connectionState;

    @Column(nullable = false)
    private double temperature;

    @Column(nullable = false)
    private double humidity;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "iotMonitoringDataId", nullable = false)
    private IoTMonitoringData iotMonitoringData;

    public IoTMonitoringHistory() {}

    public IoTMonitoringHistory(CreateIoTMonitoringHistoryCommand command, IoTMonitoringData iotMonitoringData) {
        this.connectionState = command.connectionState();
        this.temperature = command.temperature();
        this.humidity = command.humidity();
        this.timestamp = command.timestamp() != null ? command.timestamp() : LocalDateTime.now();
        this.iotMonitoringData = iotMonitoringData;
    }
}
