import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardHat, ShieldCheck } from "lucide-react";

export default function CrewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="border-b border-border pb-4">
        <Badge className="mb-2 bg-emerald-600 text-white">
          Authenticated Field Crew Portal
        </Badge>
        <h1 className="text-2xl font-bold text-foreground">
          Assigned work
        </h1>
        <p className="text-sm text-muted-foreground">
          Job locations, access notes, checklists, and updates appear only for
          jobs assigned to the authenticated crew account.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardHat className="h-5 w-5 text-amber-500" />
            Today&apos;s assignments
          </CardTitle>
          <CardDescription>
            Assignment identity is derived by the server and cannot be selected
            by a caller-supplied user ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          No authorized assignments are available for this account.
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Protected access notes
          </CardTitle>
          <CardDescription>
            Property access instructions are loaded only from authorized job
            records and are never embedded in public source code.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
