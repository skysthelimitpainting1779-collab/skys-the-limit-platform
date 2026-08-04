"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import {
  ArrowDownToLine,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ListChecks,
  MapPin,
  MessageSquareText,
  Upload,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { usePortalWorkspace } from "@/components/portal/PortalShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionReveal } from "@/design/motion/Reveal";

type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

type JobRow = {
  _id: Id<"jobs">;
  title?: string;
  address?: string;
  schedule: number | string | Record<string, unknown>;
  status: JobStatus;
  crewIds: Array<Id<"users">>;
};

type TaskRow = {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  assigneeId?: Id<"users">;
  completed: boolean;
  completedAt?: number;
};

type ProjectUpdateRow = {
  _id: Id<"projectUpdates">;
  actorId: Id<"users">;
  message: string;
  customerVisible: boolean;
  createdAt: number;
};

type ChecklistRow = {
  _id: Id<"checklists">;
  title: string;
  status: "pending" | "in_progress" | "completed";
  items: Array<{
    _id: Id<"checklistItems">;
    id: string;
    text: string;
    completed: boolean;
  }>;
};

type DocumentRow = {
  _id: Id<"documents">;
  name: string;
  mimeType: string;
  size: number;
  accessLevel: "public" | "internal" | "restricted";
  createdAt: number;
};

type ActionNotice = { kind: "success" | "error"; message: string } | null;

const CREW_ROLES = new Set(["crew_lead", "crew_member", "crew"]);

