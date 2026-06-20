import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import type { TelemetryRecord } from '../domain/model/telemetry-record.entity';
import { TelemetryRecordApiEndpoint } from '../infrastructure/telemetry-record-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class TelemetryRecordApi {
  constructor(
    private readonly telemetryRecordApiEndpoint: TelemetryRecordApiEndpoint,
  ) {}

  getHistoryByCoffeeLotId(coffeeLotId: number): Observable<TelemetryRecord[]> {
    return this.telemetryRecordApiEndpoint.getByCoffeeLotId(coffeeLotId);
  }

  getLatestByCoffeeLotId(coffeeLotId: number): Observable<TelemetryRecord | null> {
    return this.getHistoryByCoffeeLotId(coffeeLotId).pipe(
      map((records) => (records.length ? records[records.length - 1] : null)),
    );
  }
}
