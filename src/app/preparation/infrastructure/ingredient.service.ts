import { Injectable } from '@angular/core';
import { Observable, forkJoin, switchMap, of, from } from 'rxjs';
import { concatMap, toArray } from 'rxjs/operators';
import { BaseService } from '../../shared/infrastructure/base.service';
import { Ingredient } from '../domain/model/ingredient.entity';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class IngredientService extends BaseService<Ingredient> {
  constructor(protected override http: HttpClient) {
    super(http);
    this.resourceEndpoint = environment.ingredientsEndpointPath;
  }

  private getEndpointUrl(recipeId: number): string {
    return `${environment.serverBaseUrl}${this.resourceEndpoint.replace('{recipeId}', recipeId.toString())}`;
  }

  private buildIngredientPayload(
    recipeId: number,
    ingredientData: { name: string; amount: number; unit: string },
  ): Pick<Ingredient, 'recipeId' | 'name' | 'amount' | 'unit'> {
    return {
      recipeId: Number(recipeId),
      name: String(ingredientData.name ?? '').trim(),
      amount: Number(ingredientData.amount),
      unit: String(ingredientData.unit ?? '').trim(),
    };
  }

  /**
   * Obtiene todos los ingredientes de una receta específica
   * @param recipeId - ID de la receta
   * @returns Observable con los ingredientes de la receta
   */
  getByRecipeId(recipeId: number): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(this.getEndpointUrl(recipeId));
  }

  /**
   * Crea múltiples ingredientes para una receta
   * @param recipeId - ID de la receta
   * @param ingredients - Array de datos de ingredientes
   * @returns Observable con los ingredientes creados
   */
  createMultiple(recipeId: number, ingredients: { name: string; amount: number; unit: string }[]): Observable<Ingredient[]> {
    if (ingredients.length === 0) {
      return of([]);
    }

    return from(ingredients).pipe(
      concatMap((ingredientData) =>
        this.http.post<Ingredient>(
          this.getEndpointUrl(recipeId),
          this.buildIngredientPayload(recipeId, ingredientData),
        ),
      ),
      toArray(),
    );
  }

  deleteMany(recipeId: number, ingredients: Pick<Ingredient, 'id'>[]): Observable<void[]> {
    if (ingredients.length === 0) {
      return of([]);
    }

    return from(ingredients).pipe(
      concatMap((ingredient) =>
        this.http.delete<void>(`${this.getEndpointUrl(recipeId)}/${ingredient.id}`),
      ),
      toArray(),
    );
  }

  /**
   * Actualiza los ingredientes de una receta
   * @param recipeId - ID de la receta
   * @param ingredients - Array de datos de ingredientes
   * @returns Observable con los ingredientes actualizados
   */
  updateRecipeIngredients(recipeId: number, ingredients: { name: string; amount: number; unit: string }[]): Observable<Ingredient[]> {
    return this.getByRecipeId(recipeId).pipe(
      switchMap(existingIngredients => {
        const sharedCount = Math.min(existingIngredients.length, ingredients.length);

        const updateObservables = existingIngredients.slice(0, sharedCount).map((ingredient, index) =>
          this.updateIngredient(
            recipeId,
            ingredient.id,
            this.buildIngredientPayload(recipeId, ingredients[index]),
          )
        );

        const ingredientsToCreate = ingredients.slice(sharedCount);
        const createObservables = ingredientsToCreate.map((ingredientData) =>
          this.http.post<Ingredient>(
            this.getEndpointUrl(recipeId),
            this.buildIngredientPayload(recipeId, ingredientData),
          )
        );

        const operations = [
          ...updateObservables,
          ...createObservables,
        ];

        if (operations.length === 0) {
          return this.getByRecipeId(recipeId);
        }

        return forkJoin(operations).pipe(
          switchMap(() => this.getByRecipeId(recipeId))
        );
      })
    );
  }

  /**
   * Elimina todos los ingredientes de una receta
   * @param recipeId - ID de la receta
   * @returns Observable de la operación
   */
  deleteByRecipeId(recipeId: number): Observable<any> {
    return this.getByRecipeId(recipeId).pipe(
      switchMap(ingredients => {
        return this.deleteMany(recipeId, ingredients);
      })
    );
  }

  /**
   * Actualiza un ingrediente específico
   * @param recipeId - ID de la receta
   * @param ingredientId - ID del ingrediente
   * @param ingredient - Datos del ingrediente
   * @returns Observable con el ingrediente actualizado
   */
  updateIngredient(recipeId: number, ingredientId: number, ingredient: Partial<Ingredient>): Observable<Ingredient> {
    return this.http.put<Ingredient>(`${this.getEndpointUrl(recipeId)}/${ingredientId}`, ingredient);
  }
}
