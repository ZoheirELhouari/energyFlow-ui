import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { SegmentationService } from '../../services/segmentation.service';
import type { Cluster } from '../../models/segmentation';

import { KpiRowComponent } from './components/kpi-row/kpi-row.component';
import { ClusterDistributionComponent } from './components/cluster-distribution/cluster-distribution.component';
import { ConsumptionPatternsChartComponent } from './components/consumption-patterns-chart/consumption-patterns-chart.component';
import { TemperatureCorrelationChartComponent } from './components/temperature-correlation-chart/temperature-correlation-chart.component';
import { LoadForecastChartComponent } from './components/load-forecast-chart/load-forecast-chart.component';
import { VariabilityChartComponent } from './components/variability-chart/variability-chart.component';
import { GeographicDistributionComponent } from './components/geographic-distribution/geographic-distribution.component';
import { ClusterDonutChartComponent } from './components/cluster-donut-chart/cluster-donut-chart.component';
import { AnomalyDetectionComponent } from './components/anomaly-detection/anomaly-detection.component';
import { ForecastingService } from '../../services/forecasting.service';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    KpiRowComponent,
    ClusterDistributionComponent,
    ConsumptionPatternsChartComponent,
    TemperatureCorrelationChartComponent,
    VariabilityChartComponent,
    ClusterDonutChartComponent,
    AnomalyDetectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly segmentation = inject(SegmentationService);
  private readonly forecastingService = inject(ForecastingService);

  protected readonly clusters = signal<readonly Cluster[]>([]);
  protected readonly state = signal<LoadState>('idle');
  protected readonly errorMessage = signal<string>('');

  protected readonly isLoading = computed(() => this.state() === 'loading');
  protected readonly isError = computed(() => this.state() === 'error');
  protected readonly isReady = computed(() => this.state() === 'ready');

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.errorMessage.set('');
    this.segmentation.getDefaultJob().subscribe({
      next: (clusters) => {
        this.clusters.set(clusters);
        this.state.set('ready');
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(
          err.status === 0
            ? 'Cannot reach the backend at localhost:8000. Is uvicorn running?'
            : `Request failed: ${err.status} ${err.message || ''}`.trim(),
        );
        this.state.set('error');
      },
    });
    // this.forecastingService.trainModel().subscribe((res) => {
    //   console.log('Forecasting model training response:', res);
    // });
    this.forecastingService.evaluateModel(1).subscribe((res) => {
      console.log('Forecasting model evaluation response for cluster 0:', res);
    });
    this.forecastingService.getFeatureImportance(1).subscribe((res) => {
      console.log('Forecasting model feature importance response for cluster 0:', res);
    });
  }
}
