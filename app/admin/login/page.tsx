import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Login · Dashboard" };

export default function LoginPage() {
  return (
    <main className="login">
      <h1>Dashboard</h1>
      <p>Masukkan password admin untuk mengubah isi website.</p>
      <LoginForm />
    </main>
  );
}
