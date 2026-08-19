# Convex Components Decision Matrix

## Decision summary

Component adoption is not a substitute for authentication, authorization, data modeling, or product governance. The platform should first establish the WorkOS/Convex identity bridge and the authorization kernel. Component calls must be wrapped by authorized application functions because component tables and functions are isolated from application tables by design.[1]

| Component | Problem solved | State owned | App interface and authorization boundary | Retry/checkpoint/concurrency | Cost and maintenance | Decision |
|---|---|---|---|---|---|---|
| `@convex-dev/workflow` | Long-lived, multi-step, durable processes with delays, retries, event waits, cancellation, restart, and reactive status | Component workflow journal, step history, status | Application mutation authorizes start; internal authorized functions run steps; status query must authorize business-record access | Durable replay/checkpoints; configurable action retries; parallel steps use Workpool controls | Adds durable journal and deterministic-code migration obligations; clean fit for explicit business processes | **ADOPT, deferred until RBAC baseline** |
| `@convex-dev/workpool` | Bounded asynchronous actions/mutations with priority pools, retry/backoff, cancellation, and status | Component work queue and status records | Application authorizes enqueue and exposes only authorized status; worker action verifies record/workflow context | Configurable retries, jitter, backoff, and max parallelism; no generic business checkpoint semantics | Operational overhead and queue monitoring; avoid using for synchronous CRUD or tiny direct calls | **ADOPT selectively, deferred until idempotent work exists** |
| `@convex-dev/agent` | Persistent agent threads/messages, streaming, tools, context, and record-centered agent interaction | Agent threads, messages, embeddings/context, usage metadata | Application must authorize every thread, source, tool, and record relation before calling component APIs | Durable conversation history; model/tool retries remain application policy; can integrate with workflows | Adds model/provider cost, data governance, prompt/version maintenance, and evidence-access risks | **DEFER until evidence and record authorization are verified** |

## Workflow adoption design

The first candidate is a public estimate workflow. The public mutation validates a constrained intake, writes an idempotent lead, and starts a durable process. The process can send confirmation, create internal routing tasks, apply scoring, and schedule follow-up. It cannot make external financial/legal commitments. Every external call uses an idempotency key and a retry policy appropriate to its effect.

The second candidate is a municipal opportunity workflow. It performs deduplication, classification, document capture, requirements extraction, contractor research, fit scoring, and creates an approval-ready action. It stops at `APPROVAL_REQUIRED` for pricing, certification, outreach, or submission. Workflow version changes must be planned because durable replay requires stable deterministic step structure.[2]

| Workflow | Entry boundary | Steps | Human approval boundary | Acceptance test |
|---|---|---|---|---|
| Estimate follow-up | Public intake command with abuse controls | Confirm, route, score, schedule follow-up, optional enrichment | Any quoted pricing commitment or outbound message requiring approval | Duplicate intake does not repeat side effects; delayed follow-up resumes after restart. |
| Municipal research | Authorized operations command or approved source ingestion | Deduplicate, capture docs, extract requirements, research contractor, fit score | Bid/no-bid, pricing, certification, bid submission, contractual representation, outreach | Workflow stores evidence and drafts; it never sends/submits without an approved event. |
| Portfolio approval | Authorized completed-job event | Verify facts, prepare portfolio draft, request review | Publication | No public record exists until approved publisher action. |

## Workpool adoption design

Workpool is appropriate for bounded, idempotent enrichment tasks such as document OCR, metadata extraction, controlled public-source retrieval, or non-critical research. Different pool names isolate priority classes: `transactional-notifications`, `document-processing`, and `low-priority-research`. The first two should have small fixed parallelism; the latter must not starve user-facing work. The application records a business correlation ID and authorization context before enqueueing. A worker never treats the queue item itself as authority to access arbitrary records.[3]

## Agent adoption guardrails

An agent can explain record-specific information only from authorized sources. Ingestion records observations without declaring them true; evidence connects observations to sources; agent reasoning produces suggestions or facts with confidence and provenance; business workflows enact only approved actions. Agent tools receive least-privilege, record-scoped arguments generated server-side. Thread sharing is explicit, and a thread cannot be addressed by arbitrary user-provided IDs without relation checks.

The component is therefore deferred until the platform can answer: which organization owns this record, which users may see the source document, how will evidence and prompts be retained, which tool calls are allowed, how will tool effects be audited, and how are model costs bounded? No paid AI gateway or new development key is introduced merely to activate the component.

## Verification gates

Before adopting any component, the PR must include package lock changes, `convex.config.ts` changes, code generation, typecheck, component integration tests, authorization tests for its application wrapper, monitoring/cleanup policy, and rollback instructions. Workflow and workpool status data is retained or cleaned up according to a documented retention policy.

## References

[1]: https://www.convex.dev/components "Convex components and isolation"
[2]: https://www.convex.dev/components/workflow "Convex Workflow"
[3]: https://github.com/get-convex/workpool "Convex Workpool"
[4]: https://github.com/get-convex/agent "Convex Agent"
