import { driver, type DriveStep } from "driver.js";
import { useCallback, useState } from "react";
import "driver.js/dist/driver.css";

const STORAGE_PREFIX = "tour-completed-";

export interface TourStep {
  element: string; // CSS selector (e.g., '[data-tour="sidebar-toggle"]')
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left" | "over"; // "over" centers the popover on screen
  disableOverlay?: boolean; // Hide the darkened background for this step
}

export interface UseTourOptions {
  tourId: string; // Unique ID for localStorage (e.g., 'sidebar', 'cic-list')
  steps: TourStep[];
}

export function useTour({ tourId, steps }: UseTourOptions) {
  const storageKey = `${STORAGE_PREFIX}${tourId}`;

  const [hasCompleted, setHasCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(storageKey) === "true";
    }
    return false;
  });

  const startTour = useCallback(() => {
    const driverSteps: DriveStep[] = steps.map((step) => ({
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side,
      },
    }));

    const driverObj = driver({
      showProgress: true,
      steps: driverSteps,
      onHighlightStarted: (element, step, options) => {
        // Find the current step config to check if overlay should be disabled
        const currentStepIndex = driverSteps.findIndex(
          (s) => s.element === step.element,
        );
        const currentStep = steps[currentStepIndex];
        if (currentStep?.disableOverlay) {
          // Hide the overlay by setting opacity to 0
          const overlay = document.querySelector(".driver-overlay");
          if (overlay) {
            (overlay as HTMLElement).style.opacity = "0";
          }
        } else {
          // Restore overlay
          const overlay = document.querySelector(".driver-overlay");
          if (overlay) {
            (overlay as HTMLElement).style.opacity = "";
          }
        }
      },
      onDestroyed: () => {
        localStorage.setItem(storageKey, "true");
        setHasCompleted(true);
      },
    });
    driverObj.drive();
  }, [steps, storageKey]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasCompleted(false);
  }, [storageKey]);

  return { startTour, hasCompleted, resetTour };
}
