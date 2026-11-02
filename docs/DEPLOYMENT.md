# Portfolio: pengembangan dan deploy

Website portfolio dua bahasa (`/en` dan `/id`) dengan dashboard di `/admin` untuk mengubah isinya.
Semua konten disimpan di satu file JSON. Tidak perlu database.

- **Next.js 16** (App Router, Cache Components), CSS biasa, `zod`, `lucide-react`
- Konten: `data/content.json`, file upload: `data/uploads/`, backup otomatis: `data/backups/`
- Isi awal ada di `seed/content.json`. File ini disalin ke `data/` saat pertama kali dijalankan.

## Menjalankan di lokal

```bash
npm install
npm run hash-password     # masukkan password admin, lalu salin dua baris yang dicetak
```

Tempel kedua baris itu ke file `.env.local`:

```
ADMIN_PASSWORD_HASH=...
SESSION_SECRET=...
```

Lalu jalankan:

```bash
npm run dev
```

- Website: http://localhost:3000 (otomatis diarahkan ke `/en` atau `/id` sesuai bahasa browser)
- Dashboard: http://localhost:3000/admin

## Memakai dashboard

- Setiap teks punya kolom **EN** dan **ID**. Kalau salah satu kosong, website menampilkan bahasa yang lain.
- **Paragraf**: pisahkan dengan satu baris kosong. **Link**: tulis `[teks](https://alamat.com)`.
- **Tag**: pisahkan dengan koma, misalnya `Go, Redis, PostgreSQL`.
- **Tanggal**: `2022-08` atau `2022`. Kosongkan tanggal selesai untuk yang masih berjalan ("Present"/"Sekarang").
- **Upload**: PNG, JPG, WebP, SVG (gambar) atau PDF (CV), maksimal 10MB. Foto profil otomatis dikecilkan di browser sebelum dikirim.
- Tekan **Simpan** (atau `Cmd/Ctrl + S`). Perubahan langsung tampil tanpa build ulang.
- Setiap simpan membuat backup versi sebelumnya (10 terakhir). Versi lama bisa dipulihkan dari tab **Backup**.
- **Proyek**: setiap proyek punya halaman detail sendiri di `/en/projects/<slug>`.
  - Isinya: deskripsi singkat (halaman utama), detail panjang (halaman detail), teknologi, link repository dan download/demo, serta screenshot.
  - Screenshot pertama jadi gambar sampul. Semua screenshot bisa diklik untuk diperbesar.
  - Di kolom Detail, baris yang diawali `- ` jadi daftar poin, dan `**teks**` jadi tebal.
- **Sertifikasi**: untuk bootcamp, kursus, dan sertifikat. Setiap entri bisa punya beberapa file (sertifikat, rapor, transkrip; PDF atau gambar). Tiap file jadi satu tombol yang membukanya di popup.
- Bagian yang kosong (Testimoni, Proyek, Sertifikasi) tidak tampil di website. Tombol **Download CV** baru muncul setelah PDF di-upload.

## Deploy otomatis (CI/CD)

Workflow `.github/workflows/ci.yml` berjalan di runner GitHub:

- **Setiap push dan pull request**: lint dan typecheck. Untuk pull request, image Docker juga di-build untuk memastikan build berhasil.
- **Setiap push ke `main`**:
  1. Build image Docker di runner GitHub.
  2. Kirim image ke VPS lewat SSH (`docker save | docker load`). VPS tidak perlu build sendiri, jadi project lain di server tidak ikut terbebani.
  3. Jalankan `scripts/deploy.sh` di VPS: container diganti ke image baru, lalu ditunggu sampai `/en` merespons.
  4. Kalau versi baru tidak merespons, otomatis rollback ke versi sebelumnya.
- Deploy juga bisa dijalankan manual dari tab **Actions** → *CI and Production Deploy* → **Run workflow**.

Karena repo ini publik, workflow tidak memakai self-hosted runner. Kalau memakai self-hosted runner, pull request dari fork bisa menjalankan kode di server Anda.

### Konfigurasi di GitHub

Repository **variables** (Settings → Secrets and variables → Actions → Variables):

| Nama | Contoh |
|---|---|
| `VPS_HOST` | `43.133.46.121` |
| `VPS_PORT` | `22` |
| `VPS_USER` | `ubuntu` |
| `VPS_DEPLOY_PATH` | `/home/ubuntu/ilhamnadhif` |
| `VPS_SSH_KNOWN_HOSTS` | keluaran `ssh-keyscan -t ed25519 <host>` |
| `SITE_URL` | `http://43.133.46.121:3003` |

