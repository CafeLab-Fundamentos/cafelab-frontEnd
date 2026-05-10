import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { LotPerformance } from '../domain/model/lot-performance.entity';
import type {
  LotPerformanceListResponse,
  LotPerformanceResource,
  RegisterLotPerformanceBody,
} from './lot-performance.response';

export class LotPerformanceAssembler
  implements BaseAssembler<LotPerformance, LotPerformanceResource, LotPerformanceListResponse>
{
  toEntityFromResource(resource: LotPerformanceResource): LotPerformance {
    return {
      id: resource.id,
      coffeeLotId: resource.coffeeLotId,
      initialWeight: Number(resource.initialWeight),
      finalWeight: Number(resource.finalWeight),
      yieldPercentage: Number(resource.yieldPercentage),
      lossWeight: Number(resource.lossWeight),
      productionTimeMinutes: Number(resource.productionTimeMinutes),
      productivityPerHour: Number(resource.productivityPerHour),
    };
  }

  toResourceFromEntity(entity: LotPerformance): LotPerformanceResource {
    return {
      id: entity.id,
      coffeeLotId: entity.coffeeLotId,
      initialWeight: entity.initialWeight,
      finalWeight: entity.finalWeight,
      yieldPercentage: entity.yieldPercentage,
      lossWeight: entity.lossWeight,
      productionTimeMinutes: entity.productionTimeMinutes,
      productivityPerHour: entity.productivityPerHour,
    };
  }

  toEntitiesFromResponse(_response: LotPerformanceListResponse): LotPerformance[] {
    return [];
  }

  toRegisterBody(entity: LotPerformance): RegisterLotPerformanceBody {
    return {
      coffeeLotId: Number(entity.coffeeLotId),
      initialWeight: Number(entity.initialWeight),
      finalWeight: Number(entity.finalWeight),
      productionTimeMinutes: Number(entity.productionTimeMinutes),
    };
  }
}
