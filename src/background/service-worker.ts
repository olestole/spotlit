import browser, { Tabs, Runtime } from 'webextension-polyfill';
import type { MessageType, ElementBounds } from '../types/messages';

// Listen for keyboard shortcut
browser.commands.onCommand.addListener(async (command: string) => {
  if (command === 'activate-selection') {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    browser.tabs.sendMessage(tab.id, { type: 'ACTIVATE_SELECTION' });
  }
});

// Listen for capture requests from content script
browser.runtime.onMessage.addListener(
  (message: unknown, sender: Runtime.MessageSender) => {
    const msg = message as MessageType;
    if (msg.type === 'CAPTURE_REQUEST') {
      return handleCaptureRequest(msg.payload, sender.tab);
    }
  }
);

async function handleCaptureRequest(
  _bounds: ElementBounds,
  tab?: Tabs.Tab
): Promise<MessageType> {
  if (!tab?.id || !tab.windowId) {
    return { type: 'CAPTURE_ERROR', payload: 'No active tab' };
  }

  try {
    const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
    });

    return { type: 'CAPTURE_RESULT', payload: dataUrl };
  } catch (err) {
    return { type: 'CAPTURE_ERROR', payload: String(err) };
  }
}
