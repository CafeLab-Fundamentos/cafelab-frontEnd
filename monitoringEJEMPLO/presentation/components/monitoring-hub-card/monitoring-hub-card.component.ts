import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export interface MonitoringHubCardData {
  titleKey: string;
  descriptionKey: string;
  imageUrl: string;
  routeLink?: string;
}

@Component({
  selector: 'app-monitoring-hub-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './monitoring-hub-card.component.html',
  styleUrls: ['./monitoring-hub-card.component.css'],
})
export class MonitoringHubCardComponent {
  @Input({ required: true }) card!: MonitoringHubCardData;
}
