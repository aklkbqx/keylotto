// libs/hooks/useKeyboard.ts
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

interface KeyboardInfo {
  isVisible: boolean;
  height: number;
}

/**
 * Hook for managing keyboard visibility and height
 * @returns Object containing keyboard visibility state and height
 */
function useKeyboard(): KeyboardInfo {
  const [isVisible, setIsVisible] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(
      showEvent,
      (e: KeyboardEvent) => {
        setIsVisible(true);
        setHeight(e.endCoordinates.height);
      }
    );

    const hideSubscription = Keyboard.addListener(
      hideEvent,
      () => {
        setIsVisible(false);
        setHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { isVisible, height };
}

export default useKeyboard