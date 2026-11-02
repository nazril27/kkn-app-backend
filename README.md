# KKN App Backend

Backend API untuk aplikasi pencatatan KKN (Pengelolaan Rumah & Sampah).

Dibangun menggunakan:
- **Runtime:** [Bun](https://bun.sh)
- **Framework:** [ElysiaJS](https://elysiajs.com)
- **Database & ORM:** PostgreSQL ([Neon Serverless](https://neon.tech)) & [Drizzle ORM](https://orm.drizzle.team)
- **Platform Deployment:** [Vercel](https://vercel.com)

---

## 🚀 Menjalankan Server Lokal

1. **Instalasi Dependensi:**
   ```bash
   bun install
   ```

2. **Setup Environment Variable (`.env`):**
   ```env
   DATABASE_URL="postgresql://..."
   ```

3. **Jalankan Aplikasi:**
   ```bash
   bun run index.ts
   ```
   Server akan berjalan di `http://localhost:3000`.

---

## 📖 Dokumentasi API untuk Frontend

Dokumentasi lengkap mengenai endpoint, format payload request, dan contoh response dapat dilihat di:
👉 **[API_DOCS.md](./API_DOCS.md)**
