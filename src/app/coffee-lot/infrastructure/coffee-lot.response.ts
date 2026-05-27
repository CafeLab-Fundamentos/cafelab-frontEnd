import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface CoffeeLotListResponse extends BaseResponse {}

/**
 * Respuesta GET del backend.
 *
 * Algunos campos pueden llegar como string simple:
 *   "Robusta"
 *
 * o como objeto:
 *   { value: "Robusta" }
 *
 * o incluso como texto serializado:
 *   "CoffeeType[value=Robusta]"
 *
 * Por eso se tipan de forma flexible y se normalizan en CoffeeLotAssembler.
 */
export type BackendValue = string | { value: string } | null | undefined;

export interface CoffeeLotResource extends BaseResource {
  userId: number;
  supplierId: number | string | null;
  lotName: string | null;
  coffeeType: BackendValue;
  processingMethod: BackendValue;
  altitude: number | string | null;
  weight: number | string | null;
  origin: string | null;
  status: BackendValue;
  certifications: string[] | null;
}

export interface CreateCoffeeLotResourceBody {
  supplier_id: number;
  lot_name: string;
  coffee_type: string;
  processing_method: string;
  altitude: number;
  weight: number;
  origin: string;
  status: string;
  certifications: string[];
}

export interface UpdateCoffeeLotResourceBody {
  lot_name: string;
  coffee_type: string;
  processing_method: string;
  altitude: number;
  weight: number;
  origin: string;
  status: string;
  certifications: string[];
}
