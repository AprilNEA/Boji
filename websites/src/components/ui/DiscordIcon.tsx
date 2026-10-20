type DiscordIconProps = {
  className?: string;
};

/** Discord 标志，颜色取 currentColor。两只眼睛是镂空的，所以在任何背景上都能用。 */
export function DiscordIcon({ className = "h-[13px] w-[13px] shrink-0" }: DiscordIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M19.5 5.3A17 17 0 0 0 15.3 4l-.5 1a15.7 15.7 0 0 0-5.6 0l-.5-1a17 17 0 0 0-4.2 1.3C1.8 9.3 1.1 13.2 1.4 17a17 17 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 11.2 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7ZM7.1 13.2a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0ZM13.5 13.2a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0Z"
      />
    </svg>
  );
}
