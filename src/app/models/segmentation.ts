/**
 * TypeScript contracts for the `/segmentation/jobs/{job_id}` endpoint.
 *
 * The backend preserves the typo `consumptionVariablity` (missing "i"); we
 * keep it in the wire format and expose it as `consumptionVariability` in
 * the normalized UI model below.
 */

export interface ClusterApi {
  readonly clusterId: number;
  readonly clusterName: string;
  readonly jobId: string;
  readonly percentageOfSmartMeters: number;
  readonly assignedSmartMeterIds: readonly string[];
  readonly averageConsumption: number;
  readonly averageTemperature: number;
  readonly consumptionVariablity: number;
  readonly temperatureVariability: number;
  readonly totalConsumption: number;
  readonly clusterCentroid: readonly number[];
  readonly clusterCentroidSmartMeterId?: number | string;
}

export interface SegmentationJobResponse {
  readonly status: string;
  readonly job_id: string;
  readonly clusters: readonly ClusterApi[];
  readonly clustering_job?: {
    readonly jobId: string;
    readonly createdAt: string;
    readonly clusters: readonly ClusterApi[];
  };
}

/**
 * UI-facing cluster model. Adds a human-readable `name`/`shortName` and a
 * display `color`, both sourced from CLUSTER_PRESENTATION (frontend-owned
 * since the backend only returns generic "Cluster N" labels).
 */
export interface Cluster {
  readonly id: number;
  readonly name: string;
  readonly shortName: string;
  readonly color: string;
  readonly percentage: number;
  readonly avgConsumption: number;
  readonly avgTemperature: number;
  readonly consumptionVariability: number;
  readonly temperatureVariability: number;
  readonly totalConsumption: number;
  /** Daily profile for 2023 — length 365. */
  readonly centroid: readonly number[];
}
