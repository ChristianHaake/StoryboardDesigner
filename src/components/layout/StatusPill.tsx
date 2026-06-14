import { StatusPill as SharedStatusPill } from '@haak3/ui';

interface LocalStatusPillProps {
  label: string;
  className?: string;
}

export default function StatusPill({ label, className = '' }: LocalStatusPillProps) {
  return <SharedStatusPill label={label} className={className} />;
}
