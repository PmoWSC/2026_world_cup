import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export function useAdaptiveLayout() {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width } = dimensions;

  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Chat takes full width on phone, or a fixed portion on larger screens
  const chatWidth = isPhone ? width : isTablet ? width * 0.55 : width * 0.4;
  const contextWidth = isPhone ? width : width - chatWidth;

  return { isPhone, isTablet, isDesktop, chatWidth, contextWidth };
}
