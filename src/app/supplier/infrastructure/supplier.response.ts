import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface SupplierListResponse extends BaseResponse {}

/**
 * DTO alineado con {@code SupplierResource} del backend (lectura / respuesta POST-PUT).
 */
export interface SupplierResource extends BaseResource {
  supplierId: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  specialities: string[];
}

export interface CreateSupplierResource {
  userId: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  specialities: string[];
}

export interface UpdateSupplierResource {
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  specialities: string[];
}

export interface MessageResource {
  message: string;
}
