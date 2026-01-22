import type { ElementBounds } from '../types/messages';
import type { SpotlightConfig } from '../types/config';

export async function composeSpotlightImage(
  screenshotDataUrl: string,
  elementBounds: ElementBounds,
  config: SpotlightConfig
): Promise<Blob> {
  const img = await loadImage(screenshotDataUrl);
  const dpr = window.devicePixelRatio || 1;

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  // Apply padding to bounds
  const paddedBounds = {
    x: Math.round((elementBounds.x - config.padding) * dpr),
    y: Math.round((elementBounds.y - config.padding) * dpr),
    width: Math.round((elementBounds.width + config.padding * 2) * dpr),
    height: Math.round((elementBounds.height + config.padding * 2) * dpr),
  };

  // Clamp to canvas (ensure valid bounds)
  const clampedX = Math.max(0, paddedBounds.x);
  const clampedY = Math.max(0, paddedBounds.y);
  const bounds = {
    x: clampedX,
    y: clampedY,
    width: Math.max(1, Math.min(paddedBounds.width - (clampedX - paddedBounds.x), canvas.width - clampedX)),
    height: Math.max(1, Math.min(paddedBounds.height - (clampedY - paddedBounds.y), canvas.height - clampedY)),
  };

  // Calculate border radius
  // Formula: outerRadius = innerRadius + padding (when element has border-radius)
  const rawRadius = elementBounds.elementBorderRadius !== undefined
    ? elementBounds.elementBorderRadius + config.padding
    : config.borderRadius;
  const maxRadius = Math.min(bounds.width, bounds.height) / 2;
  const borderRadius = Math.min(rawRadius * dpr, maxRadius);

  if (config.useBlur) {
    await composeWithBlur(ctx, img, bounds, borderRadius, config.blurAmount * dpr, config.showStroke);
  } else {
    composeWithDim(ctx, img, bounds, borderRadius, config.overlayOpacity, config.showStroke);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      'image/png'
    );
  });
}

function composeWithDim(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  bounds: { x: number; y: number; width: number; height: number },
  borderRadius: number,
  opacity: number,
  showStroke: boolean
): void {
  const canvas = ctx.canvas;

  // 1. Draw full screenshot
  ctx.drawImage(img, 0, 0);

  // 2. Apply dark overlay
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Create rounded rect clip path for spotlight
  ctx.save();
  roundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, borderRadius);
  ctx.clip();

  // 4. Draw original image within clipped region
  ctx.drawImage(img, 0, 0);
  ctx.restore();

  // 5. Draw rounded border (optional)
  if (showStroke) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    roundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, borderRadius);
    ctx.stroke();
  }
}

async function composeWithBlur(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  bounds: { x: number; y: number; width: number; height: number },
  borderRadius: number,
  blurAmount: number,
  showStroke: boolean
): Promise<void> {
  const canvas = ctx.canvas;

  // 1. Draw blurred version as background
  ctx.filter = `blur(${blurAmount}px)`;
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';

  // 2. Create rounded rect clip for spotlight
  ctx.save();
  roundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, borderRadius);
  ctx.clip();

  // 3. Draw sharp image in spotlight area
  ctx.drawImage(img, 0, 0);
  ctx.restore();

  // 4. Draw border (optional)
  if (showStroke) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    roundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, borderRadius);
    ctx.stroke();
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}
