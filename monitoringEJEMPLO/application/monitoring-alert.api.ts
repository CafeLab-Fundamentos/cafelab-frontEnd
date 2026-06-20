import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { CoffeeLotApi } from '../../coffee-lot/application/coffee-lot.api';
import type { MonitoringAlert } from '../domain/model/monitoring-alert.entity';
import { EnvironmentThresholdApi } from './environment-threshold.api';
import {
  buildAlertsForLot,
  sortAlertsByRecency,
} from './monitoring-alert.util';
import { TelemetryRecordApi } from './telemetry-record.api';

@Injectable({
  providedIn: 'root',
})
export class MonitoringAlertApi {
  constructor(
    private readonly coffeeLotApi: CoffeeLotApi,
    private readonly telemetryRecordApi: TelemetryRecordApi,
    private readonly environmentThresholdApi: EnvironmentThresholdApi,
    private readonly translate: TranslateService,
  ) {}

  getAlerts(): Observable<MonitoringAlert[]> {
    return this.coffeeLotApi.getAll().pipe(
      switchMap((lots) => {
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
              map(({ latest, threshold }) =>
                buildAlertsForLot(
                  {
                    lotId: lot.id,
                    lotName: lot.lot_name,
                    coffeeType: lot.coffee_type,
                    latest,
                    threshold,
                  },
                  this.translate,
                ),
              ),
            ),
          ),
        ).pipe(map((groups) => sortAlertsByRecency(groups.flat())));
      }),
    );
  }
}
