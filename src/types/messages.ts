export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type MessageType =
  | { type: 'ACTIVATE_SELECTION' }
  | { type: 'CAPTURE_REQUEST'; payload: ElementBounds }
  | { type: 'CAPTURE_RESULT'; payload: string }
  | { type: 'CAPTURE_ERROR'; payload: string };
