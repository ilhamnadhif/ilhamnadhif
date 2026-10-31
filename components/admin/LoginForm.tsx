"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="login-form">
      <label className="field">
        <span className="field-label">Password</span>
        <input
          className="input"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </label>
      {state.error && (
        <p id="login-error" className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-large" disabled={pending}>
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
