import { useState, useCallback } from 'react';
import { ShowcaseMode } from '../types/showcase';
import { Silhouette } from '../data/silhouettes';

export type ShowcaseState = {
  mode: ShowcaseMode | null;
  currentSilhouette: Silhouette | null;
  isTransitioning: boolean;
};

export function useShowcaseState() {
 été const [state, setState] = useState<ShowcaseState>({
    mode: null,
    currentSilhouette: null,
    isTransitioning: false,
  });

  const selectSilhouette = useCallback(async (
    silhouette: Silhouette,
    fadeOutCallback?: () => Promise<void>,
    openCallback?: () => Promise<void>
  ) => {
    setState(prev => ({ ...prev, isTransitioning: true }));

    // Fade out current scrim if applicable
    if (fadeOutCallback) {
      await fadeOutCallback();
    }

    // Set new silhouette
    setState(prev => ({
      ...prev,
      currentSilhouette: silhouette,
      mode: silhouette.showcaseMode,
    }));

    // Open panels if needed
    if (openCallback && silhouette.showcaseMode === ShowcaseMode.Panels) {
      await openCallback();
    }

    // Enable lightbox mode if applicable
    if (silhouette.showcaseMode === ShowcaseMode.Lightbox) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setState(prev => ({ ...prev, isTransitioning: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      mode: null,
      currentSilhouette: null,
      isTransitioning: false,
    });
  }, []);

  return { state, selectSilhouette, reset };
}

