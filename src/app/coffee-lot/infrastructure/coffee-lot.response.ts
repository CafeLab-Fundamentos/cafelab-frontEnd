import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface CoffeeLotListResponse extends BaseResponse {}

export type BackendValue = string | { value: string } | null | undefined;

export interface CoffeeLotResource extends BaseResource {
  id: number;
  coffeeLotId?: number | string | null;
  lotId?: number | string | null;

  supplierId: number | string | null;
  userId: number | string | null;

  lotName: string | null;
  coffeeType: BackendValue;
  origin: string | null;

  altitudeMeters?: number | string | null;
  altitude?: number | string | null;

  status: BackendValue;

  initialWeight?: number | string | null;
  remainingWeight?: number | string | null;
  weight?: number | string | null;

  processingMethod: BackendValue;
  certifications: string[] | null;
}

export interface CreateCoffeeLotResourceBody {
  supplierId: number;
  userId: number;
  lotName: string;
  coffeeType: string;
  origin: string;
  altitudeMeters: number;
  status: string;
  initialWeight: number;
  processingMethod: string;
  certifications: string[];
}

export interface UpdateCoffeeLotResourceBody {
  supplierId: number;
  userId: number;
  lotName: string;
  coffeeType: string;
  origin: string;
  altitudeMeters: number;
  status: string;
  initialWeight: number;
  processingMethod: string;
  certifications: string[];
}
