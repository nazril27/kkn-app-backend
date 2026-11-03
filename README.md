# KKN App Backend

Backend API untuk aplikasi pencatatan KKN: data rumah, pencatatan sampah, dan akun mahasiswa.

**Stack:** [Bun](https://bun.sh) · [ElysiaJS](https://elysiajs.com) · PostgreSQL ([Neon](https://neon.tech)) · [Drizzle ORM](https://orm.drizzle.team) · [Vercel](https://vercel.com)

Dokumentasi endpoint untuk frontend: **[API_DOCS.md](./API_DOCS.md)**

---

## Menjalankan lokal

1. Instal dependensi:

```bash
bun install
```

2. Buat `.env`:

```env
DATABASE_URL="postgresql://..."
PORT=3000
```

3. Jalankan server:

```bash
bun run index.ts
```

API tersedia di `http://localhost:3000`.

Hot reload:

```bash
bun --hot index.ts
```

---

## Perintah lain

```bash
bun test                 # unit test helper (paginasi, validasi)
bunx tsc --noEmit        # typecheck
bunx drizzle-kit generate
bunx drizzle-kit migrate
bunx drizzle-kit studio
```

---

## Struktur

```
src/
  db/                 # koneksi Neon + schema Drizzle
  lib/                # error, paginasi, validasi, schema HTTP
  modules/
    users/            # register, login, logout (belum JWT)
    houses/           # CRUD rumah
    wastes/           # CRUD pencatatan sampah
  index.ts            # app Elysia + CORS
index.ts              # entry lokal
api/index.ts          # entry Vercel
```

---

## Catatan penting

- Autentikasi JWT/session **belum** dipakai. Login mengembalikan profil user (tanpa password) untuk disimpan di client.
- Endpoint houses/wastes **terbuka** (tidak perlu token).
- Relasi `user` / `house` pada response bernilai objek atau `null` (bukan objek dengan field `null`).
- Hapus rumah ditolak (`409`) jika masih ada data sampah yang merujuk rumah itu.
- `userId` / `houseId` yang tidak ada di database ditolak (`422`).
