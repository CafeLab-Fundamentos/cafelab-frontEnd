import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { Supplier } from '../domain/model/supplier.entity';
import type {
  CreateSupplierResource,
  SupplierListResponse,
  SupplierResource,
  UpdateSupplierResource,
} from './supplier.response';

export class SupplierAssembler
  implements BaseAssembler<Supplier, SupplierResource, SupplierListResponse>
{
  toEntityFromResource(resource: SupplierResource): Supplier {
    return {
      id: Number(resource.supplierId ?? resource.id ?? 0),
      userId: resource.userId,
      name: resource.name ?? '',
      email: resource.email ?? '',
      phone: String(resource.phone ?? ''),
      location: resource.location ?? '',
      status: ((resource.status ?? '').trim() || 'DRAFT') as Supplier['status'],
      specialties: this.copySpecialities(resource),
    };
  }

  toResourceFromEntity(entity: Supplier): SupplierResource {
    return {
      id: entity.id,
      supplierId: entity.id,
      userId: entity.userId,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      location: entity.location,
      status: this.normalizeStatus(entity.status),
      specialities: this.normalizeSpecialities(entity.specialties),
    };
  }

  toEntitiesFromResponse(_response: SupplierListResponse): Supplier[] {
    return [];
  }

  toCreateResource(entity: Supplier): CreateSupplierResource {
    return {
      userId: Number(entity.userId),
      name: entity.name.trim(),
      email: entity.email.trim().toLowerCase(),
      phone: String(entity.phone ?? '').trim(),
      location: entity.location.trim(),
      status: this.normalizeStatus(entity.status),
      specialities: this.normalizeSpecialities(entity.specialties),
    };
  }

  toUpdateResource(entity: Supplier): UpdateSupplierResource {
    return {
      name: entity.name.trim(),
      email: entity.email.trim().toLowerCase(),
      phone: String(entity.phone ?? '').trim(),
      location: entity.location.trim(),
      status: this.normalizeStatus(entity.status),
      specialities: this.normalizeSpecialities(entity.specialties),
    };
  }

  private copySpecialities(resource: SupplierResource): string[] {
    const legacyResource = resource as SupplierResource & { specialties?: string[] };
    const specialities = resource.specialities ?? legacyResource.specialties ?? [];
    return Array.isArray(specialities) ? [...specialities] : [];
  }

  private normalizeSpecialities(values: string[] | undefined): string[] {
    return (values ?? [])
      .map((value) => String(value ?? '').trim())
      .filter((value) => value.length > 0);
  }

  private normalizeStatus(status: string): string {
    return String(status ?? '').trim().toUpperCase();
  }
}
