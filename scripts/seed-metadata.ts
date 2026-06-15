/**
 * One-off: backfill curated description + tags + category for the imported
 * NPrep prototypes. Matches on the template `name`. Safe to re-run.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node_modules/.bin/tsx scripts/seed-metadata.ts
 */
import { listTemplates, updateTemplate } from "../src/lib/db";

type Meta = { description: string; tags: string[]; category: string };

const META: Record<string, Meta> = {
  "Data Quality Audit Report": {
    description: "Data-quality audit report — completeness, validity and anomaly checks at a glance.",
    tags: ["analytics", "report", "data-quality"],
    category: "Analytics",
  },
  "Cohort Retention Matrix": {
    description: "Cohort retention matrix — week-over-week retention as a heatmap grid.",
    tags: ["analytics", "retention", "cohort"],
    category: "Analytics",
  },
  "AI sales insight · Sunita Choudhary · NPrep": {
    description: "AI pre-call briefing — lead intel, risk signals and talking points for a BDE.",
    tags: ["sales", "ai", "pre-call"],
    category: "Sales enablement",
  },
  "NPrep — Dashboard Spec · v1 (Product / Sales / Marketing)": {
    description: "Internal dashboard spec — unified Product, Sales and Marketing views.",
    tags: ["dashboard", "internal", "spec"],
    category: "Internal tools",
  },
  "NPrep — Become a Government Nursing Officer": {
    description: "NORCET landing page — single-CTA free-mock lead capture for govt-nursing aspirants.",
    tags: ["landing-page", "norcet", "lead-capture"],
    category: "Landing pages",
  },
  "NPrep — Building Emotional Connect": {
    description: "Strategy deck — building an emotional connection with nursing aspirants.",
    tags: ["deck", "strategy", "brand"],
    category: "Strategy decks",
  },
  "NPrep — Master Roadmap": {
    description: "Product master roadmap — onboarding and retention initiatives on a timeline.",
    tags: ["roadmap", "planning"],
    category: "Strategy decks",
  },
  "NPrep — Onboarding & Retention Redesign": {
    description: "Onboarding and retention redesign — segments, activation moments and habit loops.",
    tags: ["deck", "onboarding", "retention"],
    category: "Strategy decks",
  },
  "NPrep — Sales Funnel Redesign · v2 (AAARRR)": {
    description: "Sales funnel redesign v2 — mapped to the AAARRR pirate-metrics framework.",
    tags: ["deck", "funnel", "aaarrr"],
    category: "Strategy decks",
  },
  "NPrep — Sales Funnel Redesign": {
    description: "Sales funnel redesign — lead-to-sale stages and where deals leak.",
    tags: ["deck", "funnel", "sales"],
    category: "Strategy decks",
  },
  "NPrep — Onboarding flows prototype": {
    description: "Interactive prototype — the four free-user onboarding flows.",
    tags: ["prototype", "onboarding", "mobile"],
    category: "Prototypes",
  },
  "NPrep — Onboarding & Retention Prototype": {
    description: "Earlier onboarding prototype — first-run flow exploration.",
    tags: ["prototype", "onboarding"],
    category: "Prototypes",
  },
  "NPrep — Paid User Onboarding (Activation Flow)": {
    description: "Post-payment activation — six-step setup and the first paid dashboard.",
    tags: ["prototype", "activation", "paid"],
    category: "Prototypes",
  },
  "NPrep — QB + Test Series · Mock result card (simple)": {
    description: "Mock-test result card for the Question Bank and Test Series.",
    tags: ["component", "test-series", "result"],
    category: "UI components",
  },
  "Q-Bank & Tests — visualization options": {
    description: "Design comps — Question Bank and Tests card variations.",
    tags: ["component", "design-system", "qbank"],
    category: "UI components",
  },
  "NPrep — Exam readiness card · V1 (de-risked)": {
    description: "Exam-readiness card — one de-risked prep-progress score for aspirants.",
    tags: ["component", "readiness", "activation"],
    category: "UI components",
  },
  "Sales Objection Analysis — NPrep BDE Survey": {
    description: "Objection analysis from the 23-BDE survey — top objections and counters.",
    tags: ["sales", "enablement", "research"],
    category: "Sales enablement",
  },
  "NPrep — 3-Day Starter Plan · Home template": {
    description: "Personalised 3-day starter plan — the new/free-user home-screen hero.",
    tags: ["prototype", "activation", "mobile"],
    category: "Prototypes",
  },
  "3 Shots by NPrep — WhatsApp Quiz Prototype": {
    description: "WhatsApp-style daily three-question quiz game built for retention.",
    tags: ["prototype", "retention", "whatsapp"],
    category: "Prototypes",
  },
};

async function main() {
  const templates = await listTemplates();
  let updated = 0;
  let missed = 0;
  for (const t of templates) {
    const m = META[t.name];
    if (!m) {
      console.log(`  – no mapping for: ${t.name}`);
      missed++;
      continue;
    }
    await updateTemplate(t.id, {
      description: m.description,
      tags: m.tags,
      category: m.category,
    });
    updated++;
    console.log(`  ✓ ${t.name}`);
  }
  console.log(`\nUpdated ${updated}, unmatched ${missed}, of ${templates.length} total.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
