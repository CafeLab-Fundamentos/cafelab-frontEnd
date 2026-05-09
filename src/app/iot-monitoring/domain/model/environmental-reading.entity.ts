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
  timestamp: Date;
}
