export const DIRECTORY_BATCH_SIZE = 24;

export function visibleResultCount(total: number, batches = 1): number {
  return Math.min(total, DIRECTORY_BATCH_SIZE * Math.max(1, batches));
}
