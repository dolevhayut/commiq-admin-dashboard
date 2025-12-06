import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Tutorial, { TutorialStep } from '../components/Tutorial';
import { dashboardSteps, ticketsSteps, ticketDetailSteps } from '../data/tutorialSteps';

interface TutorialContextType {
  isTutorialActive: boolean;
  startTutorial: () => void;
  stopTutorial: () => void;
  skipTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_COMPLETED_KEY = 'commiq_tutorial_completed';

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<TutorialStep[]>([]);
  const location = useLocation();

  // Load tutorial steps based on current route
  useEffect(() => {
    if (!isTutorialActive) {
      setCurrentSteps([]);
      return;
    }

    // Wait a bit for page to render before setting steps
    const timer = setTimeout(() => {
      if (location.pathname === '/') {
        setCurrentSteps(dashboardSteps);
      } else if (location.pathname === '/tickets') {
        setCurrentSteps(ticketsSteps);
      } else if (location.pathname.match(/^\/tickets\/[^/]+$/)) {
        setCurrentSteps(ticketDetailSteps);
      } else {
        setCurrentSteps([]);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, isTutorialActive]);

  const startTutorial = () => {
    setIsTutorialActive(true);
  };

  const stopTutorial = () => {
    setIsTutorialActive(false);
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  };

  const skipTutorial = () => {
    setIsTutorialActive(false);
  };

  return (
    <TutorialContext.Provider
      value={{
        isTutorialActive,
        startTutorial,
        stopTutorial,
        skipTutorial,
      }}
    >
      {children}
      {isTutorialActive && currentSteps.length > 0 && (
        <Tutorial
          steps={currentSteps}
          isActive={isTutorialActive}
          onComplete={stopTutorial}
          onSkip={skipTutorial}
        />
      )}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

export function isTutorialCompleted(): boolean {
  return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
}

