import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environment/environment';
import type { Cluster, ClusterApi, SegmentationJobResponse } from '../models/segmentation';

/**
 * Frontend-owned presentation metadata for each cluster id. The backend
 * returns generic "Cluster N" labels and no colors, so we map them here.
 * Order matches the spec's KPI/distribution rows.
 */
const CLUSTER_PRESENTATION: Readonly<
  Record<number, { name: string; shortName: string; color: string }>
> = {
  0: { name: 'Residential Low', shortName: 'Residential', color: '#3b82f6' },
  1: { name: 'Commercial Standard', shortName: 'Commercial', color: '#06b6d4' },
  2: { name: 'Industrial Variable', shortName: 'Industrial', color: '#ec4899' },
  3: { name: 'High Demand', shortName: 'High', color: '#8b5cf6' },
  4: { name: 'Peak Users', shortName: 'Peak', color: '#f59e0b' },
  5: { name: 'Heavy Industrial', shortName: 'Heavy', color: '#22c55e' },
};

/** Fallback style used when the backend returns a cluster id we don't know. */
const DEFAULT_PRESENTATION = {
  name: 'Cluster',
  shortName: 'Cluster',
  color: '#64748b',
} as const;

@Injectable({ providedIn: 'root' })
export class SegmentationService {
  private readonly http = inject(HttpClient);

  /**
   * Fetch a clustering job and normalize each API cluster into the UI
   * `Cluster` shape (stable property names + display metadata).
   */
  getJob(jobId: string): Observable<Cluster[]> {
    const url = `${environment.apiBaseUrl}/segmentation/jobs/${encodeURIComponent(jobId)}`;
    return this.http.get<SegmentationJobResponse>(url).pipe(
      map((res) => {
        const raw = res.clusters ?? res.clustering_job?.clusters ?? [];
        return [...raw]
          .slice()
          .sort((a, b) => a.clusterId - b.clusterId)
          .map(toCluster);
      }),
    );
  }

  runSegmentationJob(): Observable<Cluster[]> {
    const url = `${environment.apiBaseUrl}/segmentation/compute`;
    return this.http.post<SegmentationJobResponse>(url, {}).pipe(
      map((res) => {
        const raw = res.clusters ?? res.clustering_job?.clusters ?? [];
        return [...raw]
          .slice()
          .sort((a, b) => a.clusterId - b.clusterId)
          .map(toCluster);
      }),
    );
  }

  /** Fetch the default job configured in the environment. */
  getDefaultJob(): Observable<Cluster[]> {
    return this.getJob(environment.segmentationJobId);
  }
}

function toCluster(api: ClusterApi): Cluster {
  const presentation = CLUSTER_PRESENTATION[api.clusterId] ?? {
    ...DEFAULT_PRESENTATION,
    name: `${DEFAULT_PRESENTATION.name} ${api.clusterId}`,
    shortName: `${DEFAULT_PRESENTATION.shortName} ${api.clusterId}`,
  };

  return {
    id: api.clusterId,
    name: presentation.name,
    shortName: presentation.shortName,
    color: presentation.color,
    percentage: round(api.percentageOfSmartMeters, 1),
    avgConsumption: round(api.averageConsumption, 1),
    avgTemperature: round(api.averageTemperature, 1),
    consumptionVariability: round(api.consumptionVariablity, 1),
    temperatureVariability: round(api.temperatureVariability, 1),
    totalConsumption: api.totalConsumption,
    centroid: api.clusterCentroid,
  };
}

function round(n: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}
