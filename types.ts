
export interface GenerationRecord {
  id: string;
  type: 'product' | 'model' | 'try-on';
  url: string;
  timestamp: number;
}

export enum AppTab {
  PRODUCT_STUDIO = 'product-studio',
  MODEL_STUDIO = 'model-studio',
  TRY_ON = 'try-on',
  GALLERY = 'gallery'
}
