package com.cafemetrix.cafelab.iotmonitoring.domain.exceptions;

public class IoTMonitoringDataNotFoundException extends RuntimeException {
    public IoTMonitoringDataNotFoundException(Long id) {
        super("IoT monitoring data with id " + id + " not found");
    }
}
