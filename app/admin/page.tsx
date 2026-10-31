import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Editor } from "@/components/admin/Editor";
import { isAuthenticated } from "@/lib/auth";
import { getContent, listBackups } from "@/lib/content/store";

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="admin-loading">Memuat…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  // The session check compares the expiry with the current time, so it must run per request.
  await connection();
  if (!(await isAuthenticated())) redirect("/admin/login");
  const [content, backups] = await Promise.all([getContent(), listBackups()]);
  return <Editor initialContent={content} initialBackups={backups} />;
}
