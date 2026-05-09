export interface EnvironmentalReading {
  temperature: number;
  humidity: number;
  timestamp: Date;
}

export interface ThresholdRange {
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
}
