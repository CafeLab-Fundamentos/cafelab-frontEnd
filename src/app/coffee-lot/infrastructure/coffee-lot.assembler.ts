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
  private normalizeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      /**
       * Corrige textos como:
       * CoffeeType[value=Robusta] -> Robusta
       * ProcessingMethod[value=Maceración carbónica] -> Maceración carbónica
       * LotStatus[value=En cuarentena] -> En cuarentena
       */
      const match = trimmed.match(/value=([^\]]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }

      return trimmed;
    }

    if (typeof value === 'object' && 'value' in value) {
      const objectValue = (value as { value: unknown }).value;
      return objectValue === null || objectValue === undefined
        ? ''
        : String(objectValue).trim();
    }

    return String(value).trim();
  }

  private toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  toEntityFromResource(resource: CoffeeLotResource): CoffeeLot {
    return {
      id: this.toNumber(resource.coffeeLotId ?? resource.id ?? resource.lotId),
      userId: this.toNumber(resource.userId),
      supplier_id: this.toNumber(resource.supplierId),

      lot_name: this.normalizeValue(resource.lotName),
      coffee_type: this.normalizeValue(resource.coffeeType),
      processing_method: this.normalizeValue(resource.processingMethod),

      altitude: this.toNumber(resource.altitudeMeters ?? resource.altitude),
      weight: this.toNumber(resource.remainingWeight ?? resource.initialWeight ?? resource.weight),

      origin: this.normalizeValue(resource.origin),
      status: this.normalizeValue(resource.status),
      certifications: resource.certifications ? [...resource.certifications] : [],
    };
  }

  toResourceFromEntity(entity: CoffeeLot): CoffeeLotResource {
    return {
      coffeeLotId: entity.id,
      id: entity.id,

      userId: entity.userId,
      supplierId: Number(entity.supplier_id),

      lotName: entity.lot_name,
      coffeeType: entity.coffee_type,
      processingMethod: entity.processing_method,

      altitudeMeters: entity.altitude,
      remainingWeight: entity.weight,
      initialWeight: entity.weight,

      origin: entity.origin,
      status: entity.status,
      certifications: entity.certifications ?? [],
    };
  }

  toEntitiesFromResponse(response: CoffeeLotListResponse): CoffeeLot[] {
    const maybeResources = response as unknown as CoffeeLotResource[];

    if (Array.isArray(maybeResources)) {
      return maybeResources.map((resource) => this.toEntityFromResource(resource));
    }

    return [];
  }

  toCreateResource(entity: CoffeeLot): CreateCoffeeLotResourceBody {
    return {
      supplierId: Number(entity.supplier_id),
      userId: Number(entity.userId),
      lotName: this.normalizeValue(entity.lot_name),
      coffeeType: this.normalizeValue(entity.coffee_type),
      origin: this.normalizeValue(entity.origin),
      altitudeMeters: this.toNumber(entity.altitude),
      status: this.normalizeValue(entity.status),
      initialWeight: this.toNumber(entity.weight),
      processingMethod: this.normalizeValue(entity.processing_method),
      certifications: entity.certifications ?? [],
    };
  }

  toUpdateResource(entity: CoffeeLot): UpdateCoffeeLotResourceBody {
    return {
      supplierId: Number(entity.supplier_id),
      userId: Number(entity.userId),
      lotName: this.normalizeValue(entity.lot_name),
      coffeeType: this.normalizeValue(entity.coffee_type),
      origin: this.normalizeValue(entity.origin),
      altitudeMeters: this.toNumber(entity.altitude),
      status: this.normalizeValue(entity.status),
      initialWeight: this.toNumber(entity.weight),
      processingMethod: this.normalizeValue(entity.processing_method),
      certifications: entity.certifications ?? [],
    };
  }
}
