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
    return {
      id: resource.id,
      userId: resource.userId,
      name: resource.name ?? '',
      type: resource.type ?? '',
      duration: this.toNumber(resource.durationSeconds ?? resource.duration),
      tempStart: this.toNumber(resource.temperatureStart ?? resource.tempStart),
      tempEnd: this.toNumber(resource.temperatureEnd ?? resource.tempEnd),
      isFavorite: Boolean(resource.isFavorite),
      createdAt: resource.createdAt,
      lot: this.toNumber(resource.coffeeLotId ?? resource.lot),
      acidity: this.toNumber(resource.acidity),
      sweetness: this.toNumber(resource.sweetness),
      body: this.toNumber(resource.body),
    };
  }

  toResourceFromEntity(entity: RoastProfile): RoastProfileResource {
    return {
      id: entity.id,
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
      acidity: entity.acidity,
      sweetness: entity.sweetness,
      body: entity.body,
    };
  }

  toEntitiesFromResponse(_response: RoastProfileListResponse): RoastProfile[] {
    return [];
  }

  toCreateResource(entity: RoastProfile): CreateRoastProfileBody {
    const lotId = Number(entity.lot);
    return {
      userId: Number(entity.userId),
      name: entity.name.trim(),
      temperatureStart: this.toNumber(entity.tempStart),
      temperatureEnd: this.toNumber(entity.tempEnd),
      durationSeconds: this.toNumber(entity.duration),
      type: entity.type.trim(),
      tempStart: this.toNumber(entity.tempStart),
      tempEnd: this.toNumber(entity.tempEnd),
      duration: this.toNumber(entity.duration),
      lot: lotId,
      coffeeLotId: lotId,
      isFavorite: entity.isFavorite ?? false,
      acidity: entity.acidity,
      sweetness: entity.sweetness,
      body: entity.body,
    };
  }

  toUpdateResource(entity: RoastProfile): UpdateRoastProfileBody {
    const lotId = Number(entity.lot);
    return {
      userId: Number(entity.userId),
      name: entity.name.trim(),
      temperatureStart: this.toNumber(entity.tempStart),
      temperatureEnd: this.toNumber(entity.tempEnd),
      durationSeconds: this.toNumber(entity.duration),
      type: entity.type.trim(),
      tempStart: this.toNumber(entity.tempStart),
      tempEnd: this.toNumber(entity.tempEnd),
      duration: this.toNumber(entity.duration),
      lot: lotId,
      coffeeLotId: lotId,
      isFavorite: Boolean(entity.isFavorite),
      acidity: entity.acidity,
      sweetness: entity.sweetness,
      body: entity.body,
    };
  }
}
