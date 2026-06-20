import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  EnvironmentThreshold,
  EnvironmentThresholdFormValues,
} from '../domain/model/environment-threshold.entity';
import { EnvironmentThresholdApiEndpoint } from '../infrastructure/environment-threshold-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentThresholdApi {
  constructor(
    private readonly environmentThresholdApiEndpoint: EnvironmentThresholdApiEndpoint,
  ) {}

  getByCoffeeLotId(coffeeLotId: number): Observable<EnvironmentThreshold | null> {
    return this.environmentThresholdApiEndpoint.getByCoffeeLotId(coffeeLotId);
  }

  save(
    coffeeLotId: number,
    values: EnvironmentThresholdFormValues,
    exists: boolean,
  ): Observable<EnvironmentThreshold> {
    if (exists) {
      return this.environmentThresholdApiEndpoint.update(coffeeLotId, values);
    }
    return this.environmentThresholdApiEndpoint.create(coffeeLotId, values);
  }
}
