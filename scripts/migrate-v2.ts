/**
 * One-off migration for the links + grouping update. Safe to re-run.
 * - Gives each template a "Default link" (token == its original share_token,
 *   so every link already shared keeps working).
 * - Tags each of the 20 known templates with a Type + Project.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node_modules/.bin/tsx scripts/migrate-v2.ts
 *   (omit the env vars to run against the local JSON store)
 */
import {
  listTemplates,
  listShareLinks,
  createShareLink,
  updateTemplate,
  usingSupabase,
} from "../src/lib/db";

const TAXONOMY: Record<string, { type: string; project: string }> = {
  "Data Quality Audit Report": { type: "Metrics", project: "Analytics" },
  "Cohort Retention Matrix": { type: "Metrics", project: "Analytics" },
  "AI sales insight · Sunita Choudhary · NPrep": { type: "Prototype", project: "Sales enablement" },
  "NPrep — Dashboard Spec · v1 (Product / Sales / Marketing)": { type: "Analysis", project: "Internal tools" },
  "NPrep — Become a Government Nursing Officer": { type: "Landing page", project: "Acquisition" },
  "NPrep — Building Emotional Connect": { type: "Deck", project: "Onboarding & retention" },
  "NPrep — Master Roadmap": { type: "Plan", project: "Onboarding & retention" },
  "NPrep — Onboarding & Retention Redesign": { type: "Deck", project: "Onboarding & retention" },
  "NPrep — Sales Funnel Redesign · v2 (AAARRR)": { type: "Deck", project: "Sales funnel" },
  "NPrep — Sales Funnel Redesign": { type: "Deck", project: "Sales funnel" },
  "NPrep — Onboarding flows prototype": { type: "Prototype", project: "Onboarding & retention" },
  "NPrep — Onboarding & Retention Prototype": { type: "Prototype", project: "Onboarding & retention" },
  "NPrep — Paid User Onboarding (Activation Flow)": { type: "Prototype", project: "Onboarding & retention" },
  "NPrep — QB + Test Series · Mock result card (simple)": { type: "Component", project: "Q-Bank & Tests" },
  "Q-Bank & Tests — visualization options": { type: "Component", project: "Q-Bank & Tests" },
  "NPrep — Exam readiness card · V1 (de-risked)": { type: "Component", project: "Onboarding & retention" },
  "Sales Objection Analysis — NPrep BDE Survey": { type: "Analysis", project: "Sales enablement" },
  "NPrep — 3-Day Starter Plan · Home template": { type: "Prototype", project: "Onboarding & retention" },
  "3 Shots by NPrep — WhatsApp Quiz Prototype": { type: "Prototype", project: "Onboarding & retention" },
};

async function main() {
  console.log(`Backend: ${usingSupabase() ? "Supabase" : "local JSON store"}`);
  const templates = await listTemplates();
  let madeLinks = 0;
  let tagged = 0;

  for (const t of templates) {
    const existing = await listShareLinks(t.id);
    if (existing.length === 0) {
      await createShareLink(
        {
          template_id: t.id,
          label: "Default link",
          purpose: "Original share link",
        },
        t.share_token
      );
      madeLinks++;
    }

    const tax = TAXONOMY[t.name];
    if (tax) {
      await updateTemplate(t.id, { type: tax.type, project: tax.project });
      tagged++;
    } else {
      console.log(`  – no taxonomy mapping: ${t.name}`);
    }
  }

  console.log(
    `\nDone. Created ${madeLinks} default link(s); tagged ${tagged}/${templates.length} with Type + Project.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
