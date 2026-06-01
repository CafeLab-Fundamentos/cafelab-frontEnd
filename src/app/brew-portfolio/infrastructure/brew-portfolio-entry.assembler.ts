import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { BrewPortfolioEntry } from '../domain/model/brew-portfolio-entry.entity';
import type {
  BrewPortfolioListResponse,
  BrewPortfolioResource,
} from './brew-portfolio-entry.response';

export class BrewPortfolioEntryAssembler
  implements BaseAssembler<BrewPortfolioEntry, BrewPortfolioResource, BrewPortfolioListResponse>
{
  toEntityFromResource(resource: BrewPortfolioResource): BrewPortfolioEntry {
    return {
      id: resource.id,
      userId: resource.userId,
      name: resource.name ?? '',
      createdAt: resource.createdAt ?? null,
    };
  }

  toResourceFromEntity(entity: BrewPortfolioEntry): BrewPortfolioResource {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      createdAt: entity.createdAt ?? '',
    };
  }

  toEntitiesFromResponse(_response: BrewPortfolioListResponse): BrewPortfolioEntry[] {
    return [];
  }

  toCreateBody(entity: BrewPortfolioEntry): { userId: number; name: string } {
    return { userId: Number(entity.userId), name: entity.name.trim() };
  }

  toUpdateBody(entity: BrewPortfolioEntry): { name: string } {
    return { name: entity.name.trim() };
  }
}
