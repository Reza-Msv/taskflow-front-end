import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Layers, Kanban, Users } from "lucide-react";

export default function HomePage() {
  const t = useTranslations("Common");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-3xl space-y-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <span>TaskFlow Enterprise Baseline</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {t("title")}
        </h1>

        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          {t("description")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button size="lg" className="gap-2">
            <Kanban className="h-4 w-4" />
            Explore Boards
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <Layers className="h-4 w-4" />
            Scrum Sprints
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-12 text-left sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <Kanban className="h-4 w-4 text-primary" />
              Kanban & Scrum
            </div>
            <p className="text-xs text-muted-foreground">
              Configurable columns, WIP limits, sprint snapshots, and velocity
              reporting.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-primary" />
              Strict Multi-Tenancy
            </div>
            <p className="text-xs text-muted-foreground">
              Backend-authoritative permissions and organization isolation.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              OpenAPI Contract
            </div>
            <p className="text-xs text-muted-foreground">
              Automated TypeScript types synchronized directly from FastAPI.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
