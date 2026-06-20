import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { DashboardNavigationService } from '../../../../shared/infrastructure/dashboard-navigation.service';
import { MonitoredLotApi } from '../../../application/monitored-lot.api';
import type { MonitoredLotView } from '../../../domain/model/telemetry-record.entity';
import { MonitoringLotCardComponent } from '../../components/monitoring-lot-card/monitoring-lot-card.component';

const POLLING_INTERVAL_MS = 5_000;

@Component({
  selector: 'app-monitoring-lots-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbar,
    MatIconModule,
    RouterLink,
    ToolbarComponent,
    TranslatePipe,
    MonitoringLotCardComponent,
  ],
  templateUrl: './monitoring-lots-page.component.html',
  styleUrls: ['./monitoring-lots-page.component.css'],
})
export class MonitoringLotsPageComponent implements OnInit, OnDestroy {
  monitoredLots: MonitoredLotView[] = [];
  filteredLots: MonitoredLotView[] = [];
  searchQuery = '';
  loading = true;
  errorMessage = '';
  private pollingSubscription?: Subscription;

  constructor(
    private readonly monitoredLotApi: MonitoredLotApi,
    private readonly dashboardNavigation: DashboardNavigationService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.pollingSubscription = interval(POLLING_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.monitoredLotApi.getMonitoredLots()),
      )
      .subscribe({
        next: (lots) => {
          this.monitoredLots = lots;
          this.applyFilter();
          this.loading = false;
          this.errorMessage = '';
        },
        error: () => {
          this.loading = false;
          this.errorMessage = this.translate.instant(
            'MONITORING.LOTS.ERRORS.LOAD',
          );
        },
      });
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  get activeLotsCount(): number {
    return this.monitoredLots.filter((lot) => lot.temperature !== null).length;
  }

  get alertsCount(): number {
    return this.monitoredLots.filter(
      (lot) => lot.status === 'critical' || lot.status === 'warning',
    ).length;
  }

  get telemetryCoveragePercent(): number | null {
    if (this.monitoredLots.length === 0) {
      return null;
    }
    return Math.round((this.activeLotsCount / this.monitoredLots.length) * 100);
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  goToHome(): void {
    this.dashboardNavigation.goToHome();
  }

  private applyFilter(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredLots = !query
      ? [...this.monitoredLots]
      : this.monitoredLots.filter(
          (lot) =>
            lot.lotName.toLowerCase().includes(query) ||
            lot.coffeeType.toLowerCase().includes(query) ||
            String(lot.lotId).includes(query),
        );
  }
}
