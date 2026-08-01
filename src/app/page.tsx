import type { Metadata } from "next";
import Link from "next/link";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sky's the Limit Painting LLC | Premium Contractor Platform",
  description: "Established local painting contractor for Residential, Commercial, and Public-Sector projects.",
};

const navigationRoutes = [
  { href: "/residential", title: "Residential", desc: "Interior, exterior, & cabinet refinishing" },
  { href: "/commercial", title: "Commercial", desc: "Retail, offices, HOAs, & epoxy coatings" },
  { href: "/public-sector", title: "Public Sector", desc: "Prevailing wage, schools, & municipal" },
  { href: "/estimate", title: "Request Estimate", desc: "Transparent quotes with prep specs" },
  { href: "/customer", title: "Customer Portal", desc: "Color choices, schedules, & invoices" },
  { href: "/crew", title: "Crew Workspace", desc: "Daily logs, prep audits, & safety" },
  { href: "/operations", title: "Operations", desc: "Control center & resource management" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <MotionReveal direction="down" className="text-center space-y-4">
          <Badge variant="brand" className="px-3 py-1 text-sm">
            Prep-First Quality & Clean Execution
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Sky&apos;s the Limit Painting LLC
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Premier owner-led painting contractor serving Residential, Commercial, and Public-Sector clients with unmatched craft and structural durability.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <MotionPressable>
              <Link href="/estimate">
                <Button size="lg" className="bg-[#E65100] hover:bg-[#CC4400] text-white">
                  Get Free Estimate
                </Button>
              </Link>
            </MotionPressable>
            <MotionPressable>
              <Link href="/residential">
                <Button size="lg" variant="outline">
                  Explore Services
                </Button>
              </Link>
            </MotionPressable>
          </div>
        </MotionReveal>

        <MotionReveal direction="up" delay={0.1}>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6 text-center sm:text-left">
              Platform Navigation
            </h2>
            <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {navigationRoutes.map((route) => (
                <MotionStaggerItem key={route.href}>
                  <Link href={route.href} className="block group h-full">
                    <Card className="h-full transition-shadow duration-200 group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-700">
                      <CardHeader>
                        <CardTitle className="group-hover:text-[#E65100] transition-colors">
                          {route.title}
                        </CardTitle>
                        <CardDescription>{route.desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-xs font-semibold text-[#E65100]">
                        View Route &rarr;
                      </CardContent>
                    </Card>
                  </Link>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          </div>
        </MotionReveal>
      </div>
    </div>
  );
}
