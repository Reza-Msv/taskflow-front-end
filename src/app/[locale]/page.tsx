import { AnnouncementBar } from "@/components/marketing/announcement-bar";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { TrustSection } from "@/components/marketing/trust-section";
import { ProductPreviewDemo } from "@/components/marketing/product-preview-demo";
import { FeaturesShowcase } from "@/components/marketing/features-showcase";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { InteractiveKanban } from "@/components/marketing/interactive-kanban";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { OpenSourceSection } from "@/components/marketing/open-source-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SmoothScrollProvider } from "@/components/marketing/smooth-scroll-provider";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <SmoothScrollProvider>
      <div className="relative flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-brand-orange/20 selection:text-foreground">
        {/* Section A: Announcement Bar */}
        <AnnouncementBar />

        {/* Section B: Navigation Bar */}
        <MarketingNav />

        <main className="flex-1">
          {/* Section C: Hero */}
          <HeroSection locale={locale} />

          {/* Section E: Trust & Stack Credibility */}
          <TrustSection />

          {/* Section D: Product Preview Interactive Demo */}
          <ProductPreviewDemo />

          {/* Section F: Features Showcase */}
          <FeaturesShowcase />

          {/* Section G: How It Works */}
          <HowItWorksSection />

          {/* Section H: Interactive Kanban Sandbox */}
          <InteractiveKanban />

          {/* Section J: Use Cases */}
          <UseCasesSection />

          {/* Section K: Open Source & Developer Section */}
          <OpenSourceSection />

          {/* Section L: FAQ Accordion */}
          <FaqSection />

          {/* Section M: Final CTA */}
          <FinalCtaSection locale={locale} />
        </main>

        {/* Section N: Footer */}
        <MarketingFooter locale={locale} />
      </div>
    </SmoothScrollProvider>
  );
}
