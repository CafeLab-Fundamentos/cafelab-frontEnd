import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface LotPerformanceListResponse extends BaseResponse {}

export interface LotPerformanceResource extends BaseResource {
  coffeeLotId: number;
  initialWeight: number;
  finalWeight: number;
  yieldPercentage: number;
  lossWeight: number;
  productionTimeMinutes: number;
  productivityPerHour: number;
}

export interface RegisterLotPerformanceBody {
  coffeeLotId: number;
  initialWeight: number;
  finalWeight: number;
  productionTimeMinutes: number;
}
