export interface EnvironmentThresholdResource {
  id: number;
  coffeeLotId: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  syncIntervalSeconds: number | null;
}

export interface CreateEnvironmentThresholdBody {
  coffeeLotId: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  syncIntervalSeconds: number;
}
