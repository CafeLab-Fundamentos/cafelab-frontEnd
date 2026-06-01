import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface CuppingSessionListResponse extends BaseResponse {}

export interface CuppingSessionResource extends BaseResource {
  userId: number;
  name: string;
  origin: string;
  variety: string;
  processing: string;
  sessionDate: string | number[] | unknown;
  favorite: boolean;
  resultsJson: string | null;
  roastStyleNotes: string | null;
}

export interface CreateCuppingSessionBody {
  userId: number;
  name: string;
  origin: string;
  variety: string;
  processing: string;
  sessionDate: string;
  favorite?: boolean;
  resultsJson?: string | null;
  roastStyleNotes?: string | null;
}

export interface UpdateCuppingSessionBody {
  id: number;
  userId: number;
  name: string;
  origin: string;
  variety: string;
  processing: string;
  sessionDate: string;
  favorite: boolean;
  resultsJson: string;
  roastStyleNotes?: string;
}
