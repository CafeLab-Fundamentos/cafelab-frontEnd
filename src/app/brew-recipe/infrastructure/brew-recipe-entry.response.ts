import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface BrewRecipeListResponse extends BaseResponse {}

export interface BrewRecipeIngredientResource extends BaseResource {
  recipeId: number;
  name: string;
  amount: number;
  unit: string;
}

export interface BrewRecipeResource extends BaseResource {
  userId: number;
  name: string;
  imageUrl: string;
  extractionMethod: string;
  extractionCategory: string;
  ratio: string;
  cuppingSessionId: number | null;
  portfolioId: number | null;
  preparationTime: number;
  steps: string;
  tips: string | null;
  cupping: string;
  grindSize: string;
  createdAt: string;
  ingredients: BrewRecipeIngredientResource[];
}

export interface CreateBrewRecipeBody {
  userId: number;
  name: string;
  imageUrl: string;
  extractionMethod: string;
  extractionCategory: string;
  ratio: string;
  cuppingSessionId: number | null;
  portfolioId: number | null;
  preparationTime: number;
  steps: string;
  tips: string;
  cupping: string;
  grindSize: string;
}

export interface UpdateBrewRecipeBody {
  name: string;
  imageUrl: string;
  extractionMethod: string;
  extractionCategory: string;
  ratio: string;
  cuppingSessionId: number | null;
  portfolioId: number | null;
  preparationTime: number;
  steps: string;
  tips: string;
  cupping: string;
  grindSize: string;
}
