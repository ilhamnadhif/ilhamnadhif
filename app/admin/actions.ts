"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearFailedLogins,
  createSession,
  destroySession,
  isAuthConfigured,
  isAuthenticated,
  isRateLimited,
  recordFailedLogin,
  verifyPassword,
} from "@/lib/auth";
import type { Content } from "@/lib/content/schema";
import { getContent, listBackups, restoreBackup, saveContent } from "@/lib/content/store";
import { storeUpload, type UploadResult } from "@/lib/uploads";

const SESSION_EXPIRED = "Sesi sudah habis. Muat ulang halaman lalu login lagi.";

export type LoginState = { error?: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAuthConfigured()) {
    return { error: "Dashboard belum dikonfigurasi. Isi ADMIN_PASSWORD_HASH dan SESSION_SECRET di file .env." };
  }

  const requestHeaders = await headers();
  const client =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "local";
  if (isRateLimited(client)) {
    return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !(await verifyPassword(password))) {
    recordFailedLogin(client);
    return { error: "Password salah." };
  }

  clearFailedLogins(client);
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export type SaveState = { ok: true; content: Content; backups: string[] } | { ok: false; errors: string[] };

export async function saveContentAction(json: string): Promise<SaveState> {
  if (!(await isAuthenticated())) return { ok: false, errors: [SESSION_EXPIRED] };
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, errors: ["Data tidak valid."] };
  }
  const result = await saveContent(data);
  if (!result.ok) return result;
  return { ok: true, content: await getContent(), backups: await listBackups() };
}

export async function uploadAction(formData: FormData): Promise<UploadResult> {
  if (!(await isAuthenticated())) return { ok: false, error: SESSION_EXPIRED };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Tidak ada file yang dipilih." };
  const kind = formData.get("kind");
  if (kind === "pdf") return storeUpload(file, ["pdf"]);
  if (kind === "certificate") return storeUpload(file, ["pdf", "png", "jpg", "jpeg", "webp"]);
  return storeUpload(file, ["png", "jpg", "jpeg", "webp", "svg"]);
}

export async function restoreAction(name: string): Promise<SaveState> {
  if (!(await isAuthenticated())) return { ok: false, errors: [SESSION_EXPIRED] };
  const result = await restoreBackup(name);
  if (!result.ok) return result;
  return { ok: true, content: await getContent(), backups: await listBackups() };
}
