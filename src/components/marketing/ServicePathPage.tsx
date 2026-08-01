import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ServiceScopeCard {
  title: string;
  description: string;
  prompts: readonly string[];
}

interface ServicePathPageProps {
  badge: string;
  title: string;
  introduction: string;
  scopeCards: readonly ServiceScopeCard[];
  intakeQuestions: readonly string[];
  note: string;
  estimateLabel: string;
}

export function ServicePathPage({
  badge,
  title,
  introduction,
  scopeCards,
  intakeQuestions,
  note,
  estimateLabel,
}: ServicePathPageProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="flex max-w-3xl flex-col gap-5">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to overview
          </Link>
          <Badge variant="brand" className="w-fit">
            {badge}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            {introduction}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/estimate" className={buttonVariants({ size: "lg" })}>
              {estimateLabel}
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Link>
            <a
              href="tel:+16514104196"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Call (651) 410-4196
            </a>
          </div>
        </header>

        <section aria-labelledby="scope-heading" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="scope-heading" className="text-3xl font-bold tracking-tight">
              What to describe in the request
            </h2>
            <p className="max-w-3xl text-muted-foreground">
              These are intake categories, not a promise that every method or material applies to every property.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {scopeCards.map((card) => (
              <Card key={card.title} className="h-full">
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                    {card.prompts.map((prompt) => (
                      <li key={prompt} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                        />
                        <span>{prompt}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-2xl border bg-card p-6 shadow-sm lg:grid-cols-[0.7fr_1.3fr] lg:p-8">
          <div className="flex flex-col gap-3">
            <ClipboardList aria-hidden="true" className="size-8 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">
              Questions that improve the first review
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">{note}</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {intakeQuestions.map((question, index) => (
              <li
                key={question}
                className="flex gap-3 rounded-xl border bg-background p-4 text-sm leading-6"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
