export interface ThresholdRange {
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
}

export interface IoTMonitoringData {
  id: number;
  sensorConnected: boolean;
  dehumidifierConnected: boolean;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  userId: number;
}

export interface IoTMonitoringHistory {
  id: number;
  connectionState: boolean;
  temperature: number;
  humidity: number;
  iotMonitoringDataId: number;
  timestamp: string | Date;
}

/** Corresponds to IoTMonitoringDashboardResource on the backend */
export interface IoTMonitoringDashboard {
  monitoringData: IoTMonitoringData;
  currentReading: IoTMonitoringHistory | null;
  readingHistory: IoTMonitoringHistory[];
  sensorStatus: string;
  environmentalStatus: string;
  dehumidifierStatus: string;
  activeAlerts: string[];
}

/** Corresponds to IoTSimulatorReadingResource on the backend */
export interface IoTSimulatorReading {
  temperature: number;
  humidity: number;
  environmentalStatus: string;
  dehumidifierStatus: string;
  message: string;
}

/** Request body for updating IoT monitoring data thresholds */
export interface UpdateIoTMonitoringDataRequest {
  sensorConnected: boolean;
  dehumidifierConnected: boolean;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
}

