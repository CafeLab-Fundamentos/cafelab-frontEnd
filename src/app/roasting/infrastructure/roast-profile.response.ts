import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface RoastProfileListResponse extends BaseResponse {}

/** Alineado con {@code RoastProfileResource} del backend ({@code lot} = coffee lot id). */
export interface RoastProfileResource extends BaseResource {
  userId: number;
  name: string;
  type: string;
  duration?: number;
  durationSeconds?: number;
  tempStart?: number;
  tempEnd?: number;
  temperatureStart?: number;
  temperatureEnd?: number;
  isFavorite: boolean;
  createdAt: string;
  lot: number;
  coffeeLotId?: number;
  acidity?: number;
  sweetness?: number;
  body?: number;
}

export interface CreateRoastProfileBody {
  userId: number;
  durationSeconds: number;
  name: string;
  type: string;
  duration?: number;
  temperatureStart: number;
  temperatureEnd: number;
  tempStart?: number;
  tempEnd?: number;
  lot: number;
  coffeeLotId?: number;
  isFavorite?: boolean; 
  acidity?: number;
  sweetness?: number;
  body?: number;
}

export interface UpdateRoastProfileBody {
  userId: number;
  name: string;
  type: string;
  durationSeconds: number;
  duration?: number;
  temperatureStart: number;
  temperatureEnd: number;
  tempStart?: number;
  tempEnd?: number;
  lot: number;
  coffeeLotId?: number;
  isFavorite: boolean;
  acidity?: number;
  sweetness?: number;
  body?: number;
}
