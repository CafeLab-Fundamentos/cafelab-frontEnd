import type { BaseEntity } from '../../../shared/infrastructure/base-entity';

export interface LotPerformance extends BaseEntity {
  coffeeLotId: number;
  initialWeight: number;
  finalWeight: number;
  yieldPercentage: number;
  lossWeight: number;
  productionTimeMinutes: number;
  productivityPerHour: number;
}

//d
export interface RegisterLotPerformanceRequest {
  coffeeLotId: number;
  initialWeight: number;
  finalWeight: number;
  productionTimeMinutes: number;
}
