import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldCheck } from "lucide-react";

export default function CustomerPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <Badge className="mb-2 bg-blue-600 text-white">Authenticated Customer Hub</Badge>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Your project workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Project status, written scopes, and documents appear only after the
          authenticated account is linked to a customer record.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            Customer-scoped access
          </CardTitle>
          <CardDescription>
            The server derives customer identity from the signed-in session.
            Selecting another customer by email or identifier is not supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          No authorized project data is available for this account yet.
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-amber-500" />
            Documents
          </CardTitle>
          <CardDescription>
            Only documents belonging to the authenticated customer are returned.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No customer documents are available.
        </CardContent>
      </Card>
    </div>
  );
}
