export interface TelemetryRecord {
  id: number;
  coffeeLotId: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

export type LotMonitoringStatus =
  | 'optimal'
  | 'warning'
  | 'critical'
  | 'unconfigured'
  | 'no_data';

export interface MonitoredLotView {
  lotId: number;
  lotName: string;
  coffeeType: string;
  status: LotMonitoringStatus;
  temperature: number | null;
  humidity: number | null;
  lastTimestamp: string | null;
  temperatureOutOfRange: boolean;
  humidityOutOfRange: boolean;
}
