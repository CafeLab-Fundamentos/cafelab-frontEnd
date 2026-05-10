package com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.CreateIoTMonitoringDataCommand;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.commands.UpdateIoTMonitoringDataCommand;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "IoTMonitoringData")
@Getter
public class IoTMonitoringData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sensorConnected", nullable = false)
    private boolean sensorConnected;

    @Column(name = "dehumidifierConnected", nullable = false)
    private boolean dehumidifierConnected;

    @Column(name = "minTemperature", nullable = false)
    private double minTemperature;

    @Column(name = "maxTemperature", nullable = false)
    private double maxTemperature;

    @Column(name = "minHumidity", nullable = false)
    private double minHumidity;

    @Column(name = "maxHumidity", nullable = false)
    private double maxHumidity;

    @Column(name = "userId", nullable = false, unique = true)
    private Long userId;

    public IoTMonitoringData() {}

    public IoTMonitoringData(CreateIoTMonitoringDataCommand command) {
        this.userId = command.userId();
        this.sensorConnected = command.sensorConnected();
        this.dehumidifierConnected = command.dehumidifierConnected();
        this.minTemperature = command.minTemperature();
        this.maxTemperature = command.maxTemperature();
        this.minHumidity = command.minHumidity();
        this.maxHumidity = command.maxHumidity();
    }

    public void applyUpdate(UpdateIoTMonitoringDataCommand command) {
        this.sensorConnected = command.sensorConnected();
        this.dehumidifierConnected = command.dehumidifierConnected();
        this.minTemperature = command.minTemperature();
        this.maxTemperature = command.maxTemperature();
        this.minHumidity = command.minHumidity();
        this.maxHumidity = command.maxHumidity();
    }
}
