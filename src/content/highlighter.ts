import type { ElementBounds } from '../types/messages';

interface HighlighterOptions {
  onSelect: (bounds: ElementBounds) => void;
  onCancel: () => void;
}

const DRAG_THRESHOLD = 5; // px - movement below this is treated as click

export class Highlighter {
  private overlay: HTMLDivElement | null = null;
  private dragOverlay: HTMLDivElement | null = null;
  private currentElement: Element | null = null;
  private options: HighlighterOptions;

  // Drag state
  private isDragging = false;
  private dragStart: { x: number; y: number } | null = null;
  private mouseDownPos: { x: number; y: number } | null = null;

  constructor(options: HighlighterOptions) {
    this.options = options;
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  start() {
    this.createOverlay();
    this.createDragOverlay();
    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('mousedown', this.handleMouseDown, true);
    document.addEventListener('mouseup', this.handleMouseUp, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
  }

  stop() {
    this.removeOverlay();
    this.removeDragOverlay();
    document.removeEventListener('mousemove', this.handleMouseMove, true);
    document.removeEventListener('mousedown', this.handleMouseDown, true);
    document.removeEventListener('mouseup', this.handleMouseUp, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
  }

  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    if (this.dragOverlay) {
      this.dragOverlay.style.display = 'none';
    }
  }

  private createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'spotlight-highlight-overlay';
    document.body.appendChild(this.overlay);
  }

  private createDragOverlay() {
    this.dragOverlay = document.createElement('div');
    this.dragOverlay.className = 'spotlight-drag-overlay';
    document.body.appendChild(this.dragOverlay);
  }

  private removeOverlay() {
    this.overlay?.remove();
    this.overlay = null;
  }

  private removeDragOverlay() {
    this.dragOverlay?.remove();
    this.dragOverlay = null;
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging && this.dragStart) {
      // Update drag selection rectangle
      this.updateDragOverlay(e.clientX, e.clientY);
      return;
    }

    if (this.mouseDownPos) {
      // Check if we should start dragging
      const dx = Math.abs(e.clientX - this.mouseDownPos.x);
      const dy = Math.abs(e.clientY - this.mouseDownPos.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        this.isDragging = true;
        this.dragStart = this.mouseDownPos;
        // Hide element overlay, show drag overlay
        if (this.overlay) this.overlay.style.display = 'none';
        this.updateDragOverlay(e.clientX, e.clientY);
        return;
      }
    }

    // Normal element highlighting (when not dragging)
    if (!this.overlay || this.isDragging) return;

    this.overlay.style.pointerEvents = 'none';
    const element = document.elementFromPoint(e.clientX, e.clientY);
    this.overlay.style.pointerEvents = 'auto';

    if (!element || element === this.currentElement) return;

    if (element.closest('.spotlight-highlight-overlay, .spotlight-drag-overlay, .spotlight-toast')) return;

    this.currentElement = element;
    this.updateOverlayPosition(element);
  }

  private updateOverlayPosition(element: Element) {
    if (!this.overlay) return;

    const rect = element.getBoundingClientRect();

    this.overlay.style.top = `${rect.top + window.scrollY}px`;
    this.overlay.style.left = `${rect.left + window.scrollX}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
    this.overlay.style.display = 'block';
  }

  private updateDragOverlay(currentX: number, currentY: number) {
    if (!this.dragOverlay || !this.dragStart) return;

    const x = Math.min(this.dragStart.x, currentX);
    const y = Math.min(this.dragStart.y, currentY);
    const width = Math.abs(currentX - this.dragStart.x);
    const height = Math.abs(currentY - this.dragStart.y);

    this.dragOverlay.style.top = `${y + window.scrollY}px`;
    this.dragOverlay.style.left = `${x + window.scrollX}px`;
    this.dragOverlay.style.width = `${width}px`;
    this.dragOverlay.style.height = `${height}px`;
    this.dragOverlay.style.display = 'block';
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return; // Only left click

    e.preventDefault();
    e.stopPropagation();

    this.mouseDownPos = { x: e.clientX, y: e.clientY };
  }

  private handleMouseUp(e: MouseEvent) {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    if (this.isDragging && this.dragStart) {
      // Complete drag selection
      const x = Math.min(this.dragStart.x, e.clientX);
      const y = Math.min(this.dragStart.y, e.clientY);
      const width = Math.abs(e.clientX - this.dragStart.x);
      const height = Math.abs(e.clientY - this.dragStart.y);

      if (width > DRAG_THRESHOLD && height > DRAG_THRESHOLD) {
        const bounds: ElementBounds = { x, y, width, height };
        this.resetDragState();
        this.options.onSelect(bounds);
        return;
      }
    } else if (this.currentElement) {
      // Click on element
      const rect = this.currentElement.getBoundingClientRect();
      const bounds: ElementBounds = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
      this.resetDragState();
      this.options.onSelect(bounds);
      return;
    }

    this.resetDragState();
  }

  private resetDragState() {
    this.isDragging = false;
    this.dragStart = null;
    this.mouseDownPos = null;
    if (this.dragOverlay) {
      this.dragOverlay.style.display = 'none';
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.resetDragState();
      this.options.onCancel();
    }
  }
}
