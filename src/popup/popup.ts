import browser from 'webextension-polyfill';
import { SpotlightConfig, defaultConfig } from '../types/config';

const elements = {
  captureBtn: document.getElementById('capture-btn') as HTMLButtonElement,
  hotkey: document.getElementById('hotkey') as HTMLElement,
  hotkeyLink: document.getElementById('hotkey-link') as HTMLAnchorElement,
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
  showStroke: document.getElementById('show-stroke') as HTMLInputElement,
};

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;

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

  elements.showStroke.checked = config.showStroke;
}

function formatHotkey(shortcut: string): string {
  if (!isMac) return shortcut;
  return shortcut
    .replace(/Alt\+/gi, '⌥')
    .replace(/Shift\+/gi, '⇧')
    .replace(/Ctrl\+/gi, '⌃')
    .replace(/Command\+/gi, '⌘')
    .replace(/MacCtrl\+/gi, '⌃');
}

function setupEditableValue(
  span: HTMLSpanElement,
  slider: HTMLInputElement,
  onSave: (value: number) => Promise<void>
): void {
  span.addEventListener('click', () => {
    const suffix = span.dataset.suffix || '';
    const min = Number(span.dataset.min || 0);
    const max = Number(span.dataset.max || 100);
    const currentValue = Number(slider.value);

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'editable-input';
    input.value = String(currentValue);
    input.min = String(min);
    input.max = String(max);

    span.style.display = 'none';
    span.parentElement?.appendChild(input);
    input.focus();
    input.select();

    const commit = async () => {
      let value = Number(input.value);
      value = Math.max(min, Math.min(max, value));
      if (isNaN(value)) value = currentValue;

      slider.value = String(value);
      span.textContent = `${value}${suffix}`;
      span.style.display = '';
      input.remove();

      await onSave(value);
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        span.style.display = '';
        input.remove();
      }
    });
  });
}

async function startCapture(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  await browser.tabs.sendMessage(tab.id, { type: 'ACTIVATE_SELECTION' });
  window.close();
}

async function loadHotkey(): Promise<void> {
  try {
    const commands = await browser.commands.getAll();
    const cmd = commands.find(c => c.name === 'activate-selection');
    if (cmd?.shortcut) {
      elements.hotkey.textContent = formatHotkey(cmd.shortcut);
    } else {
      elements.hotkey.textContent = isMac ? '⌥⇧F' : 'Alt+Shift+F';
    }
  } catch {
    elements.hotkey.textContent = isMac ? '⌥⇧F' : 'Alt+Shift+F';
  }
}

async function init(): Promise<void> {
  const config = await loadConfig();
  updateUI(config);
  loadHotkey();

  elements.captureBtn.addEventListener('click', startCapture);

  elements.hotkeyLink.addEventListener('click', (e) => {
    e.preventDefault();
    const url = isFirefox
      ? 'about:addons'
      : 'chrome://extensions/shortcuts';
    browser.tabs.create({ url });
  });

  // Setup editable value inputs
  setupEditableValue(elements.paddingValue, elements.padding, async (value) => {
    const config = await loadConfig();
    config.padding = value;
    await saveConfig(config);
  });

  setupEditableValue(elements.radiusValue, elements.radius, async (value) => {
    const config = await loadConfig();
    config.borderRadius = value;
    await saveConfig(config);
  });

  setupEditableValue(elements.opacityValue, elements.opacity, async (value) => {
    const config = await loadConfig();
    config.overlayOpacity = value / 100;
    await saveConfig(config);
  });

  setupEditableValue(elements.blurValue, elements.blur, async (value) => {
    const config = await loadConfig();
    config.blurAmount = value;
    await saveConfig(config);
  });

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

  elements.showStroke.addEventListener('change', async () => {
    const checked = elements.showStroke.checked;
    const config = await loadConfig();
    config.showStroke = checked;
    await saveConfig(config);
  });
}

init();
