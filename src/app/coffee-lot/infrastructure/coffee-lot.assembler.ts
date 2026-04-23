import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { CoffeeLot } from '../domain/model/coffee-lot.entity';
import type {
  CoffeeLotListResponse,
  CoffeeLotResource,
  CreateCoffeeLotResourceBody,
  UpdateCoffeeLotResourceBody,
} from './coffee-lot.response';

export class CoffeeLotAssembler
  implements BaseAssembler<CoffeeLot, CoffeeLotResource, CoffeeLotListResponse>
{
  toEntityFromResource(resource: CoffeeLotResource): CoffeeLot {
    return {
      id: resource.id,
      userId: resource.userId,
      supplier_id: Number(resource.supplierId),
      lot_name: (resource.lotName ?? '').trim(),
      coffee_type: (resource.coffeeType ?? '').trim(),
      processing_method: (resource.processingMethod ?? '').trim(),
      altitude: Number(resource.altitude),
      weight: Number(resource.weight),
      origin: (resource.origin ?? '').trim(),
      status: (resource.status ?? '').trim(),
      certifications: resource.certifications ? [...resource.certifications] : [],
    };
  }

  toResourceFromEntity(entity: CoffeeLot): CoffeeLotResource {
    return {
      id: entity.id,
      userId: entity.userId,
      supplierId: Number(entity.supplier_id),
      lotName: entity.lot_name,
      coffeeType: entity.coffee_type,
      processingMethod: entity.processing_method,
      altitude: entity.altitude,
      weight: entity.weight,
      origin: entity.origin,
      status: entity.status,
      certifications: entity.certifications ?? [],
    };
  }

  toEntitiesFromResponse(_response: CoffeeLotListResponse): CoffeeLot[] {
    return [];
  }

  toCreateResource(entity: CoffeeLot): CreateCoffeeLotResourceBody {
    return {
      supplier_id: Number(entity.supplier_id),
      lot_name: entity.lot_name.trim(),
      coffee_type: entity.coffee_type.trim(),
      processing_method: entity.processing_method.trim(),
      altitude: Number(entity.altitude),
      weight: Number(entity.weight),
      origin: entity.origin.trim(),
      status: entity.status.trim(),
      certifications: entity.certifications ?? [],
    };
  }

  toUpdateResource(entity: CoffeeLot): UpdateCoffeeLotResourceBody {
    return {
      lot_name: entity.lot_name.trim(),
      coffee_type: entity.coffee_type.trim(),
      processing_method: entity.processing_method.trim(),
      altitude: Number(entity.altitude),
      weight: Number(entity.weight),
      origin: entity.origin.trim(),
      status: entity.status.trim(),
      certifications: entity.certifications ?? [],
    };
  }
}
