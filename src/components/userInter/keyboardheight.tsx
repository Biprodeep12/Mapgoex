export default function getKeyboardHeight(
  onKeyboardHeightChange: (height: number) => void
): () => void {
  if (typeof window === 'undefined' || !window.visualViewport) {
    console.log('visualViewport API is not supported on this browser.');
    return () => {};
  }

  let previousHeight = window.visualViewport.height;

  const handleResize = () => {
    if (!window.visualViewport) return;

    const viewportHeight = window.visualViewport.height;
    const windowInnerHeight = window.innerHeight;

    const keyboardHeight = Math.max(0, windowInnerHeight - viewportHeight);

    if (keyboardHeight !== 0 && keyboardHeight !== previousHeight) {
      onKeyboardHeightChange(keyboardHeight);
      previousHeight = keyboardHeight;
    }
  };

  window.visualViewport.addEventListener('resize', handleResize);

  return () => {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleResize);
    }
  };
}