import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface GrindCalibrationListResponse extends BaseResponse {}

export interface GrindCalibrationResource extends BaseResource {
  userId: number;
  name: string;
  method: string;
  equipment: string;
  grindNumber: string;
  aperture: number;
  cupVolume: number;
  finalVolume: number;
  
  calibrationDate: string | number[] | unknown;
  comments: string | null;
  notes: string | null;
  sampleImage: string | null;
}

export interface CreateGrindCalibrationBody {
  userId: number;
  name: string;
  method: string;
  equipment: string;
  grindNumber: string;
  aperture: number;
  cupVolume: number;
  finalVolume: number;
  calibrationDate: string;
  comments?: string | null;
  notes?: string | null;
  sampleImage?: string | null;
}

export type UpdateGrindCalibrationBody = CreateGrindCalibrationBody;
