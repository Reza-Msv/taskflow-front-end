import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Layers,
  Kanban,
  Users,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { AnimatedGridPattern } from "@/components/ui/magic/animated-grid-pattern";
import { BentoGrid, BentoCard } from "@/components/ui/magic/bento-grid";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function HomePage() {
  const t = useTranslations("Common");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-8">
      {/* Magic UI Layer: Subtle Hero Background Grid */}
      <AnimatedGridPattern
        className="opacity-40 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)] dark:opacity-20"
        width={32}
        height={32}
      />

      {/* Top Header Bar for Theme Toggle */}
      <header className="absolute end-4 top-4 z-20">
        <ThemeToggle />
      </header>

      <div className="relative z-10 w-full max-w-5xl space-y-12 text-center">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-medium text-accent-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span>TaskFlow Enterprise Baseline</span>
          </div>

          <h1 className="hero-title tracking-tight text-foreground">
            {t("title")}
          </h1>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("description")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="default" className="gap-2">
              <Kanban className="h-4 w-4" />
              Explore Boards
            </Button>
            <Button variant="outline" size="default" className="gap-2">
              <Layers className="h-4 w-4" />
              Scrum Sprints
            </Button>
          </div>
        </div>

        {/* Magic UI Layer: Bento Grid for Feature Overview */}
        <section className="pt-6 text-start">
          <BentoGrid className="auto-rows-[12rem] md:auto-rows-[14rem]">
            <BentoCard
              name="Kanban & Scrum Sprints"
              description="Configurable columns, WIP limits, sprint snapshots, and velocity reporting."
              Icon={Kanban}
              cta="View boards"
            />
            <BentoCard
              name="Strict Multi-Tenancy"
              description="Backend-authoritative permissions and organization isolation built for enterprise governance."
              Icon={ShieldCheck}
              cta="Learn security"
            />
            <BentoCard
              name="OpenAPI Contract"
              description="Strongly typed API client automatically synchronized from FastAPI without hand-written mock types."
              Icon={Zap}
              cta="Inspect API"
            />
          </BentoGrid>
        </section>
      </div>
    </main>
  );
}
