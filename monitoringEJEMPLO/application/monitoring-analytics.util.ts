import type { TranslateService } from '@ngx-translate/core';
import type { EnvironmentThreshold } from '../domain/model/environment-threshold.entity';
import type { TelemetryRecord } from '../domain/model/telemetry-record.entity';
import { resolveLotMonitoringStatus } from './monitoring-status.util';

export interface ChartPoint {
  x: number;
  y: number;
}

const HOURS_24_MS = 24 * 60 * 60 * 1000;

export function filterLast24Hours(records: TelemetryRecord[]): TelemetryRecord[] {
  const cutoff = Date.now() - HOURS_24_MS;
  return records.filter(
    (record) => new Date(record.timestamp).getTime() >= cutoff,
  );
}

export function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

export function buildNormalizedSeries(values: number[]): ChartPoint[] {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values.map((value, index) => ({
    x: values.length === 1 ? 0.5 : index / (values.length - 1),
    y: 1 - (value - min) / range,
  }));
}

export function toPolyline(points: ChartPoint[], width = 100, height = 100): string {
  return points
    .map((point) => `${point.x * width},${point.y * height}`)
    .join(' ');
}

export function temperatureStatusLabelKey(
  latest: TelemetryRecord | null,
  threshold: EnvironmentThreshold | null,
): string {
  const status = resolveLotMonitoringStatus(latest, threshold);
  if (status === 'optimal') {
    return 'MONITORING.ANALYTICS.KPI.STABLE';
  }
  if (status === 'warning' || status === 'critical') {
    return 'MONITORING.ANALYTICS.KPI.OUT_OF_RANGE';
  }
  return 'MONITORING.ANALYTICS.KPI.NO_BASELINE';
}

export function humidityStatusLabelKey(
  latest: TelemetryRecord | null,
  threshold: EnvironmentThreshold | null,
): string {
  if (!latest || !threshold) {
    return 'MONITORING.ANALYTICS.KPI.NO_BASELINE';
  }

  const inRange =
    latest.humidity >= threshold.minHumidity &&
    latest.humidity <= threshold.maxHumidity;

  return inRange
    ? 'MONITORING.ANALYTICS.KPI.IN_RANGE'
    : 'MONITORING.ANALYTICS.KPI.OUT_OF_RANGE';
}

export function computeHealthScore(
  records: TelemetryRecord[],
  threshold: EnvironmentThreshold | null,
): number | null {
  if (!records.length || !threshold) {
    return null;
  }

  const inRangeCount = records.filter((record) => {
    const tempOk =
      record.temperature >= threshold.minTemperature &&
      record.temperature <= threshold.maxTemperature;
    const humidityOk =
      record.humidity >= threshold.minHumidity &&
      record.humidity <= threshold.maxHumidity;
    return tempOk && humidityOk;
  }).length;

  return Math.round((inRangeCount / records.length) * 100);
}

export function qualityFromHealthScore(score: number | null): {
  labelKey: string;
  gradeKey: string;
} {
  if (score === null) {
    return {
      labelKey: 'MONITORING.ANALYTICS.KPI.NO_DATA',
      gradeKey: 'MONITORING.ANALYTICS.KPI.NO_BASELINE',
    };
  }

  if (score >= 90) {
    return {
      labelKey: 'MONITORING.ANALYTICS.KPI.QUALITY_PREMIUM',
      gradeKey: 'MONITORING.ANALYTICS.KPI.GRADE_A',
    };
  }

  if (score >= 75) {
    return {
      labelKey: 'MONITORING.ANALYTICS.KPI.QUALITY_STANDARD',
      gradeKey: 'MONITORING.ANALYTICS.KPI.GRADE_B',
    };
  }

  return {
    labelKey: 'MONITORING.ANALYTICS.KPI.QUALITY_AT_RISK',
    gradeKey: 'MONITORING.ANALYTICS.KPI.GRADE_C',
  };
}

export function formatMonitoringTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString();
}

export function formatRelativeTime(
  timestamp: string,
  translate: TranslateService,
): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)));

  if (diffMinutes < 60) {
    return translate.instant('MONITORING.ANALYTICS.EVENTS.MINUTES_AGO', {
      count: diffMinutes,
    });
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return translate.instant('MONITORING.ANALYTICS.EVENTS.HOURS_AGO', {
      count: diffHours,
    });
  }

  const diffDays = Math.round(diffHours / 24);
  return translate.instant('MONITORING.ANALYTICS.EVENTS.DAYS_AGO', {
    count: diffDays,
  });
}
