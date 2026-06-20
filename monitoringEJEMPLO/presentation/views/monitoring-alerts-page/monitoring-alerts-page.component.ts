import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { DashboardNavigationService } from '../../../../shared/infrastructure/dashboard-navigation.service';
import { MonitoringAlertApi } from '../../../application/monitoring-alert.api';
import type {
  MonitoringAlert,
  MonitoringAlertFilter,
} from '../../../domain/model/monitoring-alert.entity';
import { MonitoringAlertCardComponent } from '../../components/monitoring-alert-card/monitoring-alert-card.component';

const POLLING_INTERVAL_MS = 5_000;

@Component({
  selector: 'app-monitoring-alerts-page',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbar,
    MatIconModule,
    RouterLink,
    ToolbarComponent,
    TranslatePipe,
    MonitoringAlertCardComponent,
  ],
  templateUrl: './monitoring-alerts-page.component.html',
  styleUrls: ['./monitoring-alerts-page.component.css'],
})
export class MonitoringAlertsPageComponent implements OnInit, OnDestroy {
  activeFilter: MonitoringAlertFilter = 'all';
  markAllMessage = '';
  alerts: MonitoringAlert[] = [];
  loading = true;
  errorMessage = '';
  private pollingSubscription?: Subscription;

  constructor(
    private readonly monitoringAlertApi: MonitoringAlertApi,
    private readonly dashboardNavigation: DashboardNavigationService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.pollingSubscription = interval(POLLING_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.monitoringAlertApi.getAlerts()),
      )
      .subscribe({
        next: (alerts) => {
          const dismissedById = new Map(
            this.alerts
              .filter((alert) => alert.dismissed)
              .map((alert) => [alert.id, true]),
          );
          this.alerts = alerts.map((alert) => ({
            ...alert,
            dismissed: dismissedById.get(alert.id) ?? false,
          }));
          this.loading = false;
          this.errorMessage = '';
        },
        error: () => {
          this.loading = false;
          this.errorMessage = this.translate.instant('MONITORING.ALERTS.ERRORS.LOAD');
        },
      });
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  get visibleAlerts(): MonitoringAlert[] {
    return this.alerts.filter((alert) => {
      if (alert.dismissed) {
        return false;
      }
      if (this.activeFilter === 'all') {
        return true;
      }
      return alert.severity === this.activeFilter;
    });
  }

  get pendingCount(): number {
    return this.alerts.filter((alert) => !alert.dismissed).length;
  }

  setFilter(filter: MonitoringAlertFilter): void {
    this.activeFilter = filter;
    this.markAllMessage = '';
  }

  markAllAsRead(): void {
    this.alerts = this.alerts.map((alert) => ({ ...alert, dismissed: true }));
    this.markAllMessage = 'MONITORING.ALERTS.MARK_ALL_SUCCESS';
  }

  goToHome(): void {
    this.dashboardNavigation.goToHome();
  }
}
