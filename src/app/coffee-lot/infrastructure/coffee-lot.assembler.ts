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
  /**
   * Normaliza valores que pueden venir del backend como:
   * - "Robusta"
   * - { value: "Robusta" }
   * - "CoffeeType[value=Robusta]"
   */
  private normalizeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      /**
       * Corrige textos como:
       * CoffeeType[value=Robusta]
       * ProcessingMethod[value=Lavado]
       * CoffeeLotStatus[value=green]
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

  /**
   * Convierte números de forma segura.
   * Evita mostrar NaN en la tabla cuando el backend manda null, undefined o string vacío.
   */
  private toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  toEntityFromResource(resource: CoffeeLotResource): CoffeeLot {
    return {
      id: this.toNumber(resource.id),
      userId: this.toNumber(resource.userId),
      supplier_id: this.toNumber(resource.supplierId),
      lot_name: this.normalizeValue(resource.lotName),
      coffee_type: this.normalizeValue(resource.coffeeType),
      processing_method: this.normalizeValue(resource.processingMethod),
      altitude: this.toNumber(resource.altitude),
      weight: this.toNumber(resource.weight),
      origin: this.normalizeValue(resource.origin),
      status: this.normalizeValue(resource.status),
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

  toEntitiesFromResponse(response: CoffeeLotListResponse): CoffeeLot[] {
    /**
     * En este módulo actualmente getAll() recibe directamente CoffeeLotResource[].
     * Se deja este método por compatibilidad con BaseAssembler.
     */
    const maybeResources = response as unknown as CoffeeLotResource[];

    if (Array.isArray(maybeResources)) {
      return maybeResources.map((resource) => this.toEntityFromResource(resource));
    }

    return [];
  }

  toCreateResource(entity: CoffeeLot): CreateCoffeeLotResourceBody {
    return {
      supplier_id: Number(entity.supplier_id),
      lot_name: this.normalizeValue(entity.lot_name),
      coffee_type: this.normalizeValue(entity.coffee_type),
      processing_method: this.normalizeValue(entity.processing_method),
      altitude: this.toNumber(entity.altitude),
      weight: this.toNumber(entity.weight),
      origin: this.normalizeValue(entity.origin),
      status: this.normalizeValue(entity.status),
      certifications: entity.certifications ?? [],
    };
  }

  toUpdateResource(entity: CoffeeLot): UpdateCoffeeLotResourceBody {
    return {
      lot_name: this.normalizeValue(entity.lot_name),
      coffee_type: this.normalizeValue(entity.coffee_type),
      processing_method: this.normalizeValue(entity.processing_method),
      altitude: this.toNumber(entity.altitude),
      weight: this.toNumber(entity.weight),
      origin: this.normalizeValue(entity.origin),
      status: this.normalizeValue(entity.status),
      certifications: entity.certifications ?? [],
    };
  }
}
