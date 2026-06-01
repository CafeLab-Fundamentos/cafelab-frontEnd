import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PortfolioService } from '../../../infrastructure/portfolio.service';
import { RecipeService } from '../../../infrastructure/recipe.service';
import { Portfolio } from '../../../domain/model/portfolio.entity';
import { Recipe } from '../../../domain/model/recipe.entity';
import { AddRecipeDialogComponent } from '../../components/add-recipe-dialog/add-recipe-dialog.component';
import { CreatePortfolioDialogComponent } from '../../components/create-portfolio-dialog/create-portfolio-dialog.component';
import { MatToolbar } from '@angular/material/toolbar';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { AuthService } from '../../../../auth/infrastructure/AuthService';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    TranslateModule,
    MatToolbar,
    ToolbarComponent
  ],
  templateUrl: './portfolio-detail.component.html',
  styleUrls: ['./portfolio-detail.component.css', '../preparation-breadcrumb-shell.css'],
})
export class PortfolioDetailComponent implements OnInit {
  portfolio: Portfolio | null = null;
  portfolioRecipes: Recipe[] = [];
  portfolioId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portfolioService: PortfolioService,
    private recipeService: RecipeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (isNaN(id)) {
        this.router.navigate(['/preparation/recipes']);
        return;
      }
      this.portfolioId = id;
      this.loadPortfolio();
      this.loadPortfolioRecipes();
    });
  }

  private loadPortfolio(): void {
    this.portfolioService.getById(this.portfolioId).subscribe({
      next: p => this.portfolio = p,
      error: () => {
        this.snackBar.open(
          this.translate.instant('portfolio.messages.error_loading'),
          this.translate.instant('portfolio.actions.cancel'),
          { duration: 3000 }
        );
        this.router.navigate(['/preparation/recipes']);
      }
    });
  }

  private loadPortfolioRecipes(): void {
    this.recipeService.getAll().subscribe({
      next: recipes => {
        this.portfolioRecipes = recipes.filter(r => this.belongsToCurrentPortfolio(r));
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('recipes.messages.error_loading'),
          this.translate.instant('portfolio.actions.cancel'),
          { duration: 3000 }
        );
      }
    });
  }

  openAddRecipesDialog(): void {
    const ref = this.dialog.open(AddRecipeDialogComponent, {
      width: '500px',
      data: { portfolioId: this.portfolioId }
    });
    ref.afterClosed().subscribe((ids: number[]) => {
      if (ids?.length) this.addRecipesToPortfolio(ids);
    });
  }

  private addRecipesToPortfolio(ids: number[]): void {
    const updates = ids.map(id =>
      this.recipeService.getById(id).pipe(
        switchMap(recipe =>
          this.recipeService.update(id, { ...recipe, portfolioId: this.portfolioId })
        )
      )
    );
    forkJoin(updates).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('recipes.messages.added'),
          this.translate.instant('portfolio.actions.cancel'),
          { duration: 3000 }
        );
        this.loadPortfolioRecipes();
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('recipes.messages.error_adding'),
          this.translate.instant('portfolio.actions.cancel'),
          { duration: 3000 }
        );
      }
    });
  }

  removeRecipeFromPortfolio(id: number): void {
    this.recipeService.getById(id).pipe(
      switchMap(recipe =>
        this.recipeService.update(id, { ...recipe, portfolioId: null })
      )
    ).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('recipes.messages.removed'),
          this.translate.instant('portfolio.actions.cancel'),
          { duration: 3000 }
        );
        this.portfolioRecipes = this.portfolioRecipes.filter(r => r.id !== id);
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('recipes.messages.error_removing'),
          this.translate.instant('portfolio.actions.cancel'),
          { duration: 3000 }
        );
      }
    });
  }

  openEditDialog(): void {
    if (!this.portfolio) return;
    const ref = this.dialog.open(CreatePortfolioDialogComponent, {
      width: '400px',
      data: { name: this.portfolio.name }
    });
    ref.afterClosed().subscribe(result => {
      if (result?.name && this.portfolio && result.name !== this.portfolio.name) {
        this.updatePortfolioName(result.name);
      }
    });
  }

  private updatePortfolioName(name: string): void {
    if (!this.portfolio) return;
    this.portfolioService.update(this.portfolioId, { ...this.portfolio, name }).subscribe({
      next: p => {
        this.portfolio = p;
        this.snackBar.open(
          this.translate.instant('portfolio.messages.updated'),
          this.translate.instant('portfolio.actions.cancel'),
          { duration: 3000 }
        );
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('portfolio.messages.error_updating'),
          this.translate.instant('portfolio.actions.cancel'),
          { duration: 3000 }
        );
      }
    });
  }

  deletePortfolio(): void {
    if (!this.portfolio) return;

    const dialogRef = this.dialog.open(DeletePortfolioConfirmationDialog, {
      width: '400px',
      data: { portfolioName: this.portfolio.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.recipeService.getAll().subscribe({
          next: allRecipes => {
            const linked = allRecipes.filter(r => this.belongsToCurrentPortfolio(r));
            
            if (linked.length === 0) {
              this.deletePortfolioRecord();
              return;
            }

            const removals = linked.map(r =>
              this.recipeService.update(r.id, { ...r, portfolioId: null })
            );
            
            forkJoin(removals).subscribe({
              next: () => this.deletePortfolioRecord(),
              error: () => {
                this.snackBar.open(
                  this.translate.instant('recipes.messages.error_removing'),
                  this.translate.instant('portfolio.actions.cancel'),
                  { duration: 3000 }
                );
              }
            });
          },
          error: () => {
            this.snackBar.open(
              this.translate.instant('recipes.messages.error_loading'),
              this.translate.instant('portfolio.actions.cancel'),
              { duration: 3000 }
            );
          }
        });
      }
    });
  }

  private belongsToCurrentPortfolio(recipe: Recipe): boolean {
    if (recipe.portfolioId === null || recipe.portfolioId === undefined) {
      return false;
    }

    return Number(recipe.portfolioId) === Number(this.portfolioId);
  }

  private deletePortfolioRecord(): void {
    this.portfolioService.delete(this.portfolioId).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('portfolio.messages.deleted'),
          this.translate.instant('Cerrar'),
          { duration: 3000 }
        );
        this.router.navigate(['/preparation/recipes']);
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('portfolio.messages.error_deleting'),
          this.translate.instant('Cerrar'),
          { duration: 3000 }
        );
      }
    });
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
  selector: 'delete-portfolio-confirmation-dialog',
  template: `
    <h2 mat-dialog-title>{{ 'portfolio.delete_confirmation_title' | translate }}</h2>
    <mat-dialog-content>
      {{ 'portfolio.delete_confirmation_message' | translate: { name: data.portfolioName } }}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">
        {{ 'portfolio.actions.cancel' | translate }}
      </button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        {{ 'portfolio.actions.delete' | translate }}
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
export class DeletePortfolioConfirmationDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { portfolioName: string }) {}
}
