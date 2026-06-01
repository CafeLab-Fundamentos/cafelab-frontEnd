import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { BatchApi } from '../../../application/batch.api';
import type { Batch } from '../../../domain/model/batch.entity';
import { CreateBatchDialogComponent } from '../create-batch-dialog/create-batch-dialog.component';

/**
 * Lista de batches del usuario autenticado. Cada fila navega al detalle
 * /costing/batches/:id y ofrece acción "Crear batch" en el header.
 */
@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <div style="background:#f4f2ed; min-height:100vh; padding:20px;">
      <div *ngIf="error" style="background:#ffebee;color:#c62828;padding:12px;border-radius:4px;margin-bottom:12px;border-left:4px solid #c62828;">
        {{ error }}
      </div>

      <div style="display:flex; justify-content:flex-end; margin-bottom:16px; gap:8px;">
        <button mat-stroked-button (click)="reload()" [disabled]="loading">
          <mat-icon>refresh</mat-icon>
          {{ 'COMMON.RELOAD' | translate }}
        </button>
        <button mat-raised-button (click)="openCreateDialog()"
                style="background:#4A5A54;color:white;border-radius:20px;padding:8px 24px;">
          <mat-icon>add</mat-icon>
          {{ 'COSTING_BC.BATCH.CREATE_BUTTON' | translate }}
        </button>
      </div>

      <div *ngIf="loading" style="text-align:center;padding:40px;color:#666;">
        {{ 'COMMON.LOADING' | translate }}
      </div>

      <div *ngIf="!loading" style="overflow:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);">
        <table mat-table [dataSource]="batches" style="width:100%;background:white;">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">ID</th>
            <td mat-cell *matCellDef="let row">#{{ row.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING_BC.BATCH.NAME' | translate }}</th>
            <td mat-cell *matCellDef="let row" style="font-weight:500;">{{ row.batchName }}</td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500;">{{ 'COSTING_BC.BATCH.REGISTRATION_DATE' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.registrationDate | date:'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef style="background:#4A5A54;color:white;font-weight:500; text-align:right;">{{ 'COMMON.ACTIONS' | translate }}</th>
            <td mat-cell *matCellDef="let row" style="text-align:right;">
              <button mat-button (click)="openDetail(row.id)" style="color:#4A5A54;">
                {{ 'COSTING_BC.BATCH.VIEW' | translate }}
                <mat-icon>chevron_right</mat-icon>
              </button>
              <button mat-icon-button (click)="confirmDelete(row, $event)" matTooltip="{{ 'COMMON.DELETE' | translate }}">
                <mat-icon style="color:#c62828;">delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              (click)="openDetail(row.id)"
              style="border-bottom:1px solid #eee; cursor:pointer;"></tr>
        </table>

        <div *ngIf="batches.length === 0 && !loading"
             style="text-align:center;padding:32px;color:#666;background:white;">
          {{ 'COSTING_BC.BATCH.NO_DATA' | translate }}
        </div>
      </div>
    </div>
  `,
})
export class BatchListComponent implements OnInit {
  batches: Batch[] = [];
  loading = false;
  error: string | null = null;

  displayedColumns = ['id', 'name', 'date', 'actions'];

  constructor(
    private readonly batchApi: BatchApi,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    this.batchApi
      .listMine()
      .pipe(
        catchError((err) => {
          this.error = err instanceof Error ? err.message : 'Error loading batches';
          return of([] as Batch[]);
        }),
      )
      .subscribe((data) => {
        this.batches = data;
        this.loading = false;
      });
  }

  openDetail(id: number): void {
    this.router.navigate(['/costing/batches', id]);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateBatchDialogComponent, { width: '440px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.batchApi
        .create({ batchName: result.batchName, registrationDate: result.registrationDate })
        .pipe(
          catchError((err) => {
            const msg = err instanceof Error ? err.message : 'Error creating batch';
            this.snackBar.open(msg, undefined, { duration: 5000 });
            return of(null);
          }),
        )
        .subscribe((created) => {
          if (created) {
            this.snackBar.open(
              this.translate.instant('COSTING_BC.BATCH.CREATED'),
              undefined,
              { duration: 3000 },
            );
            this.router.navigate(['/costing/batches', created.id]);
          }
        });
    });
  }

  confirmDelete(batch: Batch, event: MouseEvent): void {
    event.stopPropagation();
    const msg = this.translate.instant('COSTING_BC.BATCH.DELETE_CONFIRM', { name: batch.batchName });
    if (!window.confirm(msg)) return;
    this.batchApi
      .delete(batch.id)
      .pipe(
        catchError((err) => {
          const m = err instanceof Error ? err.message : 'Error deleting batch';
          this.snackBar.open(m, undefined, { duration: 5000 });
          return of(null);
        }),
      )
      .subscribe(() => {
        this.snackBar.open(
          this.translate.instant('COSTING_BC.BATCH.DELETED'),
          undefined,
          { duration: 3000 },
        );
        this.reload();
      });
  }
}
