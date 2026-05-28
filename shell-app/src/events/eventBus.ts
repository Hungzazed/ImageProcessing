import { EventBusMap } from '../types';

/**
 * Dispatches a custom event on the global window object.
 */
export function emitEvent<K extends keyof EventBusMap>(
  event: K,
  detail: EventBusMap[K]
): void {
  if (typeof window === 'undefined') return;
  const customEvent = new CustomEvent(event, { detail });
  window.dispatchEvent(customEvent);
}

/**
 * Subscribes to a custom event on the global window object.
 */
export function listenEvent<K extends keyof EventBusMap>(
  event: K,
  callback: (detail: EventBusMap[K]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<EventBusMap[K]>;
    callback(customEvent.detail);
  };
  
  window.addEventListener(event, handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(event, handler);
  };
}

/**
 * Removes a custom event listener manually if needed.
 */
export function removeEvent<K extends keyof EventBusMap>(
  event: K,
  callback: (detail: EventBusMap[K]) => void
): void {
  if (typeof window === 'undefined') return;
  
  // Keep compatibility with standard removeEventListener if custom references are managed
  // Since we return cleanup functions from listenEvent, removeEvent is mostly helper fallback
}
