export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

/**
 * Trigger subtle haptic vibration feedback using the Vibration API.
 * Safely guards against unsupported devices, iframes, and user settings.
 */
export const triggerHaptic = (style: HapticStyle = 'medium') => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (style) {
        case 'light':
        case 'selection':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(28);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'success':
          // Crisp double pulse
          navigator.vibrate([15, 50, 25]);
          break;
        case 'warning':
          navigator.vibrate([35, 60, 35]);
          break;
        case 'error':
          navigator.vibrate([45, 50, 45, 50, 45]);
          break;
        default:
          navigator.vibrate(25);
      }
    }
  } catch {
    // Ignore any browser security restrictions or permission errors
  }
};
