import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface BrewPortfolioListResponse extends BaseResponse {}

export interface BrewPortfolioResource extends BaseResource {
  userId: number;
  name: string;
  createdAt: string;
}

export interface CreateBrewPortfolioBody {
  userId: number;
  name: string;
}

export interface UpdateBrewPortfolioBody {
  name: string;
}
