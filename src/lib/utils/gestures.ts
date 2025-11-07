/**
 * Gesture utilities for touch and drag interactions
 * Handles swipe detection and drag thresholds
 */

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
}

export interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  isDragging: boolean;
  timestamp: number;
}

export interface SwipeConfig {
  /** Minimum distance (px) to trigger a swipe */
  threshold: number;
  /** Maximum time (ms) for a swipe gesture */
  maxDuration: number;
  /** Minimum velocity (px/ms) to trigger a swipe */
  minVelocity: number;
}

const DEFAULT_SWIPE_CONFIG: SwipeConfig = {
  threshold: 50,
  maxDuration: 300,
  minVelocity: 0.3,
};

/**
 * Detect swipe direction and velocity from touch/pointer events
 * @param startState - Initial drag state
 * @param endState - Final drag state
 * @param config - Swipe configuration
 * @returns SwipeDirection object
 */
export function detectSwipe(
  startState: Pick<DragState, 'startX' | 'startY' | 'timestamp'>,
  endState: Pick<DragState, 'currentX' | 'currentY' | 'timestamp'>,
  config: Partial<SwipeConfig> = {}
): SwipeDirection {
  const cfg = { ...DEFAULT_SWIPE_CONFIG, ...config };

  const deltaX = endState.currentX - startState.startX;
  const deltaY = endState.currentY - startState.startY;
  const duration = endState.timestamp - startState.timestamp;

  const distanceX = Math.abs(deltaX);
  const distanceY = Math.abs(deltaY);
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  const velocity = distance / duration;

  // Check if gesture qualifies as a swipe
  if (duration > cfg.maxDuration || velocity < cfg.minVelocity) {
    return { direction: null, distance: 0, velocity: 0 };
  }

  // Determine primary direction (horizontal or vertical)
  let direction: SwipeDirection['direction'] = null;

  if (distanceX > distanceY && distanceX > cfg.threshold) {
    // Horizontal swipe
    direction = deltaX > 0 ? 'right' : 'left';
  } else if (distanceY > distanceX && distanceY > cfg.threshold) {
    // Vertical swipe
    direction = deltaY > 0 ? 'down' : 'up';
  }

  return { direction, distance, velocity };
}

/**
 * Create a drag handler for Svelte actions
 * @param element - Target element
 * @param callbacks - Callback functions for drag events
 * @returns Cleanup function
 */
export interface DragCallbacks {
  onDragStart?: (state: DragState) => void;
  onDrag?: (state: DragState) => void;
  onDragEnd?: (state: DragState, swipe: SwipeDirection) => void;
}

export function createDragHandler(
  element: HTMLElement,
  callbacks: DragCallbacks,
  swipeConfig: Partial<SwipeConfig> = {}
) {
  let dragState: DragState | null = null;
  let isTouching = false;

  const handleStart = (clientX: number, clientY: number) => {
    isTouching = true;
    dragState = {
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      deltaX: 0,
      deltaY: 0,
      isDragging: false,
      timestamp: Date.now(),
    };

    callbacks.onDragStart?.(dragState);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isTouching || !dragState) return;

    dragState.currentX = clientX;
    dragState.currentY = clientY;
    dragState.deltaX = clientX - dragState.startX;
    dragState.deltaY = clientY - dragState.startY;

    // Consider it dragging if moved more than 5px
    if (!dragState.isDragging && (Math.abs(dragState.deltaX) > 5 || Math.abs(dragState.deltaY) > 5)) {
      dragState.isDragging = true;
    }

    if (dragState.isDragging) {
      callbacks.onDrag?.(dragState);
    }
  };

  const handleEnd = (clientX: number, clientY: number) => {
    if (!isTouching || !dragState) return;

    dragState.currentX = clientX;
    dragState.currentY = clientY;
    dragState.deltaX = clientX - dragState.startX;
    dragState.deltaY = clientY - dragState.startY;

    const endTimestamp = Date.now();
    const swipe = detectSwipe(
      { startX: dragState.startX, startY: dragState.startY, timestamp: dragState.timestamp },
      { currentX: dragState.currentX, currentY: dragState.currentY, timestamp: endTimestamp },
      swipeConfig
    );

    callbacks.onDragEnd?.(dragState, swipe);

    isTouching = false;
    dragState = null;
  };

  // Touch events
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    handleStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    handleMove(touch.clientX, touch.clientY);

    // Prevent scrolling while dragging horizontally
    if (dragState?.isDragging && Math.abs(dragState.deltaX) > Math.abs(dragState.deltaY)) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    handleEnd(touch.clientX, touch.clientY);
  };

  // Mouse events (for desktop testing)
  const onMouseDown = (e: MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const onMouseUp = (e: MouseEvent) => {
    handleEnd(e.clientX, e.clientY);
  };

  const onMouseLeave = (e: MouseEvent) => {
    if (isTouching) {
      handleEnd(e.clientX, e.clientY);
    }
  };

  // Add event listeners
  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: false });
  element.addEventListener('touchend', onTouchEnd, { passive: true });
  element.addEventListener('mousedown', onMouseDown);
  element.addEventListener('mousemove', onMouseMove);
  element.addEventListener('mouseup', onMouseUp);
  element.addEventListener('mouseleave', onMouseLeave);

  // Cleanup function
  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('mousedown', onMouseDown);
    element.removeEventListener('mousemove', onMouseMove);
    element.removeEventListener('mouseup', onMouseUp);
    element.removeEventListener('mouseleave', onMouseLeave);
  };
}

