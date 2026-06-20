import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { CoffeeLotApi } from '../../coffee-lot/application/coffee-lot.api';
import type { CoffeeLot } from '../../coffee-lot/domain/model/coffee-lot.entity';
import type { MonitoredLotView } from '../domain/model/telemetry-record.entity';
import { EnvironmentThresholdApi } from './environment-threshold.api';
import {
  resolveActuatorOutOfRange,
  resolveLotMonitoringStatus,
} from './monitoring-status.util';
import { TelemetryRecordApi } from './telemetry-record.api';

@Injectable({
  providedIn: 'root',
})
export class MonitoredLotApi {
  constructor(
    private readonly coffeeLotApi: CoffeeLotApi,
    private readonly telemetryRecordApi: TelemetryRecordApi,
    private readonly environmentThresholdApi: EnvironmentThresholdApi,
  ) {}

  getMonitoredLots(): Observable<MonitoredLotView[]> {
    return this.coffeeLotApi.getAll().pipe(
      switchMap((lots) => this.buildViewsForLots(lots)),
    );
  }

  private buildViewsForLots(lots: CoffeeLot[]): Observable<MonitoredLotView[]> {
    if (lots.length === 0) {
      return of([]);
    }

    return forkJoin(
      lots.map((lot) =>
        forkJoin({
          latest: this.telemetryRecordApi
            .getLatestByCoffeeLotId(lot.id)
            .pipe(catchError(() => of(null))),
          threshold: this.environmentThresholdApi
            .getByCoffeeLotId(lot.id)
            .pipe(catchError(() => of(null))),
        }).pipe(
          map(({ latest, threshold }) => {
            const actuatorOutOfRange = resolveActuatorOutOfRange(latest, threshold);

            return {
              lotId: lot.id,
              lotName: lot.lot_name,
              coffeeType: lot.coffee_type,
              status: resolveLotMonitoringStatus(latest, threshold),
              temperature: latest?.temperature ?? null,
              humidity: latest?.humidity ?? null,
              lastTimestamp: latest?.timestamp ?? null,
              temperatureOutOfRange: actuatorOutOfRange.temperatureOutOfRange,
              humidityOutOfRange: actuatorOutOfRange.humidityOutOfRange,
            };
          }),
        ),
      ),
    );
  }
}
