package com.cafemetrix.cafelab.iotmonitoring.application.internal;

import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringData;
import com.cafemetrix.cafelab.iotmonitoring.domain.model.aggregates.IoTMonitoringHistory;

import java.util.ArrayList;
import java.util.List;

public final class IoTMonitoringStatusCalculator {

    private IoTMonitoringStatusCalculator() {}

    public static final String STATUS_OPTIMAL = "IOT.DASHBOARD.STATUS_OPTIMAL";
    public static final String STATUS_WARNING = "IOT.DASHBOARD.STATUS_WARNING";

    public static String environmentalStatus(
            IoTMonitoringData data, IoTMonitoringHistory latestReading) {
        if (latestReading == null) {
            return STATUS_WARNING;
        }
        double t = latestReading.getTemperature();
        double h = latestReading.getHumidity();
        boolean tempOk = t >= data.getMinTemperature() && t <= data.getMaxTemperature();
        boolean humOk = h >= data.getMinHumidity() && h <= data.getMaxHumidity();
        return tempOk && humOk ? STATUS_OPTIMAL : STATUS_WARNING;
    }

    public static String dehumidifierStatus(IoTMonitoringData data, IoTMonitoringHistory latestReading) {
        if (latestReading == null) {
            return "IOT.DASHBOARD.DEHUMIDIFIER_OFF";
        }
        double h = latestReading.getHumidity();
        boolean on = h > data.getMaxHumidity() && data.isDehumidifierConnected();
        return on ? "IOT.DASHBOARD.DEHUMIDIFIER_ON" : "IOT.DASHBOARD.DEHUMIDIFIER_OFF";
    }

    public static String sensorStatus(IoTMonitoringData data, IoTMonitoringHistory latestReading) {
        if (!data.isSensorConnected()) {
            return "IOT.DASHBOARD.SENSOR_DISCONNECTED";
        }
        if (latestReading != null && !latestReading.isConnectionState()) {
            return "IOT.DASHBOARD.SENSOR_DISCONNECTED";
        }
        return "IOT.DASHBOARD.SENSOR_CONNECTED";
    }

    public static List<String> activeAlerts(IoTMonitoringData data, IoTMonitoringHistory latestReading) {
        List<String> alerts = new ArrayList<>();
        if (latestReading == null) {
            return alerts;
        }
        double t = latestReading.getTemperature();
        double h = latestReading.getHumidity();
        if (t < data.getMinTemperature()) {
            alerts.add("IOT.ALERTS.TEMPERATURE_BELOW_MIN");
        }
        if (t > data.getMaxTemperature()) {
            alerts.add("IOT.ALERTS.TEMPERATURE_ABOVE_MAX");
        }
        if (h < data.getMinHumidity()) {
            alerts.add("IOT.ALERTS.HUMIDITY_BELOW_MIN");
        }
        if (h > data.getMaxHumidity()) {
            alerts.add("IOT.ALERTS.HUMIDITY_ABOVE_MAX");
        }
        return alerts;
    }
}
