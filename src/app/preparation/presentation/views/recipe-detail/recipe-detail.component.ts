import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RecipeService } from '../../../infrastructure/recipe.service';
import { IngredientService } from '../../../infrastructure/ingredient.service';
import { PortfolioService } from '../../../infrastructure/portfolio.service';
import { Recipe } from '../../../domain/model/recipe.entity';
import { Ingredient } from '../../../domain/model/ingredient.entity';
import { Portfolio } from '../../../domain/model/portfolio.entity';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {MatToolbar} from '@angular/material/toolbar';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { RecipePdfService, RecipePdfLabels } from '../../../infrastructure/recipe-pdf.service';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule,
    RouterModule,
    TranslateModule,
    MatSnackBarModule,
    MatToolbar,
    ToolbarComponent,
    MatDialogModule
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.css', '../preparation-breadcrumb-shell.css'],
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  ingredients: Ingredient[] = [];
  portfolio: Portfolio | null = null;
  isLoading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private portfolioService: PortfolioService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private dialog: MatDialog,
    private authService: AuthService,
    private recipePdfService: RecipePdfService,
  ) {}

  ngOnInit(): void {
    const recipeId = this.route.snapshot.paramMap.get('id');
    if (!recipeId) {
      this.router.navigate(['/preparation/recipes']);
      return;
    }

    this.loadRecipe(recipeId);
  }

  private loadRecipe(id: string): void {
    this.isLoading = true;
    this.recipeService.getById(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        if (recipe.ingredients?.length) {
          this.ingredients = recipe.ingredients;
          if (recipe.portfolioId) {
            this.loadPortfolio(recipe.portfolioId);
          } else {
            this.isLoading = false;
          }
          return;
        }
        this.ingredientService.getByRecipeId(parseInt(id, 10)).subscribe({
          next: (ingredients) => {
            this.ingredients = ingredients;
            if (recipe.portfolioId) {
              this.loadPortfolio(recipe.portfolioId);
            } else {
              this.isLoading = false;
            }
          },
          error: () => {
            this.ingredients = [];
            if (recipe.portfolioId) {
              this.loadPortfolio(recipe.portfolioId);
            } else {
              this.isLoading = false;
            }
          },
        });
      },
      error: (err) => {
        console.error('Error al cargar la receta:', err);
        this.error = true;
        this.isLoading = false;
        this.snackBar.open(
          'Error al cargar la receta',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  private loadPortfolio(portfolioId: number): void {
    this.portfolioService.getById(portfolioId).subscribe({
      next: (portfolio) => {
        this.portfolio = portfolio;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el portafolio:', err);
        this.isLoading = false;
      }
    });
  }

  getNavigationPath(): string {
    return this.recipe?.portfolioId
      ? `/preparation/portfolios/${this.recipe.portfolioId}`
      : '/preparation/recipes';
  }

  getNavigationText(): string {
    return this.recipe?.portfolioId
      ? 'NAVIGATION.PORTFOLIO'
      : 'NAVIGATION.DRINKS';
  }

  editRecipe(): void {
    if (!this.recipe) return;
    this.router.navigate(['/preparation/recipes/edit', this.recipe.id]);
  }

  deleteRecipe(): void {
    if (!this.recipe) return;

    const dialogRef = this.dialog.open(DeleteConfirmationDialog, {
      width: '400px',
      data: { recipeName: this.recipe.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ingredientService.deleteMany(this.recipe!.id, this.ingredients).pipe(
          switchMap(() => this.recipeService.delete(this.recipe!.id))
        ).subscribe({
          next: () => {
            this.snackBar.open(
              this.translate.instant('recipes.detail.delete_success'),
              this.translate.instant('Cerrar'),
              { duration: 3000 }
            );
            this.router.navigate([this.getNavigationPath()]);
          },
          error: (err) => {
            console.error('Error deleting recipe:', err);
            this.snackBar.open(
              this.translate.instant('recipes.detail.delete_error'),
              this.translate.instant('Cerrar'),
              { duration: 3000 }
            );
          }
        });
      }
    });
  }

  downloadRecipePdf(): void {
    if (!this.recipe) return;

    void this.recipePdfService
      .downloadPdf(this.recipe, this.ingredients, this.buildPdfLabels())
      .catch((error) => {
        console.error('Error generating recipe PDF:', error);
        this.snackBar.open(
          this.translate.instant('recipes.detail.download_pdf_error'),
          this.translate.instant('Cerrar'),
          { duration: 3000 },
        );
      });
  }

  shareRecipe(): void {
    if (!this.recipe) return;

    const dialogRef = this.dialog.open(ShareRecipeDialog, { width: '400px' });

    dialogRef.afterClosed().subscribe((email: string | undefined) => {
      if (!email) return;

      const subject = encodeURIComponent(this.recipe!.name);
      const body = encodeURIComponent(this.buildShareEmailBody());
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');

      this.snackBar.open(
        this.translate.instant('recipes.detail.share_recipe_success'),
        this.translate.instant('Cerrar'),
        { duration: 4000 },
      );
    });
  }

  private buildShareEmailBody(): string {
    const recipe = this.recipe!;
    const labels = this.buildPdfLabels();
  
    const lines: string[] = [
      `☕ ${recipe.name}`,
      '',
      '────────────────────────────',
      '',
      this.translate.instant('recipes.detail.share_recipe_email_body', {
        name: recipe.name,
      }),
      '',
      '📋 ESPECIFICACIONES',
      '',
      `• ${this.translate.instant('recipes.creation.extraction_method')}: ${labels.extractionMethod}`,
    ];
  
    if (recipe.cupping) {
      lines.push(`• ${labels.cupping}: ${recipe.cupping}`);
    }
  
    if (recipe.grindSize) {
      lines.push(`• ${labels.grind}: ${recipe.grindSize}`);
    }
  
    if (recipe.ratio) {
      lines.push(`• ${labels.ratio}: ${recipe.ratio}`);
    }
  
    if (recipe.preparationTime != null) {
      lines.push(`• ${labels.time}: ${recipe.preparationTime}`);
    }
  
    if (this.ingredients.length) {
      lines.push('');
      lines.push('🧾 INGREDIENTES');
  
      this.ingredients.forEach((ingredient) => {
        lines.push(
          `   ◦ ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`
        );
      });
    }
  
    if (recipe.steps) {
      lines.push('');
      lines.push('👨‍🍳 PREPARACIÓN');
      lines.push(recipe.steps);
    }
  
    if (recipe.tips) {
      lines.push('');
      lines.push('💡 CONSEJOS');
      lines.push(recipe.tips);
    }
  
    lines.push('');
    lines.push(
      `📅 ${labels.createdAt}: ${new Date(recipe.createdAt).toLocaleDateString()}`
    );
  
    return lines.join('\n');
  }

  private buildPdfLabels(): RecipePdfLabels {
    const recipe = this.recipe!;
    let extractionMethod = '';

    if (recipe.extractionCategory === 'coffee') {
      extractionMethod = `${this.translate.instant('recipes.creation.extraction_methods.coffee')} - ${this.translate.instant('recipes.creation.extraction_methods.' + recipe.extractionMethod)}`;
    } else {
      extractionMethod = this.translate.instant('recipes.creation.extraction_methods.espresso');
    }

    return {
      extractionMethod,
      cupping: this.translate.instant('recipes.creation.cata'),
      grind: this.translate.instant('recipes.creation.molienda'),
      ratio: this.translate.instant('recipes.creation.ratio'),
      time: this.translate.instant('recipes.creation.tiempo'),
      ingredients: this.translate.instant('recipes.creation.ingredientes'),
      steps: this.translate.instant('recipes.creation.pasos'),
      tips: this.translate.instant('recipes.creation.consejos'),
      createdAt: this.translate.instant('recipes.detail.created_at'),
      ingredientName: this.translate.instant('recipes.creation.ingrediente'),
      amount: this.translate.instant('recipes.creation.medida'),
    };
  }

  goToHome(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      void this.router.navigate(['/login']);
      return;
    }
    if (user.home) {
      void this.router.navigate([user.home]);
      return;
    }
    switch (user.plan) {
      case 'barista':
        void this.router.navigate(['/dashboard/barista']);
        break;
      case 'owner':
        void this.router.navigate(['/dashboard/owner']);
        break;
      case 'full':
        void this.router.navigate(['/dashboard/complete']);
        break;
      default:
        void this.router.navigate(['/']);
    }
  }
}

@Component({
  selector: 'delete-confirmation-dialog',
  template: `
    <h2 mat-dialog-title>{{ 'recipes.detail.delete_confirmation_title' | translate }}</h2>
    <mat-dialog-content>
      {{ 'recipes.detail.delete_confirmation_message' | translate: { name: data.recipeName } }}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">
        {{ 'recipes.detail.cancel' | translate }}
      </button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        {{ 'recipes.detail.confirm_delete' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    TranslateModule
  ]
})
export class DeleteConfirmationDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { recipeName: string }) {}
}

@Component({
  selector: 'share-recipe-dialog',
  template: `
    <h2 mat-dialog-title>{{ 'recipes.detail.share_recipe_title' | translate }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="share-email-field">
        <mat-label>{{ 'recipes.detail.share_recipe_email' | translate }}</mat-label>
        <input
          matInput
          type="email"
          [(ngModel)]="email"
          [placeholder]="'recipes.detail.share_recipe_email_placeholder' | translate"
          (keyup.enter)="onShare()"
        />
      </mat-form-field>
      <p *ngIf="emailError" class="share-email-error">
        {{ emailError | translate }}
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ 'recipes.detail.cancel' | translate }}
      </button>
      <button mat-raised-button color="primary" (click)="onShare()">
        {{ 'recipes.detail.share_recipe_send' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .share-email-field {
      width: 100%;
      margin-top: 8px;
    }

    .share-email-error {
      color: #d32f2f;
      margin: 0;
      font-size: 0.85rem;
    }
  `],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslateModule,
    CommonModule,
  ],
})
export class ShareRecipeDialog {
  email = '';
  emailError = '';

  constructor(private dialogRef: MatDialogRef<ShareRecipeDialog>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onShare(): void {
    const trimmedEmail = this.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      this.emailError = 'recipes.detail.share_recipe_email_invalid';
      return;
    }

    this.emailError = '';
    this.dialogRef.close(trimmedEmail);
  }
}
