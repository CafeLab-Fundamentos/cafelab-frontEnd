import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { RoastProfile } from '../domain/model/roast-profile.entity';
import type {
  CreateRoastProfileBody,
  RoastProfileListResponse,
  RoastProfileResource,
  UpdateRoastProfileBody,
} from './roast-profile.response';

export class RoastProfileAssembler
  implements BaseAssembler<RoastProfile, RoastProfileResource, RoastProfileListResponse>
{
  private toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  toEntityFromResource(resource: RoastProfileResource): RoastProfile {
    const profileId = this.toNumber(resource.roastProfileId ?? resource.id);
    const lotId = this.toNumber(resource.coffeeLotId ?? resource.lot);
    const duration = this.toNumber(resource.durationSeconds ?? resource.duration);
    const tempStart = this.toNumber(resource.temperatureStart ?? resource.tempStart);
    const tempEnd = this.toNumber(resource.temperatureEnd ?? resource.tempEnd);

    return {
      id: profileId,
      userId: this.toNumber(resource.userId),
      name: resource.name ?? '',
      type: resource.type ?? '',
      duration,
      tempStart,
      tempEnd,
      isFavorite: Boolean(resource.isFavorite),
      createdAt: resource.createdAt,
      lot: lotId,
    };
  }

  toResourceFromEntity(entity: RoastProfile): RoastProfileResource {
    return {
      id: entity.id,
      roastProfileId: entity.id,
      userId: entity.userId,
      name: entity.name,
      type: entity.type,
      duration: entity.duration,
      durationSeconds: entity.duration,
      tempStart: entity.tempStart,
      tempEnd: entity.tempEnd,
      temperatureStart: entity.tempStart,
      temperatureEnd: entity.tempEnd,
      isFavorite: entity.isFavorite,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt ?? ''),
      lot: entity.lot,
      coffeeLotId: entity.lot,
    };
  }

  toEntitiesFromResponse(_response: RoastProfileListResponse): RoastProfile[] {
    return [];
  }

  toCreateResource(entity: RoastProfile): CreateRoastProfileBody {
    const coffeeLotId = this.toNumber(entity.lot);

    return {
      userId: this.toNumber(entity.userId),
      name: entity.name.trim(),
      temperatureStart: this.toNumber(entity.tempStart),
      temperatureEnd: this.toNumber(entity.tempEnd),
      durationSeconds: this.toNumber(entity.duration),
      type: entity.type.trim(),
      coffeeLotId,
      isFavorite: entity.isFavorite ?? false,
    };
  }

  toUpdateResource(entity: RoastProfile): UpdateRoastProfileBody {
    const coffeeLotId = this.toNumber(entity.lot);

    return {
      userId: Number(entity.userId),
      name: entity.name.trim(),
      temperatureStart: this.toNumber(entity.tempStart),
      temperatureEnd: this.toNumber(entity.tempEnd),
      durationSeconds: this.toNumber(entity.duration),
      type: entity.type.trim(),
      coffeeLotId,
      isFavorite: Boolean(entity.isFavorite),
    };
  }
}
