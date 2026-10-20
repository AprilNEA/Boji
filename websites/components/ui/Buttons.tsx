import Link from "next/link";
import type { ReactNode } from "react";

type PillProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline";
  className?: string;
};

export function PillLink({ href, children, variant = "primary", className = "" }: PillProps) {
  return (
    <Link href={href} className={`btn-pill ${variant === "primary" ? "btn-primary" : "btn-outline"} ${className}`}>
      {children}
    </Link>
  );
}

type TextLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
};

export function TextLink({ href, children, className = "", dark = false }: TextLinkProps) {
  return (
    <Link href={href} className={`link-apple ${dark ? "on-dark" : ""} ${className}`}>
      <span>{children}</span>
      <span className="chev" aria-hidden>
        ›
      </span>
    </Link>
  );
}
