"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, X, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MotionPressable } from "@/design/motion/Pressable";

export function NavigationHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/residential", label: "Residential" },
    { href: "/commercial", label: "Commercial" },
    { href: "/public-sector", label: "Public Sector" },
    { href: "/estimate", label: "Estimate Intake" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none">
          <div className="rounded-lg bg-card p-1 shadow-sm border border-border/60 group-hover:border-primary/40 transition-colors">
            <Image
              src="/brand/logo-illustrated-badge.webp"
              alt="Sky's the Limit Painting LLC logo"
              width={36}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
              Sky&apos;s the Limit
            </span>
            <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Painting LLC
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-3">
          <Badge variant="outline" className="gap-1 border-primary/20 text-primary text-[11px] py-1 font-mono">
            <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
            Twin Cities MN
          </Badge>

          <MotionPressable>
            <Link
              href="/estimate"
              className={buttonVariants({ size: "sm", className: "gap-1.5 shadow-sm font-semibold" })}
            >
              Request Estimate
              <ArrowRight className="size-3.5" />
            </Link>
          </MotionPressable>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden rounded-lg p-2 text-foreground hover:bg-muted focus-visible:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-border">
            <Link
              href="/estimate"
              onClick={() => setMobileMenuOpen(false)}
              className={buttonVariants({ size: "default", className: "w-full gap-2" })}
            >
              Request Estimate
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
