
export interface GenerationRecord {
  id: string;
  type: 'product' | 'model' | 'try-on';
  url: string;
  timestamp: number;
}

export interface BatchItem {
  id: string;
  file: string; // base64
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  studioUrl?: string;
  tryOnUrl?: string;
}

export enum AppTab {
  PRODUCT_STUDIO = 'product-studio',
  MODEL_STUDIO = 'model-studio',
  TRY_ON = 'try-on',
  BATCH_STUDIO = 'batch-studio',
  GALLERY = 'gallery'
}
