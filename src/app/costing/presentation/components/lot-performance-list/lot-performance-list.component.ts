import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { LotPerformanceApi } from '../../../application/lot-performance.api';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import type { LotPerformance } from '../../../domain/model/lot-performance.entity';
import type { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { RegisterLotPerformanceDialogComponent } from '../register-lot-performance-dialog/register-lot-performance-dialog.component';

function performanceCategory(yieldPct: number): string {
  if (yieldPct >= 85) return 'EXCELLENT';
  if (yieldPct >= 70) return 'GOOD';
  if (yieldPct >= 55) return 'AVERAGE';
  return 'POOR';
}

function categoryColor(cat: string): string {
  switch (cat) {
    case 'EXCELLENT': return '#2e7d32';
    case 'GOOD':      return '#388e3c';
    case 'AVERAGE':   return '#f57c00';
    default:          return '#c62828';
  }
}

@Component({
  selector: 'app-lot-performance-list',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  template: `
    <div style="background:#f4f2ed; min-height:100vh; padding:20px;">
      <div *ngIf="error" style="background:#ffebee;color:#c62828;padding:12px;border-radius:4px;margin-bottom:12px;border-left:4px solid #c62828;">
        {{ error }}
      </div>

      <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
        <button mat-raised-button (click)="openRegisterDialog()"
                style="background:#4A5A54;color:white;border-radius:20px;padding:8px 24px;">
          {{ 'COSTING.REGISTER_BUTTON' | translate }}
        </button>
      </div>

      <div *ngIf="loading" style="text-align:center;padding:40px;color:#666;">
        {{ 'COMMON.LOADING' | translate }}
      </div>

      <div *ngIf="!loading" style="overflow:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);">
        <table mat-table [dataSource]="performances" style="width:100%;background:white;">
          <ng-container matColumnDef="coffeeLotId">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING.COL_LOT' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ getLotName(row.coffeeLotId) }}</td>
          </ng-container>
          <ng-container matColumnDef="initialWeight">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING.COL_INITIAL_KG' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.initialWeight | number:'1.1-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="finalWeight">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING.COL_FINAL_KG' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.finalWeight | number:'1.1-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="yieldPercentage">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING.COL_YIELD' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <span [style.color]="categoryColor(row.yieldPercentage)" style="font-weight:600;">
                {{ row.yieldPercentage | number:'1.1-2' }}%
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="lossWeight">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING.COL_LOSS_KG' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.lossWeight | number:'1.1-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="productionTimeMinutes">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING.COL_TIME_MIN' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.productionTimeMinutes }}</td>
          </ng-container>
          <ng-container matColumnDef="productivityPerHour">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING.COL_PRODUCTIVITY' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.productivityPerHour | number:'1.1-2' }} kg/h</td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING.COL_CATEGORY' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <span [style.color]="categoryColor(row.yieldPercentage)"
                    style="font-weight:700;font-size:12px;padding:2px 8px;border-radius:12px;"
                    [style.background]="categoryBg(row.yieldPercentage)">
                {{ 'COSTING.CATEGORY.' + category(row.yieldPercentage) | translate }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" style="border-bottom:1px solid #eee;"></tr>
        </table>

        <div *ngIf="performances.length === 0 && !loading"
             style="text-align:center;padding:32px;color:#666;background:white;">
          {{ 'COSTING.NO_DATA' | translate }}
        </div>
      </div>
    </div>
  `,
})
export class LotPerformanceListComponent implements OnInit {
  performances: LotPerformance[] = [];
  lots: CoffeeLot[] = [];
  loading = false;
  error: string | null = null;

  displayedColumns = [
    'coffeeLotId', 'initialWeight', 'finalWeight',
    'yieldPercentage', 'lossWeight', 'productionTimeMinutes',
    'productivityPerHour', 'category',
  ];

  constructor(
    private readonly lotPerformanceApi: LotPerformanceApi,
    private readonly coffeeLotApi: CoffeeLotApi,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadLots();
    this.loadPerformances();
  }

  private loadLots(): void {
    this.coffeeLotApi.getAll().pipe(catchError(() => of([]))).subscribe(lots => {
      this.lots = lots;
    });
  }

  loadPerformances(): void {
    this.loading = true;
    this.error = null;
    this.lotPerformanceApi.getAll()
      .pipe(catchError(err => {
        this.error = err instanceof Error ? err.message : 'Error loading performances';
        return of([]);
      }))
      .subscribe(data => {
        this.performances = data;
        this.loading = false;
      });
  }

  getLotName(coffeeLotId: number): string {
    const lot = this.lots.find(l => l.id === coffeeLotId);
    return lot ? `${lot.lot_name} (${lot.coffee_type})` : `Lot #${coffeeLotId}`;
  }

  category(yieldPct: number): string {
    return performanceCategory(yieldPct);
  }

  categoryColor(yieldPct: number): string {
    return categoryColor(performanceCategory(yieldPct));
  }

  categoryBg(yieldPct: number): string {
    const cat = performanceCategory(yieldPct);
    switch (cat) {
      case 'EXCELLENT': return '#e8f5e9';
      case 'GOOD':      return '#f1f8e9';
      case 'AVERAGE':   return '#fff3e0';
      default:          return '#ffebee';
    }
  }

  openRegisterDialog(): void {
    if (this.lots.length === 0) {
      this.error = this.translate.instant('COSTING.ERRORS.NO_LOTS');
      return;
    }
    const ref = this.dialog.open(RegisterLotPerformanceDialogComponent, {
      width: '480px',
      data: { lots: this.lots },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.lotPerformanceApi
        .register(result.coffeeLotId, result.initialWeight, result.finalWeight, result.productionTimeMinutes)
        .pipe(catchError(err => {
          const msg = err instanceof Error ? err.message : 'Error registering performance';
          this.snackBar.open(msg, undefined, { duration: 5000 });
          return of(null);
        }))
        .subscribe(created => {
          if (created) {
            this.snackBar.open(
              this.translate.instant('COSTING.REGISTER_SUCCESS'),
              undefined,
              { duration: 3000 },
            );
            this.loadPerformances();
          }
        });
    });
  }
}
