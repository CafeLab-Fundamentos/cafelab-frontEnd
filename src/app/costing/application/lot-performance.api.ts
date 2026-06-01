import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LotPerformanceApiEndpoint } from '../infrastructure/lot-performance-api-endpoint';
import type { LotPerformance } from '../domain/model/lot-performance.entity';

@Injectable({
  providedIn: 'root',
})
export class LotPerformanceApi {
  constructor(private readonly endpoint: LotPerformanceApiEndpoint) {}

  getAll(): Observable<LotPerformance[]> {
    return this.endpoint.getAll();
  }

  getById(id: number): Observable<LotPerformance> {
    return this.endpoint.getById(id);
  }

  register(
    coffeeLotId: number,
    initialWeight: number,
    finalWeight: number,
    productionTimeMinutes: number,
  ): Observable<LotPerformance> {
    const draft: LotPerformance = {
      id: 0,
      coffeeLotId,
      initialWeight,
      finalWeight,
      productionTimeMinutes,
      yieldPercentage: 0,
      lossWeight: 0,
      productivityPerHour: 0,
    };
    return this.endpoint.create(draft);
  }
}
