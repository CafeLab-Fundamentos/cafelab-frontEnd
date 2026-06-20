import type { EnvironmentThreshold } from '../domain/model/environment-threshold.entity';
import type {
  LotMonitoringStatus,
  TelemetryRecord,
} from '../domain/model/telemetry-record.entity';

const WARNING_MARGIN_RATIO = 0.1;

function isNearBoundary(
  value: number,
  min: number,
  max: number,
): boolean {
  const range = max - min;
  if (range <= 0) {
    return false;
  }
  const margin = range * WARNING_MARGIN_RATIO;
  return value < min + margin || value > max - margin;
}

export function valueStatus(
  value: number,
  min: number,
  max: number,
): 'optimal' | 'warning' | 'critical' {
  if (value < min || value > max) {
    return 'critical';
  }
  if (isNearBoundary(value, min, max)) {
    return 'warning';
  }
  return 'optimal';
}

export function isValueOutOfRange(value: number, min: number, max: number): boolean {
  return value < min || value > max;
}

export function resolveActuatorOutOfRange(
  latest: TelemetryRecord | null,
  threshold: EnvironmentThreshold | null,
): { temperatureOutOfRange: boolean; humidityOutOfRange: boolean } {
  if (!latest || !threshold) {
    return { temperatureOutOfRange: false, humidityOutOfRange: false };
  }

  return {
    temperatureOutOfRange: isValueOutOfRange(
      latest.temperature,
      threshold.minTemperature,
      threshold.maxTemperature,
    ),
    humidityOutOfRange: isValueOutOfRange(
      latest.humidity,
      threshold.minHumidity,
      threshold.maxHumidity,
    ),
  };
}

export function resolveLotMonitoringStatus(
  latest: TelemetryRecord | null,
  threshold: EnvironmentThreshold | null,
): LotMonitoringStatus {
  if (!latest) {
    return 'no_data';
  }

  if (!threshold) {
    return 'unconfigured';
  }

  const tempStatus = valueStatus(
    latest.temperature,
    threshold.minTemperature,
    threshold.maxTemperature,
  );
  const humidityStatus = valueStatus(
    latest.humidity,
    threshold.minHumidity,
    threshold.maxHumidity,
  );

  if (tempStatus === 'critical' || humidityStatus === 'critical') {
    return 'critical';
  }
  if (tempStatus === 'warning' || humidityStatus === 'warning') {
    return 'warning';
  }
  return 'optimal';
}
