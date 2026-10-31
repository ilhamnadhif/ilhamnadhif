"use client";

/* eslint-disable @next/next/no-img-element -- previews of uploaded files */
import { ChevronDown, ChevronUp, FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { uploadAction } from "@/app/admin/actions";
import type { Localized } from "@/lib/i18n";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

type TextProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  type?: "text" | "email" | "url";
};

export function TextField({ label, value, onChange, hint, placeholder, type = "text" }: TextProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        className="input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

type LocalizedProps = {
  label: string;
  value: Localized;
  onChange: (value: Localized) => void;
  hint?: string;
  rows?: number;
};

/** One input per language, side by side. `rows` turns them into text areas. */
export function LocalizedField({ label, value, onChange, hint, rows }: LocalizedProps) {
  const id = useId();
  return (
    <div className="field" role="group" aria-labelledby={id}>
      <span className="field-label" id={id}>
        {label}
      </span>
      <div className="localized">
        {(["en", "id"] as const).map((lang) => (
          <label key={lang} className="localized-input">
            <span className="lang-badge">{lang.toUpperCase()}</span>
            {rows ? (
              <textarea
                className="input"
                rows={rows}
                value={value[lang]}
                onChange={(event) => onChange({ ...value, [lang]: event.target.value })}
              />
            ) : (
              <input
                className="input"
                value={value[lang]}
                onChange={(event) => onChange({ ...value, [lang]: event.target.value })}
              />
            )}
          </label>
        ))}
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export function PeriodFields({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (value: { start: string; end: string }) => void;
}) {
  return (
    <div className="row">
      <TextField
        label="Mulai"
        value={start}
        placeholder="2022-08"
        hint="Format YYYY-MM atau YYYY"
        onChange={(value) => onChange({ start: value, end })}
      />
      <TextField
        label="Selesai"
        value={end}
        placeholder="kosong = sekarang"
        hint="Kosongkan kalau masih berjalan"
        onChange={(value) => onChange({ start, end: value })}
      />
    </div>
  );
}

type ListProps<T extends { id: string }> = {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  addLabel: string;
  summary: (item: T, index: number) => string;
  render: (item: T, update: (item: T) => void) => ReactNode;
};

/** Add, remove and reorder items. Each one folds into a <details> element. */
export function ListEditor<T extends { id: string }>({ items, onChange, create, addLabel, summary, render }: ListProps<T>) {
  const [openId, setOpenId] = useState<string | null>(null);

  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className="list-editor">
      {items.map((item, index) => (
        <details key={item.id} className="list-item" open={openId === item.id || undefined}>
          <summary>
            <span className="list-item-title">{summary(item, index) || "(tanpa judul)"}</span>
            <span className="list-item-actions">
              <button
                type="button"
                className="btn btn-tertiary btn-icon"
                aria-label="Naikkan"
                disabled={index === 0}
                onClick={(event) => {
                  event.preventDefault();
                  move(index, -1);
                }}
              >
                <ChevronUp />
              </button>
              <button
                type="button"
                className="btn btn-tertiary btn-icon"
                aria-label="Turunkan"
                disabled={index === items.length - 1}
                onClick={(event) => {
                  event.preventDefault();
                  move(index, 1);
                }}
              >
                <ChevronDown />
              </button>
              <button
                type="button"
                className="btn btn-tertiary btn-icon danger"
                aria-label="Hapus"
                onClick={(event) => {
                  event.preventDefault();
                  if (window.confirm(`Hapus "${summary(item, index) || "item ini"}"?`)) {
                    onChange(items.filter((other) => other.id !== item.id));
                  }
                }}
              >
                <Trash2 />
              </button>
            </span>
          </summary>
          <div className="list-item-body">
            {render(item, (updated) => onChange(items.map((other) => (other.id === item.id ? updated : other))))}
          </div>
        </details>
      ))}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          const item = create();
          onChange([...items, item]);
          setOpenId(item.id);
        }}
      >
        <Plus /> {addLabel}
      </button>
    </div>
  );
}

type UploadProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** image: png/jpg/webp/svg · pdf: pdf only · certificate: pdf or png/jpg/webp */
  kind: "image" | "pdf" | "certificate";
  hint?: string;
};

const accepts: Record<UploadProps["kind"], string> = {
  image: "image/png,image/jpeg,image/webp,image/svg+xml",
  pdf: "application/pdf",
  certificate: "application/pdf,image/png,image/jpeg,image/webp",
};

export function FileUpload({ label, value, onChange, kind, hint }: UploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const upload = (file: File) => {
    setError(null);
    const data = new FormData();
    data.set("file", file);
    data.set("kind", kind);
    startTransition(async () => {
      const result = await uploadAction(data);
      if (result.ok) onChange(result.path);
      else setError(result.error);
      if (input.current) input.current.value = "";
    });
  };

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="upload">
        {value ? (
          value.endsWith(".pdf") ? (
            <a href={value} target="_blank" rel="noreferrer" className="upload-file">
              <FileText /> Lihat PDF
            </a>
          ) : (
            <a href={value} target="_blank" rel="noreferrer">
              <img src={value} alt="" className="upload-preview" />
            </a>
          )
        ) : (
          <span className="upload-empty">Belum ada file</span>
        )}
        <input
          ref={input}
          type="file"
          hidden
          accept={accepts[kind]}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => input.current?.click()}>
          <Upload /> {pending ? "Mengunggah…" : value ? "Ganti" : "Upload"}
        </button>
        {value && (
          <button type="button" className="btn btn-tertiary" onClick={() => onChange("")}>
            <X /> Hapus
          </button>
        )}
      </div>
      {hint && <span className="field-hint">{hint}</span>}
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export const emptyLocalized = (): Localized => ({ en: "", id: "" });

export const newId = () => crypto.randomUUID().slice(0, 8);
