import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, ShieldCheck, Users } from "lucide-react";

const emptyMetrics = [
  { label: "New leads", icon: Users },
  { label: "Pending estimates", icon: FileText },
  { label: "Active jobs", icon: Briefcase },
  { label: "Recent audit events", icon: ShieldCheck },
];

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <Badge className="mb-2 bg-amber-500 text-black">
          Authorized Operations Workspace
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Operations Command
        </h1>
        <p className="text-sm text-muted-foreground">
          Live operational records are returned only for authenticated users
          with an allowed operations role and active organization membership.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {emptyMetrics.map(({ label, icon: Icon }) => (
          <Card key={label} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">—</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Awaiting authorized Convex data
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Server-enforced authorization
          </CardTitle>
          <CardDescription>
            Leads, jobs, CMS records, and audit events cannot be selected through
            caller-supplied identity fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          No authorized operational records are loaded in this preview.
        </CardContent>
      </Card>
    </div>
  );
}