/**
 * Svelte action for swipeable elements
 * Usage: <div use:swipeable={{ onSwipeLeft, onSwipeRight }}>
 */
export interface SwipeableConfig extends Partial<SwipeConfig> {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function swipeable(element: HTMLElement, config: SwipeableConfig = {}) {
  const cleanup = createDragHandler(
    element,
    {
      onDragEnd: (_state, swipe) => {
        if (swipe.direction === 'left' && config.onSwipeLeft) {
          config.onSwipeLeft();
        } else if (swipe.direction === 'right' && config.onSwipeRight) {
          config.onSwipeRight();
        } else if (swipe.direction === 'up' && config.onSwipeUp) {
          config.onSwipeUp();
        } else if (swipe.direction === 'down' && config.onSwipeDown) {
          config.onSwipeDown();
        }
      },
    },
    config
  );

  return {
    destroy: cleanup,
  };
}

/**
 * Calculate CSS transform for drag offset
 * @param deltaX - Horizontal offset
 * @param deltaY - Vertical offset
 * @param maxOffset - Maximum allowed offset (optional)
 * @returns CSS transform string
 */
export function getDragTransform(deltaX: number, deltaY: number, maxOffset?: number): string {
  let x = deltaX;
  let y = deltaY;

  if (maxOffset !== undefined) {
    x = Math.max(-maxOffset, Math.min(maxOffset, x));
    y = Math.max(-maxOffset, Math.min(maxOffset, y));
  }

  return `translate(${x}px, ${y}px)`;
}

/**
 * Check if touch is supported
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Drag and drop reordering action
 * Usage: <div use:draggableItem={{ id, onReorder }}>
 */
export interface DraggableItemConfig {
  id: string;
  containerSelector: string;
  onReorder: (reorderedIds: string[]) => void;
}

export function draggableItem(element: HTMLElement, config: DraggableItemConfig) {
  let isDragging = false;
  let draggedElement: HTMLElement | null = null;
  let placeholder: HTMLElement | null = null;
  let startY = 0;
  let currentY = 0;
  let lastReorderTime = 0;
  const REORDER_THROTTLE_MS = 150; // Minimum time between reorders

  const findContainer = (): HTMLElement | null => {
    return document.querySelector(config.containerSelector);
  };

  const createPlaceholder = (): HTMLElement => {
    const ph = document.createElement('div');
    ph.style.height = `${element.offsetHeight}px`;
    ph.style.backgroundColor = 'rgba(0, 122, 255, 0.08)';
    ph.style.border = '2px dashed rgba(0, 122, 255, 0.3)';
    ph.style.borderRadius = '20px';
    ph.style.marginBottom = '12px';
    ph.style.transition = 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // Smoother easing
    ph.style.opacity = '0';
    // Fade in placeholder
    requestAnimationFrame(() => {
      ph.style.opacity = '1';
    });
    return ph;
  };

  const getItemsInContainer = (): HTMLElement[] => {
    const container = findContainer();
    if (!container) return [];
    return Array.from(container.querySelectorAll('[data-draggable-id]'));
  };

  const handleDragStart = (clientY: number) => {
    isDragging = true;
    const rect = element.getBoundingClientRect();
    startY = clientY;
    currentY = clientY;

    // Create placeholder
    placeholder = createPlaceholder();
    element.parentElement?.insertBefore(placeholder, element.nextSibling);

    // Style dragged element with smooth transitions
    element.style.position = 'fixed';
    element.style.zIndex = '1000';
    element.style.opacity = '0.95';
    element.style.transform = 'scale(1.03)';
    element.style.transition = 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease, box-shadow 200ms ease';
    element.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
    element.style.width = `${rect.width}px`;
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.cursor = 'grabbing';
    element.style.pointerEvents = 'none';

    draggedElement = element;
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging || !draggedElement || !placeholder) return;

    currentY = clientY;
    const deltaY = currentY - startY;

    // Disable transition during drag for smooth following
    draggedElement.style.transition = 'none';

    // Update position smoothly
    const initialTop = parseFloat(draggedElement.style.top);
    draggedElement.style.top = `${initialTop + deltaY}px`;
    startY = currentY;

    // Throttle reordering to reduce vibration
    const now = Date.now();
    if (now - lastReorderTime < REORDER_THROTTLE_MS) {
      return;
    }

    // Find closest item with dead zone for smoother reordering
    const items = getItemsInContainer();
    const draggedRect = draggedElement.getBoundingClientRect();
    const draggedCenterY = draggedRect.top + draggedRect.height / 2;

    for (const item of items) {
      if (item === draggedElement || item === placeholder) continue;

      const itemRect = item.getBoundingClientRect();
      const itemCenterY = itemRect.top + itemRect.height / 2;

      // Use 30% overlap threshold instead of centerpoint
      const overlapThreshold = itemRect.height * 0.3;

      if (draggedCenterY < itemCenterY - overlapThreshold && placeholder.nextSibling !== item) {
        item.parentElement?.insertBefore(placeholder, item);
        lastReorderTime = now;
        break;
      } else if (draggedCenterY > itemCenterY + overlapThreshold && placeholder.previousSibling !== item) {
        item.parentElement?.insertBefore(placeholder, item.nextSibling);
        lastReorderTime = now;
        break;
      }
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || !draggedElement || !placeholder) return;

    // Save references before they're cleared
    const draggedRef = draggedElement;
    const placeholderRef = placeholder;

    // Re-enable transition for smooth drop animation
    draggedRef.style.transition = 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)';

