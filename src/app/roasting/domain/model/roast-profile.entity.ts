import type { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Perfil de tueste. {@code id === 0} en borradores de UI. {@code lot} es el id del lote de café.
 */
export interface RoastProfile extends BaseEntity {
  userId: number;
  name: string;
  type: string;
  duration: number;
  tempStart: number;
  tempEnd: number;
  isFavorite: boolean;
  createdAt?: string | Date;
  lot: number;
  acidity:number;
  sweetness:number;
  body:number;
}