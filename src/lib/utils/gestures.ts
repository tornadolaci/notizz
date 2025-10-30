/**
 * Gesture utilities for touch and drag interactions
 * Handles swipe detection, drag thresholds, and haptic feedback
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
  /** Enable haptic feedback on swipe */
  hapticFeedback: boolean;
}

const DEFAULT_SWIPE_CONFIG: SwipeConfig = {
  threshold: 50,
  maxDuration: 300,
  minVelocity: 0.3,
  hapticFeedback: true,
};

/**
 * Trigger haptic feedback using the Vibration API
 * @param pattern - Vibration pattern (number or array of numbers)
 */
export function triggerHapticFeedback(pattern: number | number[] = 10): void {
  if (!('vibrate' in navigator)) return;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration is not supported
    console.debug('Haptic feedback not available:', error);
  }
}

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

    // Trigger haptic feedback
    if (cfg.hapticFeedback) {
      triggerHapticFeedback();
    }
  } else if (distanceY > distanceX && distanceY > cfg.threshold) {
    // Vertical swipe
    direction = deltaY > 0 ? 'down' : 'up';

    // Trigger haptic feedback
    if (cfg.hapticFeedback) {
      triggerHapticFeedback();
    }
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

  const findContainer = (): HTMLElement | null => {
    return document.querySelector(config.containerSelector);
  };

  const createPlaceholder = (): HTMLElement => {
    const ph = document.createElement('div');
    ph.style.height = `${element.offsetHeight}px`;
    ph.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
    ph.style.border = '2px dashed var(--color-info)';
    ph.style.borderRadius = '20px';
    ph.style.marginBottom = '12px';
    return ph;
  };

  const getItemsInContainer = (): HTMLElement[] => {
    const container = findContainer();
    if (!container) return [];
    return Array.from(container.querySelectorAll('[data-draggable-id]'));
  };

  const handleDragStart = (clientY: number) => {
    isDragging = true;
    startY = clientY;
    currentY = clientY;

    // Create placeholder
    placeholder = createPlaceholder();
    element.parentElement?.insertBefore(placeholder, element.nextSibling);

    // Style dragged element
    element.style.position = 'fixed';
    element.style.zIndex = '1000';
    element.style.opacity = '0.9';
    element.style.transform = 'scale(1.05)';
    element.style.width = `${element.offsetWidth}px`;
    element.style.left = `${element.getBoundingClientRect().left}px`;
    element.style.top = `${element.getBoundingClientRect().top}px`;
    element.style.cursor = 'grabbing';
    element.style.pointerEvents = 'none';

    draggedElement = element;
    triggerHapticFeedback();
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging || !draggedElement || !placeholder) return;

    currentY = clientY;
    const deltaY = currentY - startY;

    // Update position
    const initialTop = parseFloat(element.style.top);
    draggedElement.style.top = `${initialTop + deltaY}px`;
    startY = currentY;

    // Find closest item
    const items = getItemsInContainer();
    const draggedRect = draggedElement.getBoundingClientRect();
    const draggedCenterY = draggedRect.top + draggedRect.height / 2;

    for (const item of items) {
      if (item === draggedElement || item === placeholder) continue;

      const itemRect = item.getBoundingClientRect();
      const itemCenterY = itemRect.top + itemRect.height / 2;

      if (draggedCenterY < itemCenterY && placeholder.nextSibling !== item) {
        item.parentElement?.insertBefore(placeholder, item);
        triggerHapticFeedback(5);
        break;
      } else if (draggedCenterY > itemCenterY && placeholder.previousSibling !== item) {
        item.parentElement?.insertBefore(placeholder, item.nextSibling);
        triggerHapticFeedback(5);
        break;
      }
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || !draggedElement || !placeholder) return;

    // Reset styles
    draggedElement.style.position = '';
    draggedElement.style.zIndex = '';
    draggedElement.style.opacity = '';
    draggedElement.style.transform = '';
    draggedElement.style.width = '';
    draggedElement.style.left = '';
    draggedElement.style.top = '';
    draggedElement.style.cursor = '';
    draggedElement.style.pointerEvents = '';

    // Replace placeholder with element
    placeholder.parentElement?.insertBefore(draggedElement, placeholder);
    placeholder.remove();

    // Get new order
    const items = getItemsInContainer();
    const newOrder = items
      .filter(item => item.dataset.draggableId)
      .map(item => item.dataset.draggableId!);

    config.onReorder(newOrder);

    isDragging = false;
    draggedElement = null;
    placeholder = null;
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
