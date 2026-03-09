export interface Batch {
  titleId: string;
  title: string;
  imageUrl: string;
  id?: string | null;
  contentHash?: string | null;
  created?: string | null;
  modified?: string | null;
  isSingleBatch: boolean;
}
