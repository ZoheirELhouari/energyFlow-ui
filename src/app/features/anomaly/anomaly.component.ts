import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AnomalyService } from '../../services/anomaly.service';
import type {
  AnomalyScanResponse,
  AnomalyStatusResponse,
  AnomalyTrainResponse,
  ClusterAnomalyStats,
  MeterAnomalyItem,
  MeterDetailResponse,
} from '../../models/anomaly';

import { SeverityKpiComponent } from './components/severity-kpi/severity-kpi.component';
import { AnomalyScatterComponent } from './components/anomaly-scatter/anomaly-scatter.component';
import { AnomalyTableComponent } from './components/anomaly-table/anomaly-table.component';
import { MeterDetailChartComponent } from './components/meter-detail-chart/meter-detail-chart.component';
import { ClusterOverviewComponent } from './components/cluster-overview/cluster-overview.component';

type PageState = 'loading' | 'idle' | 'training' | 'trained' | 'scanning' | 'ready' | 'error';

@Component({
  selector: 'app-anomaly',
  standalone: true,
  imports: [
    FormsModule,
    SeverityKpiComponent,
    AnomalyScatterComponent,
    AnomalyTableComponent,
    MeterDetailChartComponent,
    ClusterOverviewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anomaly.component.html',
  styleUrl: './anomaly.component.scss',
})
export class AnomalyComponent implements OnInit {
  private readonly service = inject(AnomalyService);

  /* EHWS parameters */
  protected readonly kThreshold = signal<number>(3.0);
  protected readonly lParam = signal<number>(0.86);

  /* LSTM training parameters */
  protected readonly windowSize = signal<number>(30);
  protected readonly epochs = signal<number>(50);

  protected readonly state = signal<PageState>('loading');
  protected readonly errorMessage = signal<string>('');

  protected readonly trainResult = signal<AnomalyTrainResponse | null>(null);
  protected readonly scanResult = signal<AnomalyScanResponse | null>(null);
  protected readonly meterDetail = signal<MeterDetailResponse | null>(null);
  protected readonly loadingDetail = signal<boolean>(false);

  /* Cluster filtering */
  protected readonly selectedCluster = signal<number | null>(null);

  protected readonly clusterIds = computed<readonly number[]>(() => {
    const stats = this.scanResult()?.cluster_stats;
    if (!stats) return [];
    return Object.keys(stats)
      .map(Number)
      .sort((a, b) => a - b);
  });

  protected readonly anomalies = computed<readonly MeterAnomalyItem[]>(() => {
    const all = this.scanResult()?.anomalies ?? [];
    const cid = this.selectedCluster();
    return cid === null ? all : all.filter((a) => a.cluster_id === cid);
  });

  protected readonly filteredScanResult = computed<AnomalyScanResponse | null>(() => {
    const scan = this.scanResult();
    if (!scan) return null;
    const cid = this.selectedCluster();
    if (cid === null) return scan;

    const filtered = scan.anomalies.filter((a) => a.cluster_id === cid);
    const stats: ClusterAnomalyStats = scan.cluster_stats[cid] ?? {
      total_meters: 0,
      anomaly_count: 0,
      mean_mape: 0,
      fraud_suspects: 0,
    };

    return {
      total_meters: stats.total_meters,
      anomalous_meters: stats.anomaly_count,
      critical_count: filtered.filter((a) => a.severity === 'critical').length,
      high_count: filtered.filter((a) => a.severity === 'high').length,
      medium_count: filtered.filter((a) => a.severity === 'medium').length,
      fraud_suspects: stats.fraud_suspects,
      model_metrics: scan.model_metrics,
      cluster_stats: scan.cluster_stats,
      anomalies: filtered,
    };
  });

  protected readonly isLoading = computed(() => this.state() === 'loading');
  protected readonly isTraining = computed(() => this.state() === 'training');
  protected readonly isScanning = computed(() => this.state() === 'scanning');
  protected readonly isTrained = computed(
    () => this.state() === 'trained' || this.state() === 'scanning' || this.state() === 'ready',
  );
  protected readonly isError = computed(() => this.state() === 'error');

  ngOnInit(): void {
    this.service.getStatus().subscribe({
      next: (status: AnomalyStatusResponse) => {
        if (status.trained) {
          if (status.window_size) this.windowSize.set(status.window_size);
          this.trainResult.set({
            num_clusters: status.num_clusters ?? 0,
            window_size: status.window_size ?? 30,
            epochs: 0,
            cluster_metrics: status.cluster_metrics ?? {},
          });
          this.state.set('trained');
          this.runScan();
        } else {
          this.state.set('idle');
        }
      },
      error: () => {
        this.state.set('idle');
      },
    });
  }

  protected trainModel(): void {
    this.state.set('training');
    this.errorMessage.set('');
    this.scanResult.set(null);
    this.meterDetail.set(null);

    this.service.train({ window_size: this.windowSize(), epochs: this.epochs() }).subscribe({
      next: (res) => {
        this.trainResult.set(res);
        this.state.set('trained');
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

  protected runScan(): void {
    this.state.set('scanning');
    this.errorMessage.set('');
    this.meterDetail.set(null);

    this.service.scan({ k_threshold: this.kThreshold(), l_param: this.lParam() }).subscribe({
      next: (res) => {
        this.scanResult.set(res);
        this.state.set('ready');
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(
          err.status === 0
            ? 'Cannot reach the backend. Is uvicorn running?'
            : `Scan failed: ${err.error?.detail ?? err.message}`,
        );
        this.state.set('error');
      },
    });
  }

  protected onMeterSelected(meterId: number): void {
    this.loadingDetail.set(true);
    this.service.getMeterDetail(meterId).subscribe({
      next: (detail) => {
        this.meterDetail.set(detail);
        this.loadingDetail.set(false);
      },
      error: () => {
        this.loadingDetail.set(false);
      },
    });
  }

  protected closeMeterDetail(): void {
    this.meterDetail.set(null);
  }

  protected selectCluster(clusterId: number | null): void {
    this.selectedCluster.set(clusterId);
    this.meterDetail.set(null);
  }
}
