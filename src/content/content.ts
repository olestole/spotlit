import browser from 'webextension-polyfill';
import { Highlighter } from './highlighter';
import { composeSpotlightImage } from '../lib/canvas';
import { copyImageToClipboard } from '../lib/clipboard';
import type { MessageType, ElementBounds } from '../types/messages';
import { SpotlightConfig, defaultConfig } from '../types/config';

let highlighter: Highlighter | null = null;
let isActive = false;

// Listen for activation from background
browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as MessageType;
  if (msg.type === 'ACTIVATE_SELECTION') {
    toggleSelectionMode();
  }
});

function toggleSelectionMode() {
  if (isActive) {
    deactivate();
  } else {
    activate();
  }
}

function activate() {
  isActive = true;
  highlighter = new Highlighter({
    onSelect: handleElementSelect,
    onCancel: deactivate,
  });
  highlighter.start();
  document.body.style.cursor = 'crosshair';
}

function deactivate() {
  isActive = false;
  highlighter?.stop();
  highlighter = null;
  document.body.style.cursor = '';
}

async function handleElementSelect(bounds: ElementBounds) {
  // Hide overlay before capture
  highlighter?.hide();

  // Small delay to ensure overlay is removed from render
  await new Promise((r) => setTimeout(r, 50));

  // Request screenshot from background
  const response = (await browser.runtime.sendMessage({
    type: 'CAPTURE_REQUEST',
    payload: bounds,
  })) as MessageType;

  if (response.type === 'CAPTURE_ERROR') {
    showNotification('Screenshot failed: ' + response.payload, 'error');
    deactivate();
    return;
  }

  if (response.type !== 'CAPTURE_RESULT') {
    showNotification('Unexpected response', 'error');
    deactivate();
    return;
  }

  try {
    const result = await browser.storage.local.get('config');
    const config: SpotlightConfig = { ...defaultConfig, ...(result.config as Partial<SpotlightConfig>) };

    const finalImage = await composeSpotlightImage(response.payload, bounds, config);

    await copyImageToClipboard(finalImage);
    showNotification('Copied!', 'success', finalImage);
  } catch (err) {
    console.error('[Spotlit] Error processing image:', err);
    showNotification('Failed to process image', 'error');
  }

  deactivate();
}

function showNotification(message: string, type: 'success' | 'error', blob?: Blob) {
  const toast = document.createElement('div');
  toast.className = `spotlit-toast spotlit-toast--${type}`;

  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);

  if (blob) {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'spotlit-toast-download';
    downloadBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    downloadBtn.title = 'Save to Downloads';
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spotlit-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
    toast.appendChild(downloadBtn);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
