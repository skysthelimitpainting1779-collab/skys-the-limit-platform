import Link from "next/link";
import { ArrowLeft, Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PortalSetupStateProps {
  audience: string;
  title: string;
  description: string;
  activationRequirements: readonly string[];
}

const boundaries = [
  {
    title: "Identity boundary",
    description:
      "A non-production identity environment must be configured before this route accepts a sign-in session.",
    icon: LockKeyhole,
  },
  {
    title: "Isolated data",
    description:
      "Portal records must come from an isolated Convex environment, never from production or placeholder data.",
    icon: Database,
  },
  {
    title: "Authorization proof",
    description:
      "Role and resource-isolation tests must pass before any private record is rendered.",
    icon: ShieldCheck,
  },
] as const;

export function PortalSetupState({
  audience,
  title,
  description,
  activationRequirements,
}: PortalSetupStateProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex max-w-3xl flex-col gap-5">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to public site
          </Link>
          <Badge variant="outline" className="w-fit">
            {audience}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="text-lg leading-8 text-muted-foreground">{description}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/estimate" className={buttonVariants({ size: "lg" })}>
              Use public estimate intake
            </Link>
            <Link
              href="/"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Return home
            </Link>
          </div>
        </header>

        <section aria-labelledby="closed-heading" className="flex flex-col gap-6">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6">
            <div className="flex items-start gap-4">
              <LockKeyhole aria-hidden="true" className="mt-1 size-6 shrink-0 text-primary" />
              <div>
                <h2 id="closed-heading" className="text-xl font-semibold">
                  Access is intentionally closed
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This route does not display fabricated dashboards, sample customer records, or unsecured operational data while provider setup is incomplete.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {boundaries.map(({ title: boundaryTitle, description: boundaryDescription, icon: Icon }) => (
              <Card key={boundaryTitle}>
                <CardHeader>
                  <Icon aria-hidden="true" className="size-6 text-primary" />
                  <CardTitle>{boundaryTitle}</CardTitle>
                  <CardDescription>{boundaryDescription}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Activation checklist</CardTitle>
            <CardDescription>
              All items must be verified in Preview before this route can expose private functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
              {activationRequirements.map((requirement, index) => (
                <li key={requirement} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground">
                    {index + 1}
                  </span>
                  <span className="pt-1">{requirement}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
