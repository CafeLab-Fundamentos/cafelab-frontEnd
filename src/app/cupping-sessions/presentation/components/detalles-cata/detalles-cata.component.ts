import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CuppingSessionApi } from '../../../../cupping-session/application/cupping-session.api';
import {
  parseSensory,
  type CuppingSensoryScores,
  type CuppingSessionEntry,
} from '../../../../cupping-session/domain/model/cupping-session-entry.entity';
import { TranslateService } from '@ngx-translate/core';
import { CuppingSensoryRadarComponent } from '../cupping-sensory-radar/cupping-sensory-radar.component';

@Component({
  selector: 'app-detalles-cata',
  standalone: true,
  imports: [
    CommonModule,
    MatSliderModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    TranslateModule,
    MatSnackBarModule,
    CuppingSensoryRadarComponent,
  ],
  templateUrl: './detalles-cata.component.html',
  styleUrls: ['./detalles-cata.component.css'],
})
export class DetallesCataComponent implements OnChanges {
  @Input({ required: true }) sesion!: CuppingSessionEntry;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<CuppingSessionEntry>();

  evaluacion: CuppingSensoryScores = { ...parseSensory(null) };

  configDraft = {
    name: '',
    origin: '',
    variety: '',
    processing: 'washed',
    sessionDate: '',
    roastStyleNotes: '',
  };

  processingCodes = ['washed', 'natural', 'honey', 'experimental'] as const;
  saving = false;

  
  hexagonoAnimar = false;

  constructor(
    private readonly router: Router,
    private readonly cuppingSessionApi: CuppingSessionApi,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sesion']?.currentValue) {
      this.syncFromSesion();
    }
  }

  private syncFromSesion(): void {
    const s = this.sesion;
    this.evaluacion = this.normalizeSensoryScores(parseSensory(s.resultsJson));
    this.configDraft = {
      name: s.name ?? '',
      origin: s.origin ?? '',
      variety: s.variety ?? '',
      processing: s.processing || 'washed',
      sessionDate: (s.sessionDate ?? '').slice(0, 10),
      roastStyleNotes: s.roastStyleNotes ?? '',
    };
  }

  volver(): void {
    this.closed.emit();
  }

  generarHexagono(): void {
    this.hexagonoAnimar = true;
    window.setTimeout(() => {
      this.hexagonoAnimar = false;
    }, 450);
  }

  abrirBibliotecaDefectos(): void {
    void this.router.navigate(['/libraryDefects']);
  }

  private normalizeSensoryScore(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return 5;
    }
    return Math.max(0, Math.min(10, Math.round(n)));
  }

  private normalizeSensoryScores(scores: CuppingSensoryScores): CuppingSensoryScores {
    return {
      aroma: this.normalizeSensoryScore(scores.aroma),
      cuerpo: this.normalizeSensoryScore(scores.cuerpo),
      acidez: this.normalizeSensoryScore(scores.acidez),
      dulzor: this.normalizeSensoryScore(scores.dulzor),
      amargor: this.normalizeSensoryScore(scores.amargor),
      aftertaste: this.normalizeSensoryScore(scores.aftertaste),
    };
  }

  private buildResultsJson(): string {
    const normalized = this.normalizeSensoryScores(this.evaluacion);
    this.evaluacion = normalized;
    return JSON.stringify(normalized);
  }

  guardarSesion(): void {
    if (!this.sesion?.id || this.saving) {
      return;
    }
    if (!this.configDraft.name.trim()) {
      this.snackBar.open(this.translate.instant('CUPPING_DETAILS.NAME_REQUIRED'), undefined, { duration: 4000 });
      return;
    }
    this.saving = true;
    const resultsJson = this.buildResultsJson();
    const updated: CuppingSessionEntry = {
      ...this.sesion,
      name: this.configDraft.name.trim(),
      origin: this.configDraft.origin.trim(),
      variety: this.configDraft.variety.trim(),
      processing: this.configDraft.processing.trim(),
      sessionDate: this.configDraft.sessionDate.slice(0, 10),
      roastStyleNotes: this.configDraft.roastStyleNotes.trim() || null,
      resultsJson,
    };
    this.cuppingSessionApi.update(this.sesion.id, updated).subscribe({
      next: (entity) => {
        this.saving = false;
        this.snackBar.open(this.translate.instant('CUPPING_DETAILS.SAVE_SUCCESS'), undefined, { duration: 3000 });
        this.saved.emit(entity);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open(this.translate.instant('CUPPING_DETAILS.SAVE_ERROR'), undefined, { duration: 4000 });
      },
    });
  }
}
