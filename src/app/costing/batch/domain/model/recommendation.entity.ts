import type { BaseEntity } from '../../../../shared/infrastructure/base-entity';

export interface Recommendation extends BaseEntity {
  batchId: number;
  recommendationText: string;
}

export interface AddRecommendationRequest {
  recommendationText: string;
}
