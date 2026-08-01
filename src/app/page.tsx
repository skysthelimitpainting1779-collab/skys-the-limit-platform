import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Home, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sky's the Limit Painting LLC",
  description:
    "Prep-first painting estimates for Twin Cities homes, commercial properties, and public assets.",
};

const servicePaths = [
  {
    href: "/residential",
    title: "Residential",
    description: "Interior and exterior painting scopes for homeowners.",
    icon: Home,
  },
  {
    href: "/commercial",
    title: "Commercial",
    description: "Property-focused scopes for offices, facilities, and shared spaces.",
    icon: Building2,
  },
  {
    href: "/public-sector",
    title: "Public sector",
    description: "Capability and bid-readiness information for public buyers.",
    icon: Landmark,
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge variant="default" className="w-fit">
              Owner-led Twin Cities painting
            </Badge>
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl">
              Clear scope. Careful prep. Documented handoff.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Sky&apos;s the Limit Painting LLC helps residential, commercial, and public-sector buyers define the work before it starts and keep the next step clear.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/estimate" className={buttonVariants({ size: "lg" })}>
                Request an estimate
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/commercial" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Review service paths
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border bg-card p-7 shadow-sm">
            <div className="rounded-xl bg-white p-2">
              <Image
                src="/brand/logo-illustrated-badge.webp"
                alt="Sky's the Limit Painting LLC illustrated badge logo"
                width={320}
                height={282}
                className="mx-auto h-auto w-full max-w-80"
                priority
              />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-primary">What the intake captures</p>
            <ul className="mt-5 flex flex-col gap-4 text-sm text-muted-foreground">
              <li><span className="font-medium text-foreground">Property and buyer type</span><br />Residential, commercial, or public-sector context.</li>
              <li><span className="font-medium text-foreground">Project scope</span><br />Areas, condition, timing, and access details.</li>
              <li><span className="font-medium text-foreground">A traceable receipt</span><br />One saved request, protected from accidental duplicate submission.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Choose the closest project path</h2>
            <p className="text-muted-foreground">Each path leads back to the same structured estimate intake.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {servicePaths.map(({ href, title, description, icon: Icon }) => (
              <Link key={href} href={href} className="group focus-visible:outline-none">
                <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardHeader>
                    <Icon aria-hidden="true" className="size-6 text-primary" />
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2 text-sm font-semibold text-primary">
                    View path <ArrowRight aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

