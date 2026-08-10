import workOSAuthKit from "@convex-dev/workos-authkit/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    LEAD_INTAKE_SECRET: v.string(),
    WORKOS_ORGANIZATION_ID: v.string(),
  },
});
app.use(workOSAuthKit);

export default app;
