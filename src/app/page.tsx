import { requireAdminPage } from "@/lib/auth";
import { listTemplates } from "@/lib/db";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireAdminPage();
  const templates = await listTemplates();
  return <Dashboard initialTemplates={templates} username={session.sub} />;
}
