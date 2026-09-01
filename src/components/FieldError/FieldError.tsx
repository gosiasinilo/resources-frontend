import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface FieldErrorProps {
  message?: string;
}

export default function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className="text-orange-400 text-xs mt-1 flex items-center gap-1.5">
      <FontAwesomeIcon icon="xmark" className="text-xs shrink-0" />
      {message}
    </p>
  );
}