function formatSchedule(schedule: JobRow["schedule"]) {
  if (typeof schedule === "number") return new Date(schedule).toLocaleString();
  if (typeof schedule === "string") return schedule;
  for (const key of ["label", "date", "startDate", "start"]) {
    const value = schedule[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return new Date(value).toLocaleString();
  }
  return "Schedule details available";
}

function formatBytes(bytes: number) {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1_024)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function Section({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 rounded-xl border border-border bg-card">
      <header className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function CrewDashboard() {
  const workspace = usePortalWorkspace();
  const orgId = workspace?.selectedOrgId ?? null;
  const capabilities = useQuery(
    api.users.getMyCapabilities,
    orgId ? { orgId } : "skip",
  );
  const jobsResult = useQuery(
    api.jobs.list,
    orgId && capabilities?.canReadJobs ? { orgId } : "skip",
  );
  const jobs = jobsResult as Array<JobRow> | undefined;
  const [selectedJobId, setSelectedJobId] = useState<Id<"jobs"> | null>(null);
  const selectedJob = useMemo(
    () => jobs?.find((job) => job._id === selectedJobId) ?? jobs?.[0] ?? null,
    [jobs, selectedJobId],
  );

  const tasksResult = useQuery(
    api.jobs.listTasks,
    selectedJob ? { jobId: selectedJob._id } : "skip",
  );
  const updatesResult = useQuery(
    api.jobs.listProjectUpdates,
    selectedJob ? { jobId: selectedJob._id } : "skip",
  );
  const checklistsResult = useQuery(
    api.checklists.listByJob,
    selectedJob ? { jobId: selectedJob._id } : "skip",
  );
  const tasks = tasksResult as Array<TaskRow> | undefined;
  const updates = updatesResult as Array<ProjectUpdateRow> | undefined;
  const checklists = checklistsResult as Array<ChecklistRow> | undefined;

  const internalDocuments = usePaginatedQuery(
    api.files.listDocuments,
    orgId && selectedJob
      ? {
          orgId,
          accessLevel: "internal" as const,
          jobId: selectedJob._id,
        }
      : "skip",
    { initialNumItems: 12 },
  );
  const restrictedDocuments = usePaginatedQuery(
    api.files.listDocuments,
    orgId && selectedJob
      ? {
          orgId,
          accessLevel: "restricted" as const,
          jobId: selectedJob._id,
        }
      : "skip",
    { initialNumItems: 12 },
  );

  const updateJobStatus = useMutation(api.jobs.updateStatus);
  const createTask = useMutation(api.jobs.createTask);
  const updateTask = useMutation(api.jobs.updateTask);
  const addProjectUpdate = useMutation(api.jobs.addProjectUpdate);
  const createChecklist = useMutation(api.checklists.create);
  const toggleChecklistItem = useMutation(api.checklists.toggleItem);
  const generateUploadUrl = useAction(api.fileActions.generateUploadUrl);
  const finalizeUpload = useAction(api.fileActions.finalizeUpload);
  const getDownloadUrl = useAction(api.fileActions.getDownloadUrl);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [customerVisible, setCustomerVisible] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistItems, setChecklistItems] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<ActionNotice>(null);

  const role = capabilities?.role;
  const isCrew = role ? CREW_ROLES.has(role) : false;
  const canManageWork = capabilities?.canManageJobs === true;
  const canUpdateFieldState = capabilities?.canUpdateJobs === true;
  const canAddProjectUpdate = canUpdateFieldState;
  const uploadAccessLevel = isCrew ? ("restricted" as const) : ("internal" as const);

  const runAction = async (key: string, task: () => Promise<void>) => {
    setBusyKey(key);
    setNotice(null);
    try {
      await task();
    } catch (error) {
      setNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "The update could not be saved.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const submitTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedJob || !taskTitle.trim()) return;
    await runAction("create-task", async () => {
      await createTask({
        jobId: selectedJob._id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
      });
      setTaskTitle("");
      setTaskDescription("");
      setNotice({ kind: "success", message: "Task added to this job." });
    });
  };

  const submitUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedJob || !updateMessage.trim()) return;
    await runAction("add-update", async () => {
      await addProjectUpdate({
        jobId: selectedJob._id,
        message: updateMessage.trim(),
        customerVisible: canManageWork ? customerVisible : false,
      });
      setUpdateMessage("");
      setCustomerVisible(false);
      setNotice({ kind: "success", message: "Job update recorded." });
    });
  };

  const submitChecklist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedJob || !checklistTitle.trim()) return;
    const items = checklistItems
      .split("\n")
      .map((text) => text.trim())
      .filter(Boolean)
      .slice(0, 100)
      .map((text) => ({ id: globalThis.crypto.randomUUID(), text }));
    if (items.length === 0) {
      setNotice({ kind: "error", message: "Add at least one checklist item." });
      return;
    }
    await runAction("create-checklist", async () => {
      await createChecklist({
        jobId: selectedJob._id,
        title: checklistTitle.trim(),
        items,
      });
      setChecklistTitle("");
      setChecklistItems("");
      setNotice({ kind: "success", message: "Checklist created." });
    });
  };

  const uploadDocument = async (event: FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || !selectedJob || !orgId) return;
    await runAction("upload-document", async () => {
      const upload = await generateUploadUrl({
        name: file.name,
        mimeType: file.type,
        fileSize: file.size,
        orgId,
        accessLevel: uploadAccessLevel,
        jobId: selectedJob._id,
      });
      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "content-type": file.type,
          "x-content-type": file.type,
        },
      });
      if (!response.ok) throw new Error("The file could not be transferred to storage.");
      const payload = (await response.json()) as { url?: unknown };
      if (typeof payload.url !== "string") {
        throw new Error("Storage did not return a final blob URL.");
      }
      await finalizeUpload({
        blobUrl: payload.url,
        name: file.name,
        orgId,
        accessLevel: uploadAccessLevel,
        jobId: selectedJob._id,
      });
      input.value = "";
      setNotice({ kind: "success", message: "Document attached to this job." });
    });
  };

  const downloadDocument = async (document: DocumentRow) => {
    await runAction(`download-${document._id}`, async () => {
      const download = await getDownloadUrl({ documentId: document._id });
      const anchor = window.document.createElement("a");
      anchor.href = download.url;
      anchor.download = download.name;
      anchor.rel = "noopener noreferrer";
      anchor.click();
    });
  };

  if (workspace?.context === undefined) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground" aria-busy="true" aria-live="polite">
        Loading your secure workspace…
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Select an active organization to load assigned field work.
      </div>
    );
  }

  if (capabilities === undefined) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading your field-work permissions…
      </div>
    );
  }

  if (!capabilities.canReadJobs) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-bold">Field work is not available for this role</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask an organization owner to assign an active crew or project-management role.
        </p>
      </div>
    );
  }

  if (jobs === undefined) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading assigned jobs…
      </div>
    );
  }

  if (jobs.length === 0 || !selectedJob) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-bold">No jobs are assigned</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This workspace will update when a job is assigned to your account.
        </p>
      </div>
    );
  }

  const allDocuments = [
    ...(internalDocuments.results as Array<DocumentRow>),
    ...(restrictedDocuments.results as Array<DocumentRow>),
  ].sort((left, right) => right.createdAt - left.createdAt);

  return (
    <div className="mt-8 space-y-5" data-testid="crew-dashboard">
      <MotionReveal direction="up">
        <section className="rounded-xl border border-border bg-foreground p-4 text-background sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label htmlFor="active-job" className="text-xs font-bold uppercase tracking-[0.14em] text-background/65">
                Active job
              </label>
              <select
                id="active-job"
                value={selectedJob._id}
                onChange={(event) => setSelectedJobId(event.target.value as Id<"jobs">)}
                className="mt-2 min-h-12 w-full rounded-lg border border-background/20 bg-background px-3 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-w-80"
              >
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title || job.address || `Job ${job._id.slice(-6)}`}
                  </option>
                ))}
              </select>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-background/75">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {formatSchedule(selectedJob.schedule)}
                </span>
                {selectedJob.address ? (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-4" aria-hidden="true" />
                    {selectedJob.address}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {selectedJob.status.replaceAll("_", " ")}
              </Badge>
              {canUpdateFieldState && selectedJob.status !== "in_progress" ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busyKey === "job-status"}
                  onClick={() =>
                    void runAction("job-status", async () => {
                      await updateJobStatus({ jobId: selectedJob._id, status: "in_progress" });
                      setNotice({ kind: "success", message: "Job marked in progress." });
                    })
                  }
                >
                  Start work
                </Button>
              ) : null}
              {canUpdateFieldState && selectedJob.status !== "completed" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-background/35 bg-transparent text-background hover:bg-background/10 hover:text-background"
                  disabled={busyKey === "job-status"}
                  onClick={() =>
                    void runAction("job-status", async () => {
                      await updateJobStatus({ jobId: selectedJob._id, status: "completed" });
                      setNotice({ kind: "success", message: "Job marked complete." });
                    })
                  }
                >
                  Complete job
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </MotionReveal>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Job workspace sections">
        {[
          ["tasks", "Tasks"],
          ["checklists", "Checklists"],
          ["updates", "Updates"],
          ["documents", "Documents"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={`#${href}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border bg-card px-4 text-sm font-bold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {label}
          </a>
        ))}
      </nav>

      {notice ? (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.kind === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-border bg-muted text-foreground"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <Section
        id="tasks"
        icon={<ListChecks className="size-5" aria-hidden="true" />}
        title="Job tasks"
        description="Only tasks attached to this authorized job are shown."
      >
        {tasks === undefined ? (
          <EmptyState>Loading tasks…</EmptyState>
        ) : tasks.length === 0 ? (
          <EmptyState>No tasks have been added to this job.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task._id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  disabled={!canUpdateFieldState || busyKey === `task-${task._id}`}
                  onClick={() =>
                    void runAction(`task-${task._id}`, async () => {
                      await updateTask({ taskId: task._id, completed: !task.completed });
                      setNotice({ kind: "success", message: "Task status updated." });
                    })
                  }
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    task.completed ? "border-foreground bg-foreground text-background" : "border-border bg-background"
                  }`}
                  aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
                >
                  {task.completed ? <Check className="size-4" aria-hidden="true" /> : null}
                </button>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${task.completed ? "text-muted-foreground line-through" : ""}`}>
                    {task.title}
                  </p>
                  {task.description ? <p className="mt-1 text-sm text-muted-foreground">{task.description}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        {canManageWork ? (
          <form onSubmit={submitTask} className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
            <Input
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="Task title"
              aria-label="Task title"
              required
              maxLength={200}
            />
            <Input
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
              placeholder="Optional instructions"
              aria-label="Task instructions"
              maxLength={1_000}
            />
            <Button type="submit" disabled={busyKey === "create-task"} className="sm:col-span-2 sm:w-fit">
              Add task
            </Button>
          </form>
        ) : null}
      </Section>

      <Section
        id="checklists"
        icon={<ClipboardCheck className="size-5" aria-hidden="true" />}
        title="Field checklists"
        description="Completion is attributed by the server to the signed-in operator."
      >
        {checklists === undefined ? (
          <EmptyState>Loading checklists…</EmptyState>
        ) : checklists.length === 0 ? (
          <EmptyState>No checklists have been created for this job.</EmptyState>
        ) : (
          <div className="space-y-4">
            {checklists.map((checklist) => (
              <article key={checklist._id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">{checklist.title}</h3>
                  <Badge variant="outline" className="capitalize">
                    {checklist.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <ul className="mt-3 space-y-2">
                  {checklist.items.map((item) => (
                    <li key={item._id}>
                      <button
                        type="button"
                        disabled={!canUpdateFieldState || busyKey === `check-${item._id}`}
                        onClick={() =>
                          void runAction(`check-${item._id}`, async () => {
                            await toggleChecklistItem({ checklistId: checklist._id, itemId: item.id });
                            setNotice({ kind: "success", message: "Checklist item updated." });
                          })
                        }
                        className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 text-left text-sm transition-colors enabled:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className={`flex size-6 shrink-0 items-center justify-center rounded border ${item.completed ? "border-foreground bg-foreground text-background" : "border-border"}`}>
                          {item.completed ? <Check className="size-4" aria-hidden="true" /> : null}
                        </span>
                        <span className={item.completed ? "text-muted-foreground line-through" : ""}>{item.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}

        {canManageWork ? (
          <form onSubmit={submitChecklist} className="mt-5 space-y-3 border-t border-border pt-5">
            <Input
              value={checklistTitle}
              onChange={(event) => setChecklistTitle(event.target.value)}
              placeholder="Checklist title"
              aria-label="Checklist title"
              required
              maxLength={200}
            />
            <textarea
              value={checklistItems}
              onChange={(event) => setChecklistItems(event.target.value)}
              placeholder={"One checklist item per line"}
              aria-label="Checklist items"
              rows={4}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" disabled={busyKey === "create-checklist"}>
              Create checklist
            </Button>
          </form>
        ) : null}
      </Section>

      <Section
        id="updates"
        icon={<MessageSquareText className="size-5" aria-hidden="true" />}
        title="Project updates"
        description="Record what happened on this job and explicitly choose whether the customer may see it."
      >
        {updates === undefined ? (
          <EmptyState>Loading updates…</EmptyState>
        ) : updates.length === 0 ? (
          <EmptyState>No project updates have been recorded.</EmptyState>
        ) : (
          <ol className="space-y-3">
            {updates.map((update) => (
              <li key={update._id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <time className="text-xs font-semibold text-muted-foreground" dateTime={new Date(update.createdAt).toISOString()}>
                    {new Date(update.createdAt).toLocaleString()}
                  </time>
                  <Badge variant="outline">
                    {update.customerVisible ? "Customer visible" : "Internal"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6">{update.message}</p>
              </li>
            ))}
          </ol>
        )}

        {canAddProjectUpdate ? (
          <form onSubmit={submitUpdate} className="mt-5 space-y-3 border-t border-border pt-5">
          <label className="block text-sm font-bold" htmlFor="project-update">
            Add an update
          </label>
          <textarea
            id="project-update"
            value={updateMessage}
            onChange={(event) => setUpdateMessage(event.target.value)}
            rows={4}
            required
            maxLength={2_000}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {canManageWork ? (
            <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={customerVisible}
                onChange={(event) => setCustomerVisible(event.target.checked)}
                className="size-5 rounded border-input"
              />
              Share this update with the bound customer account
            </label>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              Crew updates are internal until an authorized project manager
              explicitly shares them with the customer.
            </p>
          )}
          <Button type="submit" disabled={busyKey === "add-update"}>
            Record update
          </Button>
          </form>
        ) : null}
      </Section>

      <Section
        id="documents"
        icon={<FileText className="size-5" aria-hidden="true" />}
        title="Job documents"
        description="Files use authorized Vercel Blob transfer URLs; Convex stores only protected metadata and scope."
      >
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
          <Upload className="size-5" aria-hidden="true" />
          <span className="mt-2 text-sm font-bold">
            {busyKey === "upload-document" ? "Uploading…" : "Attach a jobsite file"}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            Crew uploads remain restricted to their uploader and authorized managers.
          </span>
          <input
            type="file"
            className="sr-only"
            disabled={busyKey === "upload-document"}
            onInput={(event) => void uploadDocument(event)}
          />
        </label>

        {allDocuments.length === 0 ? (
          <div className="mt-4">
            <EmptyState>No authorized documents are attached to this job.</EmptyState>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {allDocuments.map((document) => (
              <li key={document._id} className="flex items-center gap-3 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{document.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(document.size)} · {document.accessLevel}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyKey === `download-${document._id}`}
                  onClick={() => void downloadDocument(document)}
                >
                  <ArrowDownToLine className="size-4" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Download</span>
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {internalDocuments.status === "CanLoadMore" ? (
            <Button type="button" variant="outline" onClick={() => internalDocuments.loadMore(12)}>
              More shared documents
            </Button>
          ) : null}
          {restrictedDocuments.status === "CanLoadMore" ? (
            <Button type="button" variant="outline" onClick={() => restrictedDocuments.loadMore(12)}>
              More restricted documents
            </Button>
          ) : null}
        </div>
      </Section>

      <p className="flex items-center gap-2 pb-4 text-xs text-muted-foreground">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        All changes are authorized against the selected job and organization on the server.
      </p>
    </div>
  );
}
