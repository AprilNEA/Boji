type LogoProps = {
  className?: string;
  title?: string;
};

/**
 * The standing figure from the Boji app icon: ios/Boji/Resources/AppIcon.icon/Assets/mark.svg.
 * The coordinates use the icon's 1024 × 1024 canvas. Keep them equal to the source file.
 */
export const MARK_HEAD = { cx: 503, cy: 265, r: 62 } as const;
export const MARK_BODY =
  "M432 367C413 365 400 372 385 384L300 451C274 472 276 501 297 521L398 609C413 622 425 616 434 607C438 603 446.25 605.5 444 613L435 643L371 751C356 775 363 802 386 815C409 828 434 819 447 797L506.45 694.95Q514 682 520.52 695.51L568 794C581 818 606 826 629 813C652 800 660 776 646 752L584 642L576 610C574 602 581 599 587 604C599 614 620 609 635 593L711 511C731 490 728 461 706 444L623 382C607 370 593 367 577 370C552 374 533 379 510 377C484 375 459 365 432 367ZM408.44 436.05Q424 427 427.61 444.63L446.39 536.37Q450 554 435.17 543.8L352.83 487.2Q338 477 353.56 467.95ZM563.91 446.89Q562 430 577.24 437.54L645.76 471.46Q661 479 648.25 490.25L588.75 542.75Q576 554 574.09 537.11Z";

/** Boji 的站立人形标志，裁到人形的外框，颜色取 currentColor。 */
export function Logo({ className = "h-[18px] w-auto", title = "薄肌俱乐部" }: LogoProps) {
  return (
    <svg viewBox="276 198 455 630" className={className} role="img" aria-label={title} fill="currentColor">
      <title>{title}</title>
      <circle {...MARK_HEAD} />
      <path fillRule="evenodd" d={MARK_BODY} />
    </svg>
  );
}
