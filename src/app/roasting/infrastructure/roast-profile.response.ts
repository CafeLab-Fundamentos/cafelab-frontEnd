import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface RoastProfileListResponse extends BaseResponse {}

/** Alineado con {@code RoastProfileResource} del backend ({@code lot} = coffee lot id). */
export interface RoastProfileResource extends BaseResource {
  roastProfileId?: number | string | null;
  userId: number;
  name: string;
  type: string;
  duration?: number | string | null;
  durationSeconds?: number | string | null;
  tempStart?: number | string | null;
  tempEnd?: number | string | null;
  temperatureStart?: number | string | null;
  temperatureEnd?: number | string | null;
  isFavorite: boolean;
  createdAt: string;
  lot?: number | string | null;
  coffeeLotId?: number | string | null;
}

export interface CreateRoastProfileBody {
  userId: number;
  name: string;
  type: string;
  durationSeconds: number;
  temperatureStart: number;
  temperatureEnd: number;
  coffeeLotId: number;
  isFavorite?: boolean;
}

export interface UpdateRoastProfileBody {
  userId: number;
  name: string;
  type: string;
  durationSeconds: number;
  temperatureStart: number;
  temperatureEnd: number;
  coffeeLotId: number;
  isFavorite: boolean;
}
