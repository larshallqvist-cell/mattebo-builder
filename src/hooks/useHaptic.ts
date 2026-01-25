/**
 * Hook for haptic feedback on mobile devices
 * Uses the Vibration API when available
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30],
  error: [50, 30, 50, 30, 50],
};

export const useHaptic = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = (pattern: HapticPattern = 'light') => {
    if (!isSupported) return;
    
    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      // Silently fail if vibration is not allowed
    }
  };

  return { trigger, isSupported };
};

// Standalone function for use outside React components
export const hapticFeedback = (pattern: HapticPattern = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      // Silently fail
    }
  }
};
