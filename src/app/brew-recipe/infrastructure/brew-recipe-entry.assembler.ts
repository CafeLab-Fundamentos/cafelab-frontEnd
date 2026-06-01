import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type {
  BrewRecipeEntry,
  BrewRecipeIngredientEntry,
  ExtractionMethod,
} from '../domain/model/brew-recipe-entry.entity';
import type {
  BrewRecipeListResponse,
  BrewRecipeResource,
  CreateBrewRecipeBody,
  UpdateBrewRecipeBody,
} from './brew-recipe-entry.response';

function asExtractionMethod(v: string): ExtractionMethod {
  const allowed: ExtractionMethod[] = [
    'espresso',
    'pour-over',
    'french-press',
    'cold-brew',
    'aeropress',
    'chemex',
    'v60',
    'clever',
  ];
  return (allowed.includes(v as ExtractionMethod) ? v : 'pour-over') as ExtractionMethod;
}

export class BrewRecipeEntryAssembler
  implements BaseAssembler<BrewRecipeEntry, BrewRecipeResource, BrewRecipeListResponse>
{
  toEntityFromResource(resource: BrewRecipeResource): BrewRecipeEntry {
    const ingredients: BrewRecipeIngredientEntry[] = (resource.ingredients ?? []).map((i) => ({
      id: i.id,
      recipeId: i.recipeId,
      name: i.name ?? '',
      amount: Number(i.amount),
      unit: i.unit ?? '',
    }));
    return {
      id: resource.id,
      userId: resource.userId,
      name: resource.name ?? '',
      imageUrl: resource.imageUrl ?? '',
      extractionMethod: asExtractionMethod(resource.extractionMethod ?? 'pour-over'),
      extractionCategory:
        resource.extractionCategory === 'espresso' ? 'espresso' : 'coffee',
      ratio: resource.ratio ?? '',
      cuppingSessionId: resource.cuppingSessionId ?? null,
      portfolioId: resource.portfolioId ?? null,
      preparationTime: Number(resource.preparationTime ?? 0),
      steps: resource.steps ?? '',
      tips: resource.tips ?? '',
      cupping: resource.cupping ?? '',
      grindSize: resource.grindSize ?? '',
      createdAt: resource.createdAt ?? '',
      ingredients,
    };
  }

  toResourceFromEntity(_entity: BrewRecipeEntry): BrewRecipeResource {
    throw new Error('Not used: create/update usan cuerpos específicos');
  }

  toEntitiesFromResponse(_response: BrewRecipeListResponse): BrewRecipeEntry[] {
    return [];
  }

  toCreateBody(entity: BrewRecipeEntry): CreateBrewRecipeBody {
    const body: CreateBrewRecipeBody = {
      userId: Number(entity.userId),
      name: entity.name.trim(),
      imageUrl: entity.imageUrl.trim(),
      extractionMethod: entity.extractionMethod,
      extractionCategory: entity.extractionCategory,
      ratio: entity.ratio.trim(),
      cuppingSessionId:
        typeof entity.cuppingSessionId === 'number' && Number.isFinite(entity.cuppingSessionId)
          ? entity.cuppingSessionId
          : null,
      portfolioId:
        typeof entity.portfolioId === 'number' && Number.isFinite(entity.portfolioId)
          ? entity.portfolioId
          : null,
      preparationTime:
        typeof entity.preparationTime === 'number' && Number.isFinite(entity.preparationTime)
          ? entity.preparationTime
          : Math.max(0, Math.trunc(Number(entity.preparationTime)) || 0),
      steps: entity.steps.trim(),
      tips: entity.tips?.trim() ?? '',
      cupping: entity.cupping?.trim() ?? '',
      grindSize: entity.grindSize?.trim() || '-',
    };

    return body;
  }

  toUpdateBody(entity: BrewRecipeEntry): UpdateBrewRecipeBody {
    return this.toCreateBody(entity);
  }
}
