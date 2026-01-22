export interface SpotlightConfig {
  padding: number; // px around element
  borderRadius: number; // px for corners
  overlayOpacity: number; // 0-1
  useBlur: boolean; // blur vs solid overlay
  blurAmount: number; // px blur radius
  showStroke: boolean; // border around spotlight
}

export const defaultConfig: SpotlightConfig = {
  padding: 8,
  borderRadius: 8,
  overlayOpacity: 0.7,
  useBlur: false,
  blurAmount: 10,
  showStroke: false,
};
