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
    showNotification('Copied to clipboard!', 'success');
  } catch (err) {
    console.error('[Spotlit] Error processing image:', err);
    showNotification('Failed to process image', 'error');
  }

  deactivate();
}

function showNotification(message: string, type: 'success' | 'error') {
  const toast = document.createElement('div');
  toast.className = `spotlit-toast spotlit-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}
