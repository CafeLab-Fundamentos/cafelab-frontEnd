import { Component } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { TranslatePipe } from '@ngx-translate/core';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { DashboardNavigationService } from '../../../../shared/infrastructure/dashboard-navigation.service';
import {
  MonitoringHubCardComponent,
  MonitoringHubCardData,
} from '../../components/monitoring-hub-card/monitoring-hub-card.component';

@Component({
  selector: 'app-monitoring-page',
  standalone: true,
  imports: [
    MatToolbar,
    ToolbarComponent,
    TranslatePipe,
    MonitoringHubCardComponent,
  ],
  templateUrl: './monitoring-page.component.html',
  styleUrls: ['./monitoring-page.component.css'],
})
export class MonitoringPageComponent {
  readonly hubCards: MonitoringHubCardData[] = [
    {
      titleKey: 'MONITORING.HUB.CARDS.LOTS.TITLE',
      descriptionKey: 'MONITORING.HUB.CARDS.LOTS.DESCRIPTION',
      imageUrl: 'assets/lote-monitoreo.jpg',
      routeLink: '/monitoring/lots',
    },
    {
      titleKey: 'MONITORING.HUB.CARDS.CONFIGURATION.TITLE',
      descriptionKey: 'MONITORING.HUB.CARDS.CONFIGURATION.DESCRIPTION',
      imageUrl: 'assets/configuracion-monitoreo.png',
      routeLink: '/monitoring/configuration',
    },
    {
      titleKey: 'MONITORING.HUB.CARDS.ALERTS.TITLE',
      descriptionKey: 'MONITORING.HUB.CARDS.ALERTS.DESCRIPTION',
      imageUrl: 'assets/alertas-monitoreo.png',
      routeLink: '/monitoring/alerts',
    },
    {
      titleKey: 'MONITORING.HUB.CARDS.ANALYTICS.TITLE',
      descriptionKey: 'MONITORING.HUB.CARDS.ANALYTICS.DESCRIPTION',
      imageUrl: 'assets/analiticas-monitoreo.png',
      routeLink: '/monitoring/analytics',
    },
  ];

  constructor(private readonly dashboardNavigation: DashboardNavigationService) {}

  goToHome(): void {
    this.dashboardNavigation.goToHome();
  }
}
