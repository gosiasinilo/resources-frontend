import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../Button/Button';

interface SuccessBannerProps {
  title: string;
  message: string;
  onContinue: () => void;
  autoRedirect?: number; // seconds before auto redirect
}

export default function SuccessBanner({
  title,
  message,
  onContinue,
  autoRedirect = 2,
}: SuccessBannerProps) {
  useEffect(() => {
    const t = setTimeout(onContinue, autoRedirect * 1000);
    return () => clearTimeout(t);
  }, [onContinue, autoRedirect]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-bg/80 backdrop-blur-sm">
      <div className="bg-paper border border-border rounded p-8 w-full max-w-sm text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-highlight/10 border border-highlight/30 flex items-center justify-center mx-auto mb-5">
          <FontAwesomeIcon icon="circle-check" className="text-highlight text-3xl" />
        </div>
        <h2 className="font-display text-xl text-text mb-2">{title}</h2>
        <p className="text-inactive text-sm mb-6">{message}</p>
        <Button onClick={onContinue} icon="arrow-right" fullWidth>
          Continue
        </Button>
        <p className="text-inactive text-xs mt-3">
          Redirecting automatically...
        </p>
      </div>
    </div>
  );
}
