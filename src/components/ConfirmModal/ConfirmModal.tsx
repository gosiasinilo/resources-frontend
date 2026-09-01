import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../Button/Button';

interface ConfirmModalProps {
  message: string;
  subMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  confirmLabel?: string;
}

export default function ConfirmModal({
  message,
  subMessage,
  onConfirm,
  onCancel,
  danger = true,
  confirmLabel = 'Delete',
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-paper border border-border rounded p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-orange-950/50' : 'bg-toplayer'}`}>
            <FontAwesomeIcon icon={danger ? 'trash' : 'circle-check'} className={danger ? 'text-orange-400' : 'text-highlight'} />
          </div>
          <div>
            <p className="text-text font-medium">{message}</p>
            {subMessage && <p className="text-inactive text-sm mt-1">{subMessage}</p>}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button danger={danger} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
