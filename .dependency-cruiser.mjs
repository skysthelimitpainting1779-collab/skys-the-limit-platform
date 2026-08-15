/** @type {import('dependency-cruiser').IConfiguration} */
const configuration = {
  forbidden: [
    {
      name: "no-cross-domain-cycles",
      comment: "Canonical product and backend modules must not form dependency cycles.",
      severity: "error",
      from: { path: "^(src|convex)/" },
      to: { circular: true },
    },
    {
      name: "frontend-no-private-convex",
      comment: "Frontend code may use Convex's generated public API, not backend implementation modules.",
      severity: "error",
      from: { path: "^src/", pathNot: "(?:__tests__|tests?)(?:/|$)|\\.(?:test|spec)\\." },
      to: { path: "^convex/(?!_generated/)", dependencyTypes: ["local"] },
    },
    {
      name: "product-no-test-imports",
      comment: "Production modules must not import tests, fixtures, or test-only utilities.",
      severity: "error",
      from: { path: "^(src|convex)/", pathNot: "(?:__tests__|tests?)(?:/|$)|\\.(?:test|spec)\\." },
      to: { path: "(?:__tests__|tests?)(?:/|$)|\\.(?:test|spec)\\." },
    },
    {
      name: "no-legacy-stack-reintroduction",
      comment: "Canonical code must not reintroduce superseded Supabase, Payload, Directus, libSQL, or Express runtime dependencies.",
      severity: "error",
      from: { path: "^(src|convex)/" },
      to: { path: "^node_modules/(?:@supabase|supabase|payload|@payloadcms|directus|@directus|libsql|@libsql|express)(?:/|$)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"] },
  },
};

export default configuration;
