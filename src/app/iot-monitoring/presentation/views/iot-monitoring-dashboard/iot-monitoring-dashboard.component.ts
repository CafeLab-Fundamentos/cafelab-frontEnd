import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatToolbar } from '@angular/material/toolbar';
import { interval, Subscription } from 'rxjs';

import { AuthService } from '../../../../auth/infrastructure/AuthService';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { EnvironmentalReading, ThresholdRange } from '../../../domain/model/environmental-reading.entity';
import { ConfigureThresholdsDialogComponent } from '../../components/configure-thresholds-dialog/configure-thresholds-dialog.component';

@Component({
  selector: 'app-iot-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule, MatListModule, MatToolbar, ToolbarComponent],
  templateUrl: './iot-monitoring-dashboard.component.html',
  styleUrls: ['./iot-monitoring-dashboard.component.css', '../iot-monitoring-breadcrumb-shell.css'],
})
export class IotMonitoringDashboardComponent implements OnInit, OnDestroy {
  thresholds: ThresholdRange = {
    minTemperature: 18,
    maxTemperature: 24,
    minHumidity: 50,
    maxHumidity: 65,
  };

  currentReading: EnvironmentalReading = {
    temperature: 22.1,
    humidity: 56,
    timestamp: new Date(),
  };

  readingHistory: EnvironmentalReading[] = [];
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
    this.loadDashboardData();
    this.refreshSubscription = interval(this.refreshSeconds * 1000).subscribe(() => this.loadDashboardData());
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  get environmentStatus(): string {
    const isTempInRange =
      this.currentReading.temperature >= this.thresholds.minTemperature &&
      this.currentReading.temperature <= this.thresholds.maxTemperature;
    const isHumidityInRange =
      this.currentReading.humidity >= this.thresholds.minHumidity &&
      this.currentReading.humidity <= this.thresholds.maxHumidity;

    return isTempInRange && isHumidityInRange ? 'Estable' : 'Fuera de rango';
  }

  get dehumidifierStatus(): string {
    return this.currentReading.humidity > this.thresholds.maxHumidity ? 'Activo' : 'En espera';
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

  private generateMockReading(): EnvironmentalReading {
    const deltaTemperature = (Math.random() * 2 - 1.1).toFixed(1);
    const deltaHumidity = (Math.random() * 4 - 2).toFixed(0);

    const nextTemperature = Math.max(10, Math.min(30, this.currentReading.temperature + Number(deltaTemperature)));
    const nextHumidity = Math.max(40, Math.min(80, this.currentReading.humidity + Number(deltaHumidity)));

    return {
      temperature: Number(nextTemperature.toFixed(1)),
      humidity: Number(nextHumidity.toFixed(0)),
      timestamp: new Date(),
    };
  }

  private buildMockAlerts(reading: EnvironmentalReading): string[] {
    const alerts: string[] = [];
    if (reading.temperature < this.thresholds.minTemperature) {
      alerts.push('Temperatura por debajo del minimo configurado.');
    }
    if (reading.temperature > this.thresholds.maxTemperature) {
      alerts.push('Temperatura por encima del maximo configurado.');
    }
    if (reading.humidity < this.thresholds.minHumidity) {
      alerts.push('Humedad por debajo del minimo configurado.');
    }
    if (reading.humidity > this.thresholds.maxHumidity) {
      alerts.push('Humedad por encima del maximo configurado.');
    }
    return alerts;
  }
}
