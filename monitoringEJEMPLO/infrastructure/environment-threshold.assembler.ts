import type { EnvironmentThreshold } from '../domain/model/environment-threshold.entity';
import type {
  CreateEnvironmentThresholdBody,
  EnvironmentThresholdResource,
} from './environment-threshold.response';

export class EnvironmentThresholdAssembler {
  toEntityFromResource(resource: EnvironmentThresholdResource): EnvironmentThreshold {
    return {
      id: resource.id,
      coffeeLotId: resource.coffeeLotId,
      minTemperature: resource.minTemperature,
      maxTemperature: resource.maxTemperature,
      minHumidity: resource.minHumidity,
      maxHumidity: resource.maxHumidity,
      syncIntervalSeconds: resource.syncIntervalSeconds ?? null,
    };
  }

  toCreateBody(
    coffeeLotId: number,
    values: Pick<
      EnvironmentThreshold,
      'minTemperature' | 'maxTemperature' | 'minHumidity' | 'maxHumidity'
    > & { syncIntervalSeconds: number },
  ): CreateEnvironmentThresholdBody {
    return {
      coffeeLotId,
      minTemperature: values.minTemperature,
      maxTemperature: values.maxTemperature,
      minHumidity: values.minHumidity,
      maxHumidity: values.maxHumidity,
      syncIntervalSeconds: values.syncIntervalSeconds,
    };
  }
}
