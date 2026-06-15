import { requireAdminPage } from "@/lib/auth";
import { listTemplates } from "@/lib/db";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireAdminPage();
  const templates = await listTemplates();
  const thumbBase = process.env.SUPABASE_URL
    ? `${process.env.SUPABASE_URL}/storage/v1/object/public/thumbnails`
    : null;
  return (
    <Dashboard
      initialTemplates={templates}
      username={session.sub}
      thumbBase={thumbBase}
    />
  );
}
