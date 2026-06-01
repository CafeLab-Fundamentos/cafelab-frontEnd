import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { GrindCalibrationEntry } from '../domain/model/grind-calibration-entry.entity';
import type {
  CreateGrindCalibrationBody,
  GrindCalibrationListResponse,
  GrindCalibrationResource,
  UpdateGrindCalibrationBody,
} from './grind-calibration-entry.response';

function calibrationDateToIso(v: unknown): string {
  if (v == null) {
    return '';
  }
  if (typeof v === 'string') {
    return v.length >= 10 ? v.slice(0, 10) : v;
  }
  if (Array.isArray(v) && v.length >= 3) {
    const y = v[0];
    const m = String(v[1]).padStart(2, '0');
    const d = String(v[2]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v);
}

export class GrindCalibrationEntryAssembler
  implements
    BaseAssembler<
      GrindCalibrationEntry,
      GrindCalibrationResource,
      GrindCalibrationListResponse
    >
{
  toEntityFromResource(resource: GrindCalibrationResource): GrindCalibrationEntry {
    return {
      id: resource.id,
      userId: resource.userId,
      name: resource.name ?? '',
      method: resource.method ?? '',
      equipment: resource.equipment ?? '',
      grindNumber: resource.grindNumber ?? '',
      aperture: Number(resource.aperture),
      cupVolume: Number(resource.cupVolume),
      finalVolume: Number(resource.finalVolume),
      calibrationDate: calibrationDateToIso(resource.calibrationDate),
      comments: resource.comments ?? '',
      notes: resource.notes ?? '',
      sampleImage: resource.sampleImage ?? null,
    };
  }

  toResourceFromEntity(entity: GrindCalibrationEntry): GrindCalibrationResource {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      method: entity.method,
      equipment: entity.equipment,
      grindNumber: entity.grindNumber,
      aperture: entity.aperture,
      cupVolume: entity.cupVolume,
      finalVolume: entity.finalVolume,
      calibrationDate: entity.calibrationDate,
      comments: entity.comments || null,
      notes: entity.notes || null,
      sampleImage: entity.sampleImage,
    };
  }

  toEntitiesFromResponse(_response: GrindCalibrationListResponse): GrindCalibrationEntry[] {
    return [];
  }

  toCreateBody(entity: GrindCalibrationEntry): CreateGrindCalibrationBody {
    const body: CreateGrindCalibrationBody = {
      userId: Number(entity.userId),
      name: entity.name.trim(),
      method: entity.method.trim(),
      equipment: entity.equipment.trim(),
      grindNumber: entity.grindNumber.trim(),
      aperture: Number(entity.aperture),
      cupVolume: Number(entity.cupVolume),
      finalVolume: Number(entity.finalVolume),
      calibrationDate: entity.calibrationDate.slice(0, 10),
      comments: entity.comments?.trim() || null,
      notes: entity.notes?.trim() || null,
    };
    if (entity.sampleImage) {
      body.sampleImage = entity.sampleImage;
    }
    return body;
  }

  toUpdateBody(entity: GrindCalibrationEntry): UpdateGrindCalibrationBody {
    return this.toCreateBody(entity);
  }
}
