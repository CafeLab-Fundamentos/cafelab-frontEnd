import type { TranslateService } from '@ngx-translate/core';
import type { EnvironmentThreshold } from '../domain/model/environment-threshold.entity';
import type { MonitoringAlert } from '../domain/model/monitoring-alert.entity';
import type { TelemetryRecord } from '../domain/model/telemetry-record.entity';
import { formatMonitoringTimestamp, formatRelativeTime } from './monitoring-analytics.util';
import { valueStatus } from './monitoring-status.util';

export interface AlertBuildContext {
  lotId: number;
  lotName: string;
  coffeeType: string;
  latest: TelemetryRecord | null;
  threshold: EnvironmentThreshold | null;
}

export function buildAlertsForLot(
  context: AlertBuildContext,
  translate: TranslateService,
): MonitoringAlert[] {
  const lotLabel = `${context.lotName}: ${context.coffeeType}`;

  if (!context.latest) {
    return [
      {
        id: `${context.lotId}-no-data`,
        severity: 'warning',
        title: translate.instant('MONITORING.ALERTS.DERIVED.NO_DATA.TITLE'),
        description: translate.instant('MONITORING.ALERTS.DERIVED.NO_DATA.DESCRIPTION'),
        lotLabel,
        time: translate.instant('MONITORING.ALERTS.DERIVED.NO_TIMESTAMP'),
        occurredAt: null,
        metricIcon: 'sensors_off',
        metricValue: translate.instant('MONITORING.ALERTS.DERIVED.NO_DATA.METRIC'),
      },
    ];
  }

  if (!context.threshold) {
    return [
      {
        id: `${context.lotId}-unconfigured`,
        severity: 'info',
        title: translate.instant('MONITORING.ALERTS.DERIVED.UNCONFIGURED.TITLE'),
        description: translate.instant('MONITORING.ALERTS.DERIVED.UNCONFIGURED.DESCRIPTION'),
        lotLabel,
        time: formatMonitoringTimestamp(context.latest.timestamp),
        occurredAt: context.latest.timestamp,
        metricIcon: 'tune',
        metricValue: translate.instant('MONITORING.ALERTS.DERIVED.UNCONFIGURED.METRIC'),
      },
    ];
  }

  const alerts: MonitoringAlert[] = [];
  const { temperature, humidity, timestamp } = context.latest;
  const time = formatMonitoringTimestamp(timestamp);
  const threshold = context.threshold;

  const tempStatus = valueStatus(
    temperature,
    threshold.minTemperature,
    threshold.maxTemperature,
  );
  if (tempStatus === 'critical' || tempStatus === 'warning') {
    alerts.push({
      id: `${context.lotId}-temperature-${timestamp}`,
      severity: tempStatus,
      title: translate.instant(
        tempStatus === 'critical'
          ? 'MONITORING.ALERTS.DERIVED.TEMP_CRITICAL.TITLE'
          : 'MONITORING.ALERTS.DERIVED.TEMP_WARNING.TITLE',
      ),
      description: translate.instant(
        tempStatus === 'critical'
          ? 'MONITORING.ALERTS.DERIVED.TEMP_CRITICAL.DESCRIPTION'
          : 'MONITORING.ALERTS.DERIVED.TEMP_WARNING.DESCRIPTION',
        {
          min: threshold.minTemperature,
          max: threshold.maxTemperature,
        },
      ),
      lotLabel,
      time,
      occurredAt: timestamp,
      metricIcon: 'device_thermostat',
      metricValue: `${temperature.toFixed(1)}°C`,
    });
  }

  const humidityStatus = valueStatus(
    humidity,
    threshold.minHumidity,
    threshold.maxHumidity,
  );
  if (humidityStatus === 'critical' || humidityStatus === 'warning') {
    alerts.push({
      id: `${context.lotId}-humidity-${timestamp}`,
      severity: humidityStatus,
      title: translate.instant(
        humidityStatus === 'critical'
          ? 'MONITORING.ALERTS.DERIVED.HUMIDITY_CRITICAL.TITLE'
          : 'MONITORING.ALERTS.DERIVED.HUMIDITY_WARNING.TITLE',
      ),
      description: translate.instant(
        humidityStatus === 'critical'
          ? 'MONITORING.ALERTS.DERIVED.HUMIDITY_CRITICAL.DESCRIPTION'
          : 'MONITORING.ALERTS.DERIVED.HUMIDITY_WARNING.DESCRIPTION',
        {
          min: threshold.minHumidity,
          max: threshold.maxHumidity,
        },
      ),
      lotLabel,
      time,
      occurredAt: timestamp,
      metricIcon: 'water_drop',
      metricValue: `${Math.round(humidity)}%`,
    });
  }

  return alerts;
}

export function sortAlertsByRecency(alerts: MonitoringAlert[]): MonitoringAlert[] {
  return [...alerts].sort((left, right) => {
    const leftTime = left.occurredAt ? new Date(left.occurredAt).getTime() : 0;
    const rightTime = right.occurredAt ? new Date(right.occurredAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function deriveRecentEventsFromTelemetry(
  history: TelemetryRecord[],
  threshold: EnvironmentThreshold | null,
  translate: TranslateService,
  limit = 5,
): { icon: string; title: string; description: string; time: string }[] {
  if (!threshold || history.length === 0) {
    return [];
  }

  const events: { icon: string; title: string; description: string; time: string; at: number }[] =
    [];

  for (const record of history) {
    const tempStatus = valueStatus(
      record.temperature,
      threshold.minTemperature,
      threshold.maxTemperature,
    );
    const humidityStatus = valueStatus(
      record.humidity,
      threshold.minHumidity,
      threshold.maxHumidity,
    );

    if (tempStatus === 'critical' || tempStatus === 'warning') {
      events.push({
        icon: tempStatus === 'critical' ? 'device_thermostat' : 'warning_amber',
        title: translate.instant(
          tempStatus === 'critical'
            ? 'MONITORING.ANALYTICS.EVENTS.TEMP_BREACH_TITLE'
            : 'MONITORING.ANALYTICS.EVENTS.TEMP_NEAR_TITLE',
        ),
        description: translate.instant(
          tempStatus === 'critical'
            ? 'MONITORING.ANALYTICS.EVENTS.TEMP_BREACH_DESC'
            : 'MONITORING.ANALYTICS.EVENTS.TEMP_NEAR_DESC',
          { value: record.temperature.toFixed(1) },
        ),
        time: formatRelativeTime(record.timestamp, translate),
        at: new Date(record.timestamp).getTime(),
      });
    }

    if (humidityStatus === 'critical' || humidityStatus === 'warning') {
      events.push({
        icon: humidityStatus === 'critical' ? 'water_drop' : 'warning_amber',
        title: translate.instant(
          humidityStatus === 'critical'
            ? 'MONITORING.ANALYTICS.EVENTS.HUMIDITY_BREACH_TITLE'
            : 'MONITORING.ANALYTICS.EVENTS.HUMIDITY_NEAR_TITLE',
        ),
        description: translate.instant(
          humidityStatus === 'critical'
            ? 'MONITORING.ANALYTICS.EVENTS.HUMIDITY_BREACH_DESC'
            : 'MONITORING.ANALYTICS.EVENTS.HUMIDITY_NEAR_DESC',
          { value: Math.round(record.humidity) },
        ),
        time: formatRelativeTime(record.timestamp, translate),
        at: new Date(record.timestamp).getTime(),
      });
    }
  }

  return events
    .sort((left, right) => right.at - left.at)
    .slice(0, limit)
    .map(({ icon, title, description, time }) => ({ icon, title, description, time }));
}
