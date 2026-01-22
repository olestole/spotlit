# Spotlight Screenshot

Browser extension that creates professional spotlight screenshots. Click any DOM element or drag to select a region - the selected area stays bright while the background is dimmed or blurred.

## Features

- **Click to capture** - Hover over any element and click to capture it
- **Drag to select** - Draw a custom rectangle to capture any region
- **Configurable styling**:
  - Padding around selection
  - Border radius for rounded corners
  - Adjustable dim opacity
  - Optional blur effect instead of dim
- **Cross-browser** - Works on Chrome and Firefox
- **Keyboard shortcut** - `Alt+Shift+F` to activate

## Installation

### From source

```bash
pnpm install
pnpm run build
```

**Chrome:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in `dist/`

## Usage

1. Press `Alt+Shift+F` (or click the extension icon and use the popup)
2. **Click** on any element to capture it, or **drag** to select a custom area
3. The screenshot is automatically copied to your clipboard
4. Paste anywhere

## Configuration

Click the extension icon to open settings:

| Setting | Description |
|---------|-------------|
| Padding | Space around the highlighted element (0-32px) |
| Border Radius | Rounded corners for the highlight (0-32px) |
| Dim Amount | How dark the background becomes (0-100%) |
| Use Blur | Toggle blur effect instead of dim |
| Blur Amount | Blur intensity when blur is enabled (1-30px) |

## Development

```bash
pnpm install
pnpm run dev      # Watch mode
pnpm run build    # Production build
pnpm run typecheck
```

## Tech Stack

- TypeScript
- Vite
- WebExtension Polyfill (cross-browser support)
- Manifest V3

## License

MIT