Repository **secret** `VPS_SSH_PRIVATE_KEY_BASE64`: private key deploy (tanpa passphrase) dalam bentuk base64.
Public key pasangannya harus ada di `~/.ssh/authorized_keys` di VPS.

Selama `VPS_HOST` kosong, job deploy dilewati dan CI hanya mengecek kode.

### Isi folder di VPS

```
/home/ubuntu/ilhamnadhif/
  .env                 dibuat sekali secara manual, tidak ada di git
  docker-compose.yml   dikirim ulang oleh CI setiap deploy
  data/                content.json, uploads/, backups/
  .deployed-tag        commit yang sedang berjalan, dipakai untuk rollback
```

Contoh `.env`:

```
WEB_PORT=3003
SITE_URL=http://43.133.46.121:3003
COOKIE_SECURE=false          # karena masih http tanpa domain
ADMIN_PASSWORD_HASH=...      # dari: npm run hash-password
SESSION_SECRET=...
```

Folder `data/` harus dimiliki uid 1000. User `ubuntu` di VPS ini sudah uid 1000.

### Ganti password admin

```bash
npm run hash-password      # di laptop
ssh ubuntu@43.133.46.121
nano ~/ilhamnadhif/.env    # ganti ADMIN_PASSWORD_HASH (dan SESSION_SECRET untuk logout semua sesi)
cd ~/ilhamnadhif && docker compose up -d --force-recreate web
```

### Pindah ke domain + HTTPS

1. Arahkan A record domain ke IP VPS.
2. Di `.env` VPS: isi `DOMAIN`, ubah `SITE_URL` ke `https://domain`, hapus `COOKIE_SECURE=false`.
3. HTTPS bisa diurus oleh Caddy bawaan (`docker compose --profile https up -d`, butuh port 80/443 kosong), atau lewat reverse proxy yang sudah ada di server dengan `WEB_PORT=127.0.0.1:3003`.
   Kalau memakai proxy sendiri, pastikan proxy meneruskan header `Host` atau `X-Forwarded-Host`, karena Server Actions memeriksa origin request.

### Backup

Seluruh isi website ada di folder `data/` di VPS. Contoh backup harian lewat cron:

```bash
0 3 * * * tar -czf /home/ubuntu/backup/portfolio-$(date +\%F).tar.gz -C /home/ubuntu/ilhamnadhif data
```

Konten di `data/` tidak tertimpa saat deploy, karena seed hanya dipakai kalau `data/content.json` belum ada.

### Deploy manual tanpa CI

```bash
# di laptop (pakai --platform karena VPS memakai amd64)
docker build --platform linux/amd64 -t ilhamnadhif-portfolio:manual .
docker save ilhamnadhif-portfolio:manual | gzip | ssh ubuntu@43.133.46.121 'gunzip | docker load'
scp docker-compose.yml ubuntu@43.133.46.121:ilhamnadhif/
ssh ubuntu@43.133.46.121 'bash -s -- /home/ubuntu/ilhamnadhif manual' < scripts/deploy.sh
```

## Keamanan

- Login memakai satu password admin (hash scrypt) dan cookie session httpOnly bertanda tangan HMAC, berlaku 7 hari.
- Login dikunci 15 menit setelah 5 kali gagal.
- Halaman dashboard dan setiap Server Action memverifikasi session sendiri.
- Isi file upload dicek berdasarkan isinya, bukan cuma ekstensinya. Semua file disajikan dengan `nosniff`, dan SVG juga dengan CSP `sandbox`.
- Cookie hanya dikirim lewat HTTPS di production, kecuali `COOKIE_SECURE=false`.
  Selama website masih di `http://IP:port`, password admin terkirim tanpa enkripsi. Pindah ke domain + HTTPS sebelum dipakai serius.

## Struktur

```
app/[lang]/          halaman publik (en, id)
app/admin/           dashboard: login, editor, server actions
app/uploads/[name]/  menyajikan file dari data/uploads
components/site/     komponen halaman publik
components/admin/    komponen form dashboard
lib/content/         schema (zod) dan penyimpanan JSON
lib/auth.ts          password, session, rate limit login
lib/i18n.ts          bahasa, teks antarmuka, format tanggal
proxy.ts             pilih bahasa untuk "/" dan cek awal "/admin"
scripts/deploy.sh    dijalankan di VPS oleh CI: ganti container, cek, rollback
.github/workflows/   CI dan deploy otomatis
seed/content.json    isi awal website
seed/uploads/        gambar awal (sertifikat, screenshot), disalin ke data/uploads kalau belum ada
```
