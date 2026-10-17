import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
  const faqs = [
    {
      q: "What is TaskFlow?",
      a: "TaskFlow is an open-source, enterprise-grade project and sprint management platform. It features deterministic workflow states, strict multi-tenancy, and contract-driven API synchronization between Next.js and Python FastAPI.",
    },
    {
      q: "Is TaskFlow really 100% open source?",
      a: "Yes. TaskFlow is licensed under the permissive MIT license. There are no artificial paywalls on core functionality, no hidden telemetries, and no closed-source dependencies.",
    },
    {
      q: "Which technologies power TaskFlow?",
      a: "The frontend is built with Next.js 14 App Router, TypeScript, Tailwind CSS, and shadcn/ui. The backend is built with Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), and PostgreSQL via asyncpg.",
    },
    {
      q: "Can I run TaskFlow entirely on my own hardware?",
      a: "Yes. TaskFlow is fully self-hostable using Docker or local Python and Node environments. You retain full custody and ownership of your data with your own PostgreSQL database.",
    },
    {
      q: "Does TaskFlow support both Scrum and Kanban?",
      a: "Yes. TaskFlow provides configurable Kanban board columns (To Do, In Progress, Done) alongside timeboxed Scrum sprints with committed scope snapshots and backlog item ranking.",
    },
    {
      q: "How can I contribute to the codebase?",
      a: "You can fork the public GitHub repository at github.com/Reza-Msv/taskflow-front-end, review the architecture rules, and submit a pull request following our conventional commit standards.",
    },
  ];

  return (
    <section id="faq" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
            Frequently Asked Questions
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to know about TaskFlow.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Clear, honest answers about architecture, self-hosting, and
            licensing.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-sm font-semibold text-foreground sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
