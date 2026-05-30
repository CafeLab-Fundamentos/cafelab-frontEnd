import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InventoryApi } from '../../../application/inventory.api';
import { InventoryEntry } from '../../../domain/model/inventory-entry.entity';
import { CoffeeLot } from '../../../../coffee-lot/domain/model/coffee-lot.entity';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {AuthService} from '../../../../auth/infrastructure/AuthService';

interface ConsumptionSummary {
  lotName: string;
  coffeeType: string;
  status: string;
  totalWeight: number;
  remainingWeight: number;
}

interface PreviousConsumption {
  date: string;
  quantity: number;
}

@Component({
  selector: 'app-register-consumption-dialog',
  standalone: true,
  templateUrl: './register-consumption-dialog.component.html',
  styleUrls: ['./register-consumption-dialog.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatButtonModule,
    TranslateModule,
  ],
})
export class RegisterConsumptionDialogComponent implements OnInit {
  form: FormGroup;
  availableLots: CoffeeLot[] = [];
  consumptionSummary: ConsumptionSummary | null = null;
  previousConsumptions: PreviousConsumption[] = [];
  loading = false;
  error: string | null = null;
  private previousConsumptionsLotId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RegisterConsumptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      coffeeStatus: string;
      coffeeType?: string;
      availableLots?: CoffeeLot[];
    },
    private coffeeLotApi: CoffeeLotApi,
    private authService: AuthService,
    private inventoryApi: InventoryApi,
    private translate: TranslateService,
  ) {
    this.form = this.fb.group({
      date: [new Date(), Validators.required],
      lotId: ['', Validators.required],
      finalProduct: ['', Validators.required],
      consumptionKg: [
        null,
        [Validators.required, Validators.min(0.001)],
      ],
    });

    this.form.valueChanges.subscribe(() => this.updateSummary());
  }

  ngOnInit(): void {
    this.loadAvailableLots();
  }

  loadAvailableLots(): void {
    const fromParent = this.data.availableLots;
    if (fromParent?.length) {
      this.availableLots = fromParent.filter(
        (lot) =>
          lot.status === this.data.coffeeStatus &&
          Number(lot.weight) > 0 &&
          (!this.data.coffeeType || lot.coffee_type === this.data.coffeeType),
      );
      return;
    }

    this.loading = true;
    this.coffeeLotApi
      .getAvailable()
      .pipe(
        catchError((err) => {
          console.error('Error loading lots:', err);
          return of([]);
        }),
      )
      .subscribe((lots) => {
        this.availableLots = lots.filter(
          (lot) =>
            lot.status === this.data.coffeeStatus &&
            Number(lot.weight) > 0 &&
            (!this.data.coffeeType || lot.coffee_type === this.data.coffeeType),
        );
        this.loading = false;
      });
  }

  updateSummary(): void {
    const selectedLotId = this.form.get('lotId')?.value;
    const consumptionKg = Number(this.form.get('consumptionKg')?.value) || 0;

    if (selectedLotId) {
      const selectedLot = this.availableLots.find(
        (lot) => Number(lot.id) === Number(selectedLotId),
      );
      if (selectedLot) {
        const remainingWeight = Math.max(0, selectedLot.weight - consumptionKg);
        this.consumptionSummary = {
          lotName: selectedLot.lot_name,
          coffeeType: selectedLot.coffee_type,
          status: selectedLot.status,
          totalWeight: selectedLot.weight,
          remainingWeight,
        };
        if (this.previousConsumptionsLotId !== Number(selectedLotId)) {
          this.loadPreviousConsumptions(selectedLotId);
        }
      }
    } else {
      this.consumptionSummary = null;
      this.previousConsumptions = [];
      this.previousConsumptionsLotId = null;
    }
  }

  loadPreviousConsumptions(lotId: number | string): void {
    const userId = Number(this.authService.getCurrentUserId());

    if (!userId || isNaN(userId)) {
      this.error = this.translate.instant('INVENTORY.ERRORS.AUTH_USER');
      return;
    }

    this.inventoryApi
      .getByUserId(userId)
      .pipe(
        catchError((err) => {
          console.error('Error loading consumption history:', err);
          return of([]);
        }),
      )
      .subscribe((entries) => {
        this.previousConsumptionsLotId = Number(lotId);
        const selectedLot = this.availableLots.find(
          (lot) => Number(lot.id) === Number(lotId),
        );
        if (selectedLot) {
          const consumptionKg = Number(this.form.get('consumptionKg')?.value) || 0;
          this.consumptionSummary = {
            lotName: selectedLot.lot_name,
            coffeeType: selectedLot.coffee_type,
            status: selectedLot.status,
            totalWeight: selectedLot.weight,
            remainingWeight: Math.max(0, selectedLot.weight - consumptionKg),
          };
        }

        this.previousConsumptions = entries
          .filter((entry) => Number(entry.coffeeLotId) === Number(lotId))
          .slice(0, 5)
          .map((entry) => ({
            date: new Date(entry.dateUsed).toLocaleDateString(),
            quantity: entry.quantityUsed,
          }));
      });
  }

  submit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const coffeeLotId = Number(formValue.lotId);

      if (!coffeeLotId || coffeeLotId <= 0) {
        this.error = this.translate.instant('INVENTORY.ERRORS.SELECT_VALID_LOT');
        return;
      }

      const qty = Number(formValue.consumptionKg);
      const lot = this.availableLots.find((l) => Number(l.id) === coffeeLotId);
      if (lot && qty > lot.weight) {
        this.error = this.translate.instant('INVENTORY.ERRORS.QUANTITY_EXCEEDS_STOCK');
        return;
      }

      const payload: InventoryEntry = {
        id: 0,
        userId: Number(this.authService.getCurrentUserId()),
        coffeeLotId,
        quantityUsed: qty,
        dateUsed: (formValue.date as Date).toISOString(),
        finalProduct: String(formValue.finalProduct).trim(),
      };

      this.dialogRef.close(payload);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  lotStatusLabel(status: string): string {
    if (status === 'green') {
      return this.translate.instant('FORM.STATUS_OPTIONS.GREEN');
    }
    if (status === 'roasted') {
      return this.translate.instant('FORM.STATUS_OPTIONS.ROASTED');
    }
    return this.translate.instant('COMMON.NOT_AVAILABLE');
  }

  getSelectedLotName(): string {
    const lotId = this.form.get('lotId')?.value;
    const lot = this.availableLots.find((l) => Number(l.id) === Number(lotId));
    return lot ? lot.lot_name : '';
  }
}
