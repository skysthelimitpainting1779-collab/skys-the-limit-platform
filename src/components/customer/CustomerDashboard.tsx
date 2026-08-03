"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MotionReveal } from "@/design/motion/Reveal";

export interface CustomerDashboardProps {
  defaultLeadId?: string;
  defaultOrgId?: string;
}

/**
 * Fail-closed placeholder until a customer is bound to records by an
 * immutable server-authorized account-linking flow. Raw lead IDs are never
 * accepted as proof of ownership.
 */
export function CustomerDashboard(props: CustomerDashboardProps = {}) {
  void props;
  return (
    <MotionReveal direction="up">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Secure account linking required</CardTitle>
            <Badge variant="secondary">Protected</Badge>
          </div>
          <CardDescription>
            Project records appear only after your signed-in WorkOS identity is
            linked to the customer account by an authorized invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            For help linking an existing project, contact the office. Email
            addresses and record IDs are not accepted as ownership credentials.
          </p>
        </CardContent>
      </Card>
    </MotionReveal>
  );
}
