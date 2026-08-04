import React from "react";
import Link from "next/link";
import { ShieldCheck, MapPin, CheckCircle2, Paintbrush } from "lucide-react";

export function NavigationFooter() {
  return (
    <footer className="border-t border-border/80 bg-card text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-background p-1 border border-border">
              <span className="flex size-8 items-center justify-center" aria-hidden="true">
                <Paintbrush className="size-5 text-primary" />
              </span>
            </div>
            <span className="text-base font-extrabold tracking-tight">Sky&apos;s the Limit</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Prep-first residential, commercial, and public-sector painting contractors serving Minneapolis, St. Paul, and the Twin Cities Metro.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary" />
            <span>Twin Cities Metro, MN</span>
          </div>
        </div>

        {/* Service Paths */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Services</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/residential" className="hover:text-primary transition-colors">Residential Painting</Link></li>
            <li><Link href="/commercial" className="hover:text-primary transition-colors">Commercial &amp; Facilities</Link></li>
            <li><Link href="/public-sector" className="hover:text-primary transition-colors">Public Sector Procurement</Link></li>
            <li><Link href="/estimate" className="hover:text-primary transition-colors">Project Cost Calculator</Link></li>
          </ul>
        </div>

        {/* Quality Guarantees */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Our Standards</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" /> Surface prep verification</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" /> Fixed-price written bids</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-primary" /> Joint walkthrough handoff</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Idempotent intake tracking</li>
          </ul>
        </div>

        {/* Portal Access */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Portals</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/customer" prefetch={false} className="hover:text-primary transition-colors">Customer Portal</Link></li>
            <li><Link href="/crew" prefetch={false} className="hover:text-primary transition-colors">Crew Dashboard</Link></li>
            <li><Link href="/operations" prefetch={false} className="hover:text-primary transition-colors">Operations Command</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <p>© {new Date().getFullYear()} Sky&apos;s the Limit Painting LLC. All rights reserved.</p>
        <p className="font-mono text-[11px]">Twin Cities Owner-Led Painting Platform</p>
      </div>
    </footer>
  );
}
