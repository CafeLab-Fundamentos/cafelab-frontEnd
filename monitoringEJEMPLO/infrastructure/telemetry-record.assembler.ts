import type { TelemetryRecord } from '../domain/model/telemetry-record.entity';
import type { TelemetryRecordResource } from './telemetry-record.response';

export class TelemetryRecordAssembler {
  toEntityFromResource(resource: TelemetryRecordResource): TelemetryRecord {
    return {
      id: resource.id,
      coffeeLotId: resource.coffeeLotId,
      temperature: resource.temperature,
      humidity: resource.humidity,
      timestamp: resource.timestamp,
    };
  }
}
