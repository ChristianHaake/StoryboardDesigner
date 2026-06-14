
import logoDefault from '../assets/logo-default.png';
import logoInverted from '../assets/logo-inverted.png';

export interface BrandLogoProps {
  /** The application title to display */
  appTitle: string;
  /** The tagline to display below the title */
  tagline?: string;
  /** Hide tagline (e.g. in the footer). */
  showTagline?: boolean;
  className?: string;
  /** Indicates whether the inverted logo (for dark backgrounds) should be used */
  inverted?: boolean;
}

export function BrandLogo({
  appTitle,
  tagline,
  showTagline = true,
  className = '',
  inverted = false,
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={inverted ? logoInverted : logoDefault}
        alt=""
        aria-hidden="true"
        className="size-10 shrink-0 object-contain"
      />
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-tight text-slate-950">
          {appTitle}
        </span>
        {showTagline && tagline && (
          <span className="block text-xs text-slate-500">{tagline}</span>
        )}
      </span>
    </div>
  );
}
