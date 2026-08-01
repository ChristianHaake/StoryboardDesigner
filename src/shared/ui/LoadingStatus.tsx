import { useTranslation } from 'react-i18next';

interface LoadingStatusProps {
  className?: string;
}

export default function LoadingStatus({ className = '' }: LoadingStatusProps) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-32 w-full items-center justify-center px-4 text-pretty text-center text-sm font-medium text-slate-600 ${className}`}
    >
      {t('common.loading')}
    </div>
  );
}
