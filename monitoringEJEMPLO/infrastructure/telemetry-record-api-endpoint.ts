import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { TelemetryRecord } from '../domain/model/telemetry-record.entity';
import { TelemetryRecordAssembler } from './telemetry-record.assembler';
import type { TelemetryRecordResource } from './telemetry-record.response';

@Injectable({
  providedIn: 'root',
})
export class TelemetryRecordApiEndpoint {
  private readonly baseUrl = `${environment.serverBaseUrl}${environment.telemetryRecordsEndpointPath}`;
  private readonly assembler = new TelemetryRecordAssembler();

  constructor(private readonly http: HttpClient) {}

  getByCoffeeLotId(coffeeLotId: number): Observable<TelemetryRecord[]> {
    return this.http
      .get<TelemetryRecordResource[]>(`${this.baseUrl}/coffee-lot/${coffeeLotId}`)
      .pipe(
        map((records) =>
          records.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
      );
  }
}
