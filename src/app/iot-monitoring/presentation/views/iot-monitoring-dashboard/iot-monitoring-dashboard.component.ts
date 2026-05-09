import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatToolbar } from '@angular/material/toolbar';
import { interval, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { IoTMonitoringData, IoTMonitoringHistory, ThresholdRange } from '../../../domain/model/environmental-reading.entity';
import { ConfigureThresholdsDialogComponent } from '../../components/configure-thresholds-dialog/configure-thresholds-dialog.component';

@Component({
  selector: 'app-iot-monitoring-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatListModule,
    MatToolbar,
    ToolbarComponent,
    TranslateModule,
  ],
  templateUrl: './iot-monitoring-dashboard.component.html',
  styleUrls: ['./iot-monitoring-dashboard.component.css', '../iot-monitoring-breadcrumb-shell.css'],
})
export class IotMonitoringDashboardComponent implements OnInit, OnDestroy {
  monitoringData: IoTMonitoringData = {
    id: 1,
    sensorConnected: true,
    dehumidifierConnected: true,
    minTemperature: 18,
    maxTemperature: 24,
    minHumidity: 50,
    maxHumidity: 65,
    userId: 0,
  };

  thresholds: ThresholdRange = {
    minTemperature: 18,
    maxTemperature: 24,
    minHumidity: 50,
    maxHumidity: 65,
  };

  currentReading: IoTMonitoringHistory = {
    id: 0,
    connectionState: true,
    temperature: 22.1,
    humidity: 56,
    iotMonitoringDataId: 1,
    timestamp: new Date(),
  };

  readingHistory: IoTMonitoringHistory[] = [];
  activeAlerts: string[] = [];
  lastUpdate: Date = new Date();
  readonly refreshSeconds = 10;

  private refreshSubscription?: Subscription;

  constructor(
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = Number(this.authService.getCurrentUserId() || '0');
    this.monitoringData = { ...this.monitoringData, userId };
    this.loadDashboardData();
    this.refreshSubscription = interval(this.refreshSeconds * 1000).subscribe(() => this.loadDashboardData());
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  get environmentStatusKey(): string {
    const isTempInRange =
      this.currentReading.temperature >= this.thresholds.minTemperature &&
      this.currentReading.temperature <= this.thresholds.maxTemperature;
    const isHumidityInRange =
      this.currentReading.humidity >= this.thresholds.minHumidity &&
      this.currentReading.humidity <= this.thresholds.maxHumidity;

    return isTempInRange && isHumidityInRange ? 'IOT.DASHBOARD.STATUS_OPTIMAL' : 'IOT.DASHBOARD.STATUS_WARNING';
  }

  get dehumidifierStatusKey(): string {
    return this.currentReading.humidity > this.thresholds.maxHumidity && this.monitoringData.dehumidifierConnected
      ? 'IOT.DASHBOARD.DEHUMIDIFIER_ON'
      : 'IOT.DASHBOARD.DEHUMIDIFIER_OFF';
  }

  openConfigureRanges(): void {
    const dialogRef = this.dialog.open(ConfigureThresholdsDialogComponent, {
      width: '520px',
      data: this.thresholds,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result?: ThresholdRange) => {
      if (!result) {
        return;
      }

      this.thresholds = { ...result };
      this.monitoringData = {
        ...this.monitoringData,
        minTemperature: result.minTemperature,
        maxTemperature: result.maxTemperature,
        minHumidity: result.minHumidity,
        maxHumidity: result.maxHumidity,
      };
      this.loadDashboardData();
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

  private loadDashboardData(): void {
    const reading = this.generateMockReading();
    this.currentReading = reading;
    this.lastUpdate = reading.timestamp;
    this.activeAlerts = this.buildMockAlerts(reading);
    this.readingHistory = [reading, ...this.readingHistory].slice(0, 20);
  }

  private generateMockReading(): IoTMonitoringHistory {
    const deltaTemperature = (Math.random() * 2 - 1.1).toFixed(1);
    const deltaHumidity = (Math.random() * 4 - 2).toFixed(0);

    const nextTemperature = Math.max(10, Math.min(30, this.currentReading.temperature + Number(deltaTemperature)));
    const nextHumidity = Math.max(40, Math.min(80, this.currentReading.humidity + Number(deltaHumidity)));

    return {
      id: this.readingHistory.length + 1,
      connectionState: this.monitoringData.sensorConnected,
      temperature: Number(nextTemperature.toFixed(1)),
      humidity: Number(nextHumidity.toFixed(0)),
      iotMonitoringDataId: this.monitoringData.id,
      timestamp: new Date(),
    };
  }

  private buildMockAlerts(reading: IoTMonitoringHistory): string[] {
    const alerts: string[] = [];
    if (reading.temperature < this.thresholds.minTemperature) {
      alerts.push('IOT.ALERTS.TEMPERATURE_BELOW_MIN');
    }
    if (reading.temperature > this.thresholds.maxTemperature) {
      alerts.push('IOT.ALERTS.TEMPERATURE_ABOVE_MAX');
    }
    if (reading.humidity < this.thresholds.minHumidity) {
      alerts.push('IOT.ALERTS.HUMIDITY_BELOW_MIN');
    }
    if (reading.humidity > this.thresholds.maxHumidity) {
      alerts.push('IOT.ALERTS.HUMIDITY_ABOVE_MAX');
    }
    return alerts;
  }
}
