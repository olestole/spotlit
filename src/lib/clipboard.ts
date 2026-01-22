export async function copyImageToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard?.write) {
    throw new Error('Clipboard API not supported');
  }

  const item = new ClipboardItem({
    'image/png': blob,
  });

  await navigator.clipboard.write([item]);
}