    // Animate back to placeholder position
    const placeholderRect = placeholderRef.getBoundingClientRect();
    draggedRef.style.top = `${placeholderRect.top}px`;
    draggedRef.style.left = `${placeholderRect.left}px`;
    draggedRef.style.transform = 'scale(1)';
    draggedRef.style.opacity = '1';
    draggedRef.style.boxShadow = '';

    // Immediately mark as not dragging to prevent duplicate calls
    isDragging = false;

    // Wait for animation to complete before cleanup
    setTimeout(() => {
      // Reset styles
      draggedRef.style.position = '';
      draggedRef.style.zIndex = '';
      draggedRef.style.opacity = '';
      draggedRef.style.transform = '';
      draggedRef.style.transition = '';
      draggedRef.style.boxShadow = '';
      draggedRef.style.width = '';
      draggedRef.style.left = '';
      draggedRef.style.top = '';
      draggedRef.style.cursor = '';
      draggedRef.style.pointerEvents = '';

      // Replace placeholder with element
      if (placeholderRef && placeholderRef.parentElement) {
        placeholderRef.parentElement.insertBefore(draggedRef, placeholderRef);
        placeholderRef.remove();
      }

      // Get new order
      const items = getItemsInContainer();
      const newOrder = items
        .filter(item => item.dataset.draggableId)
        .map(item => item.dataset.draggableId!);

      // Clear references
      draggedElement = null;
      placeholder = null;

      // Call reorder callback
      config.onReorder(newOrder);
    }, 250);
  };

  // Long press to activate drag
  let longPressTimer: number | null = null;
  let longPressActivated = false;

  const startLongPress = (clientY: number) => {
    longPressActivated = false;
    longPressTimer = window.setTimeout(() => {
      longPressActivated = true;
      handleDragStart(clientY);
    }, 300); // 300ms long press
  };

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  // Touch events
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startLongPress(touch.clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    if (!longPressActivated) {
      // Cancel long press if moved before activation
      const deltaY = Math.abs(touch.clientY - startY);
      if (deltaY > 10) {
        cancelLongPress();
      }
    } else {
      e.preventDefault();
      handleDragMove(touch.clientY);
    }
  };

  const onTouchEnd = () => {
    cancelLongPress();
    if (longPressActivated) {
      handleDragEnd();
    }
  };

  // Mouse events
  const onMouseDown = (e: MouseEvent) => {
    // Only allow drag with long press on touch devices
    // On desktop, use modifier key (Alt) to enable drag
    if (e.altKey) {
      handleDragStart(e.clientY);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientY);
  };

  const onMouseUp = () => {
    handleDragEnd();
  };

  // Add event listeners
  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: false });
  element.addEventListener('touchend', onTouchEnd, { passive: true });
  element.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Add data attribute for identification
  element.dataset.draggableId = config.id;

  return {
    destroy() {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      delete element.dataset.draggableId;
    },
  };
}
