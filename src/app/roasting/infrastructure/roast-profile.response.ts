import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface RoastProfileListResponse extends BaseResponse {}

/** Alineado con {@code RoastProfileResource} del backend ({@code lot} = coffee lot id). */
export interface RoastProfileResource extends BaseResource {
  roastProfileId?: number | string | null;
  userId: number;
  name: string;
  type: string;
  /** Compat: algunos backends usan duration, otros durationSeconds. */
  duration?: number | string | null;
  durationSeconds?: number | string | null;
  /** Compat: algunos backends usan tempStart/tempEnd, otros temperatureStart/temperatureEnd. */
  tempStart?: number | string | null;
  tempEnd?: number | string | null;
  temperatureStart?: number | string | null;
  temperatureEnd?: number | string | null;
  isFavorite: boolean;
  createdAt: string;
  lot?: number | string | null;
  coffeeLotId?: number | string | null;
  acidity?: number | string | null;
  sweetness?: number | string | null;
  body?: number | string | null;
}

export interface CreateRoastProfileBody {
  userId: number;
  name: string;
  type: string;
  durationSeconds: number;
  temperatureStart: number;
  temperatureEnd: number;
  coffeeLotId: number;
  /** Compat legacy */
  duration?: number;
  tempStart?: number;
  tempEnd?: number;
  /**
   * Compat: algunos backends esperan `lot` en vez de `coffeeLotId`.
   * Enviamos ambos para soportar ambas variantes.
   */
  lot?: number;
  isFavorite?: boolean;
  acidity?: number;
  sweetness?: number;
  body?: number;
}

export interface UpdateRoastProfileBody {
  name: string;
  type: string;
  durationSeconds: number;
  temperatureStart: number;
  temperatureEnd: number;
  /** Compat legacy */
  duration?: number;
  tempStart?: number;
  tempEnd?: number;
  isFavorite: boolean;
  acidity?: number;
  sweetness?: number;
  body?: number;
}
