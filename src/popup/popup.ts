import browser from 'webextension-polyfill';
import { SpotlightConfig, defaultConfig } from '../types/config';

const elements = {
  padding: document.getElementById('padding') as HTMLInputElement,
  paddingValue: document.getElementById('padding-value') as HTMLSpanElement,
  radius: document.getElementById('radius') as HTMLInputElement,
  radiusValue: document.getElementById('radius-value') as HTMLSpanElement,
  opacity: document.getElementById('opacity') as HTMLInputElement,
  opacityValue: document.getElementById('opacity-value') as HTMLSpanElement,
  useBlur: document.getElementById('use-blur') as HTMLInputElement,
  blurOptions: document.getElementById('blur-options') as HTMLDivElement,
  blur: document.getElementById('blur') as HTMLInputElement,
  blurValue: document.getElementById('blur-value') as HTMLSpanElement,
};

async function loadConfig(): Promise<SpotlightConfig> {
  const result = await browser.storage.local.get('config');
  return { ...defaultConfig, ...(result.config as Partial<SpotlightConfig>) };
}

async function saveConfig(config: SpotlightConfig): Promise<void> {
  await browser.storage.local.set({ config });
}

function updateUI(config: SpotlightConfig): void {
  elements.padding.value = String(config.padding);
  elements.paddingValue.textContent = `${config.padding}px`;

  elements.radius.value = String(config.borderRadius);
  elements.radiusValue.textContent = `${config.borderRadius}px`;

  elements.opacity.value = String(Math.round(config.overlayOpacity * 100));
  elements.opacityValue.textContent = `${Math.round(config.overlayOpacity * 100)}%`;

  elements.useBlur.checked = config.useBlur;
  elements.blurOptions.classList.toggle('visible', config.useBlur);

  elements.blur.value = String(config.blurAmount);
  elements.blurValue.textContent = `${config.blurAmount}px`;
}

async function init(): Promise<void> {
  const config = await loadConfig();
  updateUI(config);

  elements.padding.addEventListener('input', async () => {
    const value = Number(elements.padding.value);
    elements.paddingValue.textContent = `${value}px`;
    const config = await loadConfig();
    config.padding = value;
    await saveConfig(config);
  });

  elements.radius.addEventListener('input', async () => {
    const value = Number(elements.radius.value);
    elements.radiusValue.textContent = `${value}px`;
    const config = await loadConfig();
    config.borderRadius = value;
    await saveConfig(config);
  });

  elements.opacity.addEventListener('input', async () => {
    const value = Number(elements.opacity.value);
    elements.opacityValue.textContent = `${value}%`;
    const config = await loadConfig();
    config.overlayOpacity = value / 100;
    await saveConfig(config);
  });

  elements.useBlur.addEventListener('change', async () => {
    const checked = elements.useBlur.checked;
    elements.blurOptions.classList.toggle('visible', checked);
    const config = await loadConfig();
    config.useBlur = checked;
    await saveConfig(config);
  });

  elements.blur.addEventListener('input', async () => {
    const value = Number(elements.blur.value);
    elements.blurValue.textContent = `${value}px`;
    const config = await loadConfig();
    config.blurAmount = value;
    await saveConfig(config);
  });
}

init();
