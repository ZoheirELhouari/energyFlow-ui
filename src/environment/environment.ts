/**
 * Runtime configuration for the EnergyIQ frontend.
 *
 * `apiBaseUrl` is the FastAPI backend origin **including** the `/api`
 * prefix that main.py registers all routers under (no trailing slash).
 * Services build paths relative to this root.
 *
 * `segmentationJobId` points at the default clustering job to load on the
 * Segmentation dashboard. Keep this in sync with the backend's mock job.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'https://api.zoheir-elhouari.com/api',
  segmentationJobId: '73f48c75-06b3-40b8-ae7b-aeb863aa0d68',
} as const;
