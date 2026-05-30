import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { ToolbarComponent } from '../../../../../public/presentation/components/toolbar/toolbar.component';
import { AuthService } from '../../../../../auth/infrastructure/AuthService';
import { BatchListComponent } from '../../components/batch-list/batch-list.component';

@Component({
  selector: 'app-batches-page',
  standalone: true,
  imports: [MatToolbar, ToolbarComponent, BatchListComponent, TranslateModule],
  template: `
    <mat-toolbar color="primary">
      <app-toolbar />
    </mat-toolbar>

    <nav style="display:flex;align-items:center;gap:6px;font-size:15px;margin:18px 0 10px 20px;color:#4A5A54;">
      <a (click)="goToHome()" style="color:#4A5A54;text-decoration:underline;cursor:pointer;font-weight:500;">
        {{ 'BREADCRUMB.HOME' | translate }}
      </a>
      <span> &gt; </span>
      <span style="font-weight:600;color:#414535;">{{ 'COSTING_BC.BATCH.PAGE_TITLE' | translate }}</span>
    </nav>

    <app-batch-list />
  `,
})
export class BatchesPageComponent {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  goToHome(): void {
    const user = this.authService.getCurrentUser();
    if (!user) { this.router.navigate(['/login']); return; }
    if (user.home) { this.router.navigate([user.home]); return; }
    switch (user.plan) {
      case 'barista': this.router.navigate(['/dashboard/barista']); break;
      case 'owner':   this.router.navigate(['/dashboard/owner']); break;
      case 'full':    this.router.navigate(['/dashboard/complete']); break;
      default:        this.router.navigate(['/']);
    }
  }
}
