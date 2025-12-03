import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Play, CheckCircle } from 'lucide-react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  route?: string; // Route to navigate to before showing this step
  action?: 'click' | 'scroll' | 'wait'; // Action user needs to take
  delay?: number; // Delay before showing this step (ms)
}

interface TutorialProps {
  steps: TutorialStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function Tutorial({ steps, isActive, onComplete, onSkip }: TutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const currentStep = steps[currentStepIndex];

  // Navigate to required route if needed
  useEffect(() => {
    if (!isActive || !currentStep) return;

    if (currentStep.route && location.pathname !== currentStep.route) {
      navigate(currentStep.route);
      // Wait for navigation to complete
      setTimeout(() => {
        setIsPositioned(false);
      }, 500);
    }
  }, [currentStep, location.pathname, navigate, isActive]);

  // Find and position target element
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetElement(null);
      setIsPositioned(false);
      return;
    }

    const findAndPosition = () => {
      if (currentStep.delay) {
        setTimeout(() => {
          findElement();
        }, currentStep.delay);
      } else {
        findElement();
      }
    };

    const findElement = () => {
      if (!currentStep.target) {
        setTargetElement(null);
        setIsPositioned(true);
        return;
      }

      const element = document.querySelector(currentStep.target) as HTMLElement;
      if (element && element.offsetParent !== null) {
        // Element exists and is visible
        setTargetElement(element);
        scrollToElement(element);
        // Wait a bit for scroll to complete, then calculate position
        setTimeout(() => {
          calculateTooltipPosition(element);
        }, 300);
      } else {
        // Retry up to 5 times if element not found
        let retries = 0;
        const maxRetries = 5;
        const retryInterval = setInterval(() => {
          retries++;
          const retryElement = document.querySelector(currentStep.target!) as HTMLElement;
          if (retryElement && retryElement.offsetParent !== null) {
            clearInterval(retryInterval);
            setTargetElement(retryElement);
            scrollToElement(retryElement);
            setTimeout(() => {
              calculateTooltipPosition(retryElement);
            }, 300);
          } else if (retries >= maxRetries) {
            clearInterval(retryInterval);
            // Element not found, show tooltip in center
            setTargetElement(null);
            setIsPositioned(true);
          }
        }, 500);
      }
    };

    findAndPosition();
  }, [currentStep, isActive, location.pathname]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!isActive || !targetElement) return;

    const handleResize = () => {
      calculateTooltipPosition(targetElement);
    };

    const handleScroll = () => {
      calculateTooltipPosition(targetElement);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [targetElement, isActive]);

  const calculateTooltipPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const position = currentStep.position || 'bottom';
    
    // Use requestAnimationFrame to ensure tooltip is rendered before calculating position
    requestAnimationFrame(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip) {
        // If tooltip not rendered yet, try again
        setTimeout(() => calculateTooltipPosition(element), 50);
        return;
      }

      const tooltipRect = tooltip.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - tooltipRect.height - 16;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 16;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.left - tooltipRect.width - 16;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.right + 16;
          break;
        case 'center':
          top = window.innerHeight / 2 - tooltipRect.height / 2;
          left = window.innerWidth / 2 - tooltipRect.width / 2;
          break;
      }

      // Keep tooltip within viewport
      const padding = 20;
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

      setTooltipPosition({ top, left });
      setIsPositioned(true);
    });
  };

  const scrollToElement = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top + window.scrollY;
    const elementCenter = elementTop + rect.height / 2;
    const windowCenter = window.innerHeight / 2;

    window.scrollTo({
      top: elementCenter - windowCenter,
      behavior: 'smooth',
    });
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsPositioned(false);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setIsPositioned(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isActive || !currentStep) return null;

  // Calculate spotlight position
  const spotlightStyle: React.CSSProperties = targetElement
    ? (() => {
        const rect = targetElement.getBoundingClientRect();
        return {
          clipPath: `polygon(
            0% 0%,
            0% 100%,
            ${rect.left}px 100%,
            ${rect.left}px ${rect.top}px,
            ${rect.right}px ${rect.top}px,
            ${rect.right}px ${rect.bottom}px,
            ${rect.left}px ${rect.bottom}px,
            ${rect.left}px 100%,
            100% 100%,
            100% 0%
          )`,
        };
      })()
    : {};

  return (
    <>
      {/* Overlay with spotlight */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] pointer-events-auto"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          ...spotlightStyle,
        }}
        onClick={(e) => {
          // Allow clicks on highlighted element
          if (targetElement && targetElement.contains(e.target as Node)) {
            return;
          }
          // Prevent clicks outside
          e.stopPropagation();
        }}
      />

      {/* Tooltip */}
      {(isPositioned || targetElement !== null) && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-auto"
          style={{
            top: isPositioned ? `${tooltipPosition.top}px` : '-9999px',
            left: isPositioned ? `${tooltipPosition.left}px` : '-9999px',
            maxWidth: '400px',
            minWidth: '300px',
            opacity: isPositioned ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6"
            style={{ border: '2px solid #E55539' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: '#E55539' }}
                  >
                    {currentStepIndex + 1}
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: '#08083A' }}>
                    {currentStep.title}
                  </h3>
                </div>
                <p className="text-sm" style={{ color: '#5C5C6B' }}>
                  {currentStep.description}
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                style={{ color: '#8A8A99' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action hint */}
            {currentStep.action === 'click' && (
              <div
                className="mb-4 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                style={{ backgroundColor: '#FFF4F2', color: '#A32814' }}
              >
                <Play className="w-4 h-4" />
                לחץ על האלמנט המסומן
              </div>
            )}

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#8A8A99' }}>
                <span>שלב {currentStepIndex + 1} מתוך {steps.length}</span>
                <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: '#EDEDF5' }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                    backgroundColor: '#E55539',
                  }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentStepIndex === 0 ? '#EDEDF5' : '#F8F8FF',
                  color: currentStepIndex === 0 ? '#8A8A99' : '#08083A',
                  border: '1px solid #D4D4DF',
                }}
              >
                <ChevronRight className="w-4 h-4" />
                הקודם
              </button>

              {currentStepIndex < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white transition-colors"
                  style={{ backgroundColor: '#E55539' }}
                >
                  הבא
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onComplete}
                  className="px-6 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white transition-colors"
                  style={{ backgroundColor: '#16A34A' }}
                >
                  <CheckCircle className="w-4 h-4" />
                  סיום
                </button>
              )}
            </div>
          </div>

          {/* Arrow pointing to target */}
          {targetElement && currentStep.position && currentStep.position !== 'center' && (
            <div
              className="absolute"
              style={{
                ...(currentStep.position === 'top' && {
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #E55539',
                }),
                ...(currentStep.position === 'bottom' && {
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #E55539',
                }),
                ...(currentStep.position === 'left' && {
                  right: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderLeft: '8px solid #E55539',
                }),
                ...(currentStep.position === 'right' && {
                  left: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid #E55539',
                }),
              }}
            />
          )}
        </div>
      )}
    </>
  );
}

