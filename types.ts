export interface Filter {
  name: string;
  prompt: string;
}

export type AdjustmentId = 
  | 'skinSmoothing'
  | 'skinTone'
  | 'facialShaping'
  | 'eyeEnlargement'
  | 'noseModification'
  | 'mouthShaping';

export interface Adjustment {
  id: AdjustmentId;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export type AdjustmentValues = Record<AdjustmentId, number>;

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface DetectedObject {
  name: string;
  boundingBox: BoundingBox;
}
