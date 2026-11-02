"use client";

import { Check, ExternalLink, LogOut, RotateCcw, Save } from "lucide-react";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { logout, restoreAction, saveContentAction, type SaveState } from "@/app/admin/actions";
import { iconNames, type Content } from "@/lib/content/schema";
import { MAX_UPLOAD_MB } from "@/lib/upload-limit";
import {
  emptyLocalized,
  Field,
  FileUpload,
  ListEditor,
  LocalizedField,
  newId,
  PeriodFields,
  TextField,
} from "./fields";

const tabs = [
  { id: "profile", label: "Profil" },
  { id: "about", label: "Tentang" },
  { id: "testimonials", label: "Testimoni" },
  { id: "work", label: "Pengalaman" },
  { id: "projects", label: "Proyek" },
  { id: "education", label: "Pendidikan" },
  { id: "certifications", label: "Sertifikasi" },
  { id: "seo", label: "SEO" },
  { id: "backups", label: "Backup" },
] as const;

type Tab = (typeof tabs)[number]["id"];

const TEXT_HINT = "Pisahkan paragraf dengan baris kosong. Link: [teks](https://…)";

function describeBackup(name: string) {
  const match = name.match(/^content-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
  if (!match) return name;
  const [, y, mo, d, h, mi, s] = match;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function Editor({ initialContent, initialBackups }: { initialContent: Content; initialBackups: string[] }) {
  const [content, setContent] = useState(initialContent);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialContent));
  const [backups, setBackups] = useState(initialBackups);
  const [tab, setTab] = useState<Tab>("profile");
  const [errors, setErrors] = useState<string[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(content) !== savedJson;

  const set = <K extends keyof Content>(key: K, value: Content[K]) => {
    setContent((current) => ({ ...current, [key]: value }));
    setJustSaved(false);
  };

  const apply = (result: SaveState) => {
    if (result.ok) {
      setContent(result.content);
      setSavedJson(JSON.stringify(result.content));
      setBackups(result.backups);
      setErrors([]);
      setJustSaved(true);
    } else {
      setErrors(result.errors);
    }
  };

  const save = () => {
    startTransition(async () => apply(await saveContentAction(JSON.stringify(content))));
  };

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "s") {
      event.preventDefault();
      if (dirty && !pending) save();
    }
  });

  const onBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (dirty) event.preventDefault();
  });

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => onKeyDown(event);
    const beforeunload = (event: BeforeUnloadEvent) => onBeforeUnload(event);
    window.addEventListener("keydown", keydown);
    window.addEventListener("beforeunload", beforeunload);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("beforeunload", beforeunload);
    };
  }, []);

  const { profile, links } = content;

  return (
    <div className="editor">
      <header className="editor-bar">
        <strong>Dashboard</strong>
        <span className={`status${dirty ? " is-dirty" : ""}`} aria-live="polite">
          {pending ? "Menyimpan…" : dirty ? "Belum disimpan" : justSaved ? "Tersimpan" : ""}
        </span>
        <a className="btn btn-tertiary" href="/en" target="_blank" rel="noreferrer">
          <ExternalLink /> Lihat situs
        </a>
        <button type="button" className="btn btn-primary" disabled={!dirty || pending} onClick={save}>
          {justSaved && !dirty ? <Check /> : <Save />} Simpan
        </button>
        <form action={logout}>
          <button type="submit" className="btn btn-tertiary btn-icon" aria-label="Keluar" title="Keluar">
            <LogOut />
          </button>
        </form>
      </header>

      <nav className="tabs" aria-label="Bagian konten">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab${tab === item.id ? " is-active" : ""}`}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {errors.length > 0 && (
        <div className="error-box" role="alert">
          <strong>Belum bisa disimpan:</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel">
        {tab === "profile" && (
          <>
            <TextField label="Nama lengkap" value={profile.name} onChange={(name) => set("profile", { ...profile, name })} />
            <TextField
              label="Inisial"
              value={profile.initials}
              hint="Tampil di avatar kalau belum ada foto, dan di footer"
              onChange={(initials) => set("profile", { ...profile, initials })}
            />
            <FileUpload
              label="Foto profil"
              kind="image"
              shrinkTo={800}
              value={profile.avatar}
              hint={`Foto persegi paling bagus. PNG, JPG atau WebP, maksimal ${MAX_UPLOAD_MB}MB; foto besar otomatis dikecilkan.`}
              onChange={(avatar) => set("profile", { ...profile, avatar })}
            />
            <LocalizedField
              label="Headline (judul besar)"
              value={profile.headline}
              onChange={(headline) => set("profile", { ...profile, headline })}
            />
            <LocalizedField
              label="Subjudul"
              rows={4}
              value={profile.subtitle}
              onChange={(subtitle) => set("profile", { ...profile, subtitle })}
            />
            <LocalizedField
              label="Lokasi"
              value={profile.location}
              hint="Dipakai untuk data SEO"
              onChange={(location) => set("profile", { ...profile, location })}
            />
            <TextField
              label="Email"
              type="email"
              value={profile.email}
              onChange={(email) => set("profile", { ...profile, email })}
            />
            <FileUpload
              label="CV (PDF)"
              kind="pdf"
              value={profile.cv}
              hint="Kalau diisi, tombol Download CV muncul di halaman utama"
              onChange={(cv) => set("profile", { ...profile, cv })}
            />
            <TextField
              label="LinkedIn"
              type="url"
              value={links.linkedin}
              onChange={(linkedin) => set("links", { ...links, linkedin })}
            />
            <TextField
              label="GitHub"
              type="url"
              value={links.github}
              onChange={(github) => set("links", { ...links, github })}
            />
          </>
        )}

        {tab === "about" && (
          <>
            <p className="panel-note">
              Blok pertama menjadi tujuan menu &ldquo;About&rdquo;. Testimoni pertama tampil setelah blok pertama.
            </p>
            <ListEditor
              items={content.about}
              onChange={(about) => set("about", about)}
              addLabel="Tambah blok"
              summary={(item) => item.title.en || item.title.id}
              create={() => ({ id: newId(), title: emptyLocalized(), body: emptyLocalized(), tags: emptyLocalized() })}
              render={(item, update) => (
                <>
                  <LocalizedField label="Judul" value={item.title} onChange={(title) => update({ ...item, title })} />
                  <LocalizedField
                    label="Isi"
                    rows={6}
                    hint={TEXT_HINT}
                    value={item.body}
                    onChange={(body) => update({ ...item, body })}
                  />
                  <LocalizedField
                    label="Tag"
                    hint="Pisahkan dengan koma, contoh: Go, Redis, Pub/Sub"
                    value={item.tags}
                    onChange={(tags) => update({ ...item, tags })}
                  />
                </>
              )}
            />
          </>
        )}

        {tab === "testimonials" && (
          <>
            <p className="panel-note">Bagian ini tidak tampil di website selama kosong.</p>
            <ListEditor
              items={content.testimonials}
              onChange={(testimonials) => set("testimonials", testimonials)}
              addLabel="Tambah testimoni"
              summary={(item) => item.author}
              create={() => ({ id: newId(), quote: emptyLocalized(), author: "", role: emptyLocalized() })}
              render={(item, update) => (
                <>
                  <LocalizedField label="Kutipan" rows={4} value={item.quote} onChange={(quote) => update({ ...item, quote })} />
                  <TextField label="Nama" value={item.author} onChange={(author) => update({ ...item, author })} />
                  <LocalizedField
                    label="Jabatan & perusahaan"
                    value={item.role}
                    onChange={(role) => update({ ...item, role })}
                  />
                </>
              )}
            />
          </>
        )}

        {tab === "work" && (
          <ListEditor
            items={content.work}
            onChange={(work) => set("work", work)}
            addLabel="Tambah pengalaman"
            summary={(item) => [item.company, item.role.en].filter(Boolean).join(" — ")}
            create={() => ({
              id: newId(),
              company: "",
              role: emptyLocalized(),
              start: "",
              end: "",
              location: emptyLocalized(),
              description: emptyLocalized(),
              logo: "",
              url: "",
            })}
            render={(item, update) => (
              <>
                <TextField label="Perusahaan" value={item.company} onChange={(company) => update({ ...item, company })} />
                <LocalizedField label="Posisi" value={item.role} onChange={(role) => update({ ...item, role })} />
                <PeriodFields start={item.start} end={item.end} onChange={(period) => update({ ...item, ...period })} />
                <LocalizedField label="Lokasi" value={item.location} onChange={(location) => update({ ...item, location })} />
                <LocalizedField
                  label="Deskripsi"
                  rows={5}
                  hint={TEXT_HINT}
                  value={item.description}
                  onChange={(description) => update({ ...item, description })}
                />
                <FileUpload
                  label="Logo perusahaan"
                  kind="image"
                  value={item.logo}
                  hint="Persegi, tampil 24×24 px. Kosong = ikon koper."
                  onChange={(logo) => update({ ...item, logo })}
                />
                <TextField
                  label="Website perusahaan"
                  type="url"
                  placeholder="https://…"
                  value={item.url}
                  onChange={(url) => update({ ...item, url })}
                />
              </>
            )}
          />
        )}

        {tab === "projects" && (
          <ListEditor
            items={content.projects}
            onChange={(projects) => set("projects", projects)}
            addLabel="Tambah proyek"
            summary={(item) => item.name}
            create={() => ({
              id: newId(),
              name: "",
              tagline: emptyLocalized(),
              description: emptyLocalized(),
              tags: "",
              icon: "code" as const,
              logo: "",
              repo: "",
              homepage: "",
              homepageLabel: { en: "Download", id: "Unduh" },
              slug: "",
              details: emptyLocalized(),
              screenshots: [],
            })}
            render={(item, update) => (
              <>
                <TextField label="Nama proyek" value={item.name} onChange={(name) => update({ ...item, name })} />
                <TextField
                  label="Slug (alamat halaman detail)"
                  placeholder={item.id}
                  hint={`Halaman detail: /en/projects/${item.slug || item.id}. Huruf kecil, angka dan tanda minus.`}
                  value={item.slug}
                  onChange={(slug) => update({ ...item, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                />
                <LocalizedField
                  label="Tagline"
                  hint="Tampil setelah nama, contoh: SSH & SFTP client for macOS"
                  value={item.tagline}
                  onChange={(tagline) => update({ ...item, tagline })}
                />
                <LocalizedField
                  label="Deskripsi singkat"
                  rows={4}
                  hint={`Tampil di halaman utama. ${TEXT_HINT}`}
                  value={item.description}
                  onChange={(description) => update({ ...item, description })}
                />
                <LocalizedField
                  label="Detail"
                  rows={12}
                  hint={`Tampil di halaman detail. ${TEXT_HINT}. Daftar poin: awali tiap baris dengan "- ". Tebal: **teks**.`}
                  value={item.details}
                  onChange={(details) => update({ ...item, details })}
                />
                <div className="field">
                  <span className="field-label">Screenshot</span>
                  <span className="field-hint">Screenshot pertama jadi gambar utama di halaman utama dan halaman detail.</span>
                  <ListEditor
                    items={item.screenshots}
                    onChange={(screenshots) => update({ ...item, screenshots })}
                    addLabel="Tambah screenshot"
                    summary={(shot, index) => `${index + 1}. ${shot.caption.en || shot.caption.id || "Screenshot"}`}
                    create={() => ({ id: newId(), file: "", caption: emptyLocalized() })}
                    render={(shot, updateShot) => (
                      <>
                        <FileUpload
                          label="Gambar"
                          kind="image"
                          value={shot.file}
                          hint={`PNG, JPG atau WebP, maksimal ${MAX_UPLOAD_MB}MB. Lebar sekitar 1600 px sudah cukup.`}
                          onChange={(file) => updateShot({ ...shot, file })}
                        />
                        <LocalizedField label="Keterangan" value={shot.caption} onChange={(caption) => updateShot({ ...shot, caption })} />
                      </>
                    )}
                  />
                </div>
                <TextField
                  label="Teknologi"
                  hint="Pisahkan dengan koma, contoh: Rust, egui, SSH"
                  value={item.tags}
                  onChange={(tags) => update({ ...item, tags })}
                />
                <Field label="Ikon" hint="Dipakai kalau logo belum di-upload">
                  <select
                    className="input"
                    value={item.icon}
                    onChange={(event) => update({ ...item, icon: event.target.value as typeof item.icon })}
                  >
                    {iconNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </Field>
                <FileUpload
                  label="Logo / ikon aplikasi"
                  kind="image"
                  value={item.logo}
                  hint="Persegi, tampil 24×24 px"
                  onChange={(logo) => update({ ...item, logo })}
                />
                <TextField
                  label="Link repository"
                  type="url"
                  placeholder="https://github.com/…"
                  value={item.repo}
                  onChange={(repo) => update({ ...item, repo })}
                />
                <TextField
                  label="Link download / demo"
                  type="url"
                  placeholder="https://…"
                  value={item.homepage}
                  onChange={(homepage) => update({ ...item, homepage })}
                />
                <LocalizedField
                  label="Label tombol download / demo"
                  hint="Contoh: Download, Live demo"
                  value={item.homepageLabel}
                  onChange={(homepageLabel) => update({ ...item, homepageLabel })}
                />
              </>
            )}
          />
        )}

        {tab === "education" && (
          <ListEditor
            items={content.education}
            onChange={(education) => set("education", education)}
            addLabel="Tambah pendidikan"
            summary={(item) => item.school}
            create={() => ({ id: newId(), school: "", degree: emptyLocalized(), start: "", end: "", logo: "" })}
            render={(item, update) => (
              <>
                <TextField label="Institusi" value={item.school} onChange={(school) => update({ ...item, school })} />
                <LocalizedField label="Gelar / jurusan" value={item.degree} onChange={(degree) => update({ ...item, degree })} />
                <PeriodFields start={item.start} end={item.end} onChange={(period) => update({ ...item, ...period })} />
                <FileUpload
                  label="Logo"
                  kind="image"
                  value={item.logo}
                  hint="Kosong = ikon toga."
                  onChange={(logo) => update({ ...item, logo })}
                />
              </>
            )}
          />
        )}

        {tab === "certifications" && (
          <ListEditor
            items={content.certifications}
            onChange={(certifications) => set("certifications", certifications)}
            addLabel="Tambah bootcamp / sertifikat"
            summary={(item) => [item.issuer, item.name.en || item.name.id].filter(Boolean).join(" — ")}
            create={() => ({
              id: newId(),
              name: emptyLocalized(),
              issuer: "",
              start: "",
              end: "",
              description: emptyLocalized(),
              files: [],
              url: "",
              logo: "",
            })}
            render={(item, update) => (
              <>
                <TextField
                  label="Penyelenggara"
                  placeholder="Binar Academy, Dicoding, Google…"
                  value={item.issuer}
                  onChange={(issuer) => update({ ...item, issuer })}
                />
                <LocalizedField label="Nama program / sertifikat" value={item.name} onChange={(name) => update({ ...item, name })} />
                <PeriodFields start={item.start} end={item.end} onChange={(period) => update({ ...item, ...period })} />
                <p className="field-hint">
                  Untuk sertifikat dengan satu tanggal terbit, isi Mulai dan Selesai dengan tanggal yang sama.
                  Kosongkan keduanya kalau tidak ingin menampilkan tanggal.
                </p>
                <LocalizedField
                  label="Deskripsi"
                  rows={3}
                  hint={TEXT_HINT}
                  value={item.description}
                  onChange={(description) => update({ ...item, description })}
                />
                <div className="field">
                  <span className="field-label">File (sertifikat, rapor, transkrip…)</span>
                  <span className="field-hint">
                    Setiap file jadi satu tombol di website dan dibuka di popup. PDF, PNG, JPG atau WebP, maksimal {MAX_UPLOAD_MB}MB.
                  </span>
                  <ListEditor
                    items={item.files}
                    onChange={(files) => update({ ...item, files })}
                    addLabel="Tambah file"
                    summary={(file) => file.label.id || file.label.en || "File"}
                    create={() => ({ id: newId(), label: { en: "View certificate", id: "Lihat sertifikat" }, file: "" })}
                    render={(file, updateFile) => (
                      <>
                        <LocalizedField
                          label="Label tombol"
                          value={file.label}
                          onChange={(label) => updateFile({ ...file, label })}
                        />
                        <FileUpload
                          label="File"
                          kind="certificate"
                          value={file.file}
                          onChange={(path) => updateFile({ ...file, file: path })}
                        />
                      </>
                    )}
                  />
                </div>
                <TextField
                  label="Link verifikasi"
                  type="url"
                  placeholder="https://… (opsional)"
                  value={item.url}
                  onChange={(url) => update({ ...item, url })}
                />
                <FileUpload
                  label="Logo penyelenggara"
                  kind="image"
                  value={item.logo}
                  hint="Kosong = ikon medali."
                  onChange={(logo) => update({ ...item, logo })}
                />
              </>
            )}
          />
        )}

        {tab === "seo" && (
          <>
            <LocalizedField
              label="Judul halaman"
              hint="Tampil di tab browser dan hasil Google"
              value={content.seo.title}
              onChange={(title) => set("seo", { ...content.seo, title })}
            />
            <LocalizedField
              label="Deskripsi"
              rows={3}
              hint="Sekitar 150 karakter"
              value={content.seo.description}
              onChange={(description) => set("seo", { ...content.seo, description })}
            />
          </>
        )}

        {tab === "backups" && (
          <>
            <p className="panel-note">
              Setiap kali menyimpan, versi sebelumnya disimpan otomatis (10 terakhir). Memulihkan juga membuat backup
              dari versi saat ini, jadi bisa dibatalkan.
            </p>
            {backups.length === 0 ? (
              <p className="panel-note">Belum ada backup.</p>
            ) : (
              <ul className="backup-list">
                {backups.map((name) => (
                  <li key={name}>
                    <span>{describeBackup(name)}</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={pending}
                      onClick={() => {
                        if (dirty && !window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?")) return;
                        startTransition(async () => apply(await restoreAction(name)));
                      }}
                    >
                      <RotateCcw /> Pulihkan
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
