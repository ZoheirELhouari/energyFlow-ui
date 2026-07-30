import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { ForecastingService } from '../../services/forecasting.service';
import { SegmentationService } from '../../services/segmentation.service';
import type { Cluster } from '../../models/segmentation';
import type {
  ClusterForecastResponse,
  FeatureImportanceResponse,
  ForecastEvaluationResponse,
  ModelMetrics,
  TrainResponse,
} from '../../models/forecasting';

import { ForecastChartComponent } from './components/forecast-chart/forecast-chart.component';
import { EvaluationTableComponent } from './components/evaluation-table/evaluation-table.component';
import { FeatureImportanceChartComponent } from './components/feature-importance-chart/feature-importance-chart.component';
import { MetricsKpiComponent } from './components/metrics-kpi/metrics-kpi.component';

/** Frontend cluster presentation — mirrors segmentation.service.ts */
const CLUSTER_OPTIONS: readonly { id: number; name: string; color: string }[] = [
  { id: 0, name: 'Residential Low', color: '#3b82f6' },
  { id: 1, name: 'Commercial Standard', color: '#06b6d4' },
  { id: 2, name: 'Industrial Variable', color: '#ec4899' },
  { id: 3, name: 'High Demand', color: '#8b5cf6' },
  { id: 4, name: 'Peak Users', color: '#f59e0b' },
  { id: 5, name: 'Heavy Industrial', color: '#22c55e' },
];

type PageState = 'idle' | 'training' | 'predicting' | 'ready' | 'error';

@Component({
  selector: 'app-forecasting',
  standalone: true,
  imports: [
    FormsModule,
    ForecastChartComponent,
    EvaluationTableComponent,
    FeatureImportanceChartComponent,
    MetricsKpiComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forecasting.component.html',
  styleUrl: './forecasting.component.scss',
})
export class ForecastingComponent {
  private readonly service = inject(ForecastingService);
  private readonly segmentation = inject(SegmentationService);

  protected readonly clusters = CLUSTER_OPTIONS;
  protected readonly selectedClusterId = signal<number>(0);
  protected readonly horizon = signal<number>(7);
  protected readonly state = signal<PageState>('idle');
  protected readonly errorMessage = signal<string>('');

  // Train results
  protected readonly trainResult = signal<TrainResponse | null>(null);
  protected readonly modelTrained = signal<boolean>(false);

  // Cluster centroid data from segmentation (365 daily values per cluster)
  protected readonly clusterData = signal<readonly Cluster[]>([]);

  // Per-cluster results
  protected readonly forecast = signal<ClusterForecastResponse | null>(null);
  protected readonly evaluation = signal<ForecastEvaluationResponse | null>(null);
  protected readonly featureImportance = signal<FeatureImportanceResponse | null>(null);

  protected readonly selectedClusterColor = computed(() => {
    const id = this.selectedClusterId();
    return CLUSTER_OPTIONS.find((c) => c.id === id)?.color ?? '#06b6d4';
  });

  protected readonly selectedClusterName = computed(() => {
    const id = this.selectedClusterId();
    return CLUSTER_OPTIONS.find((c) => c.id === id)?.name ?? `Cluster ${id}`;
  });

  /** The 365-day consumption centroid for the selected cluster. */
  protected readonly historicalCentroid = computed<readonly number[]>(() => {
    const id = this.selectedClusterId();
    const cluster = this.clusterData().find((c) => c.id === id);
    return cluster?.centroid ?? [];
  });

  protected readonly forecastMetrics = computed<ModelMetrics | null>(() => {
    return this.forecast()?.model_metrics ?? null;
  });

  constructor() {
    this.segmentation.getDefaultJob().subscribe({
      next: (clusters) => this.clusterData.set(clusters),
    });
  }

  protected readonly isTraining = computed(() => this.state() === 'training');
  protected readonly isPredicting = computed(() => this.state() === 'predicting');
  protected readonly isError = computed(() => this.state() === 'error');

  protected trainModels(): void {
    this.state.set('training');
    this.errorMessage.set('');

    this.service.trainModel({ start_year_date: '2023-01-01' }).subscribe({
      next: (res) => {
        this.trainResult.set(res);
        this.modelTrained.set(true);
        this.state.set('ready');
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(
          err.status === 0
            ? 'Cannot reach the backend. Is uvicorn running?'
            : `Training failed: ${err.error?.detail ?? err.message}`,
        );
        this.state.set('error');
      },
    });
  }

  protected runForecast(): void {
    const clusterId = this.selectedClusterId();
    const h = this.horizon();

    this.state.set('predicting');
    this.errorMessage.set('');

    const predict$ = this.service.predict({
      cluster_id: clusterId,
      horizon: h,
      start_year_date: '2023-01-01',
    });
    const evaluate$ = this.service.evaluateModel(clusterId);
    const importance$ = this.service.getFeatureImportance(clusterId);

    forkJoin({ predict: predict$, evaluate: evaluate$, importance: importance$ }).subscribe({
      next: ({ predict, evaluate, importance }) => {
        this.forecast.set(predict);
        this.evaluation.set(evaluate);
        this.featureImportance.set(importance);
        this.state.set('ready');
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(
          err.status === 400
            ? err.error?.detail ?? 'Model not trained yet.'
            : err.status === 0
              ? 'Cannot reach the backend. Is uvicorn running?'
              : `Forecast failed: ${err.error?.detail ?? err.message}`,
        );
        this.state.set('error');
      },
    });
  }
}
