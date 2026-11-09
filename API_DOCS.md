# Dokumentasi API — KKN App Backend

Panduan integrasi untuk frontend.

## Base URL

- Lokal: `http://localhost:3000`
- Produksi (Vercel): `https://kkn-app-backend.vercel.app`

Request dengan body wajib memakai:

```http
Content-Type: application/json
```

Autentikasi JWT/session **belum** diterapkan. Register/login mengembalikan profil user (tanpa password). Simpan di state atau `localStorage` jika dibutuhkan. Endpoint houses, wastes, dan **dashboard publik** bisa dipanggil tanpa token.

---

## Format response

### Sukses (satu resource)

```json
{
  "success": true,
  "message": "Pesan deskriptif",
  "data": { }
}
```

### Sukses (list + paginasi)

```json
{
  "success": true,
  "message": "Pesan deskriptif",
  "data": [],
  "total": 25,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3
}
```

### Error

```json
{
  "success": false,
  "message": "Pesan deskriptif error"
}
```

Validasi schema Elysia (tipe salah, field wajib kosong, enum tidak valid) biasanya mengembalikan **422** dengan format error Elysia, bukan `{ success, message }`.

---

## Paginasi

Berlaku untuk `GET /houses` dan `GET /wastes`.

| Query | Tipe | Default | Keterangan |
| :--- | :--- | :--- | :--- |
| `page` | number | `1` | Halaman, minimum 1 |
| `pageSize` | number | `10` | Jumlah item per halaman, maksimum **100** |

Nilai `page` / `pageSize` yang tidak valid (0, negatif, bukan angka) dikembalikan ke default. `pageSize` di atas 100 dipotong menjadi 100.

Contoh: `GET /houses?page=2&pageSize=20`

---

## Enum & aturan field

| Field | Nilai yang diterima |
| :--- | :--- |
| `isSortingWaste` | `"ya"` \| `"tidak"` \| `"sebagian"` |
| `typesOfWaste` | `"organik"` \| `"nonorganik"` \| `"residu"` \| `"lainnya"` |
| `numberOfFamilyMembers` | integer positif (`1`, `2`, …). String `"4"` juga diterima. Disimpan sebagai string. |
| `weight` | angka ≥ 0. String `"3.75"` juga diterima. Disimpan sebagai string desimal. |
| `rt` | string 1–5 karakter |
| `headOfFamilyName` | string 1–255 karakter |
| `streetName` | opsional, max 255. String kosong jadi `null`. |
| `houseNumber` | opsional, max 5 karakter. String kosong jadi `null`. |
| `userId` / `houseId` | opsional. `null` menghapus relasi. ID yang tidak ada → **422**. |

Relasi nested:

- Ada relasi → objek (`user` / `house`)
- Tidak ada relasi → `null` (bukan `{ "id": null, ... }`)

---

## 1. Auth (`/auth`)

Tidak ada CRUD user di HTTP. Hanya register, login, dan logout stub.

### `POST /auth/register`

| Field | Tipe | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `name` | string | Ya | Nama lengkap |
| `nim` | string | Ya | Unik |
| `password` | string | Ya | Minimal 1 karakter (di-hash di server) |
| `email` | string \| null | Tidak | Unik jika diisi |

```json
{
  "name": "Budi Santoso",
  "nim": "1234567890",
  "password": "password123",
  "email": "budi@example.com"
}
```

**201**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "nim": "1234567890",
    "createdAt": "2026-11-02T15:24:13.887Z",
    "updatedAt": "2026-11-02T15:24:13.887Z"
  }
}
```

Password tidak pernah dikembalikan.

- **409** — NIM atau email sudah terdaftar
- **400** — field wajib kosong

### `POST /auth/login`

Isi salah satu: `identifier` (email atau NIM), `email`, atau `nim`, plus `password`.

```json
{
  "identifier": "1234567890",
  "password": "password123"
}
```

**200** — body `data` sama seperti register (profil tanpa password).

- **400** — identifier tidak dikirim
- **401** — email/NIM atau password salah

### `POST /auth/logout`

Body kosong. **200** `{ "success": true, "message": "Logout successful" }`.

Karena belum ada session/JWT, endpoint ini hanya konfirmasi di sisi client (hapus state lokal).

---

## 2. Rumah (`/houses`)

Create/update/get by id mengembalikan rumah **plus** `user` (pendata).

### `POST /houses`

Mendukung `application/json` (jika tanpa upload gambar) maupun `multipart/form-data` (jika menyertakan file gambar atau tanpa gambar).

| Field | Tipe | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `rt` | string | Ya | Maksimal 5 karakter |
| `headOfFamilyName` | string | Ya | Maksimal 255 karakter |
| `numberOfFamilyMembers` | number \| string | Ya | Jumlah anggota keluarga |
| `isSortingWaste` | `"ya"` \| `"tidak"` \| `"sebagian"` | Ya | Status pemilahan sampah |
| `streetName` | string \| null | Tidak | Nama jalan / gang |
| `houseNumber` | string \| number \| null | Tidak | Nomor rumah |
| `userId` | number \| null | Tidak | ID mahasiswa/pendata |
| `file` | file (binary) | Tidak | Foto rumah (`jpeg`, `png`, `webp`, maks 5MB) |

**Contoh Payload JSON (Tanpa Gambar):**
```json
{
  "rt": "02",
  "headOfFamilyName": "Bambang Pamungkas",
  "numberOfFamilyMembers": 4,
  "isSortingWaste": "ya",
  "streetName": "Gang Mawar",
  "houseNumber": "05",
  "userId": 1
}
```

**Contoh Payload FormData (Dengan Gambar Opsional):**
```ts
const formData = new FormData();
formData.append("rt", "02");
formData.append("headOfFamilyName", "Bambang Pamungkas");
formData.append("numberOfFamilyMembers", "4");
formData.append("isSortingWaste", "ya");
formData.append("streetName", "Gang Mawar");
formData.append("houseNumber", "05");
formData.append("userId", "1");
if (selectedFile) {
  formData.append("file", selectedFile);
}
```

**201**

```json
{
  "success": true,
  "message": "House created successfully",
  "data": {
    "id": 1,
    "streetName": "Gang Mawar",
    "houseNumber": "05",
    "rt": "02",
    "headOfFamilyName": "Bambang Pamungkas",
    "numberOfFamilyMembers": "4",
    "isSortingWaste": "ya",
    "userId": 1,
    "createdAt": "2026-11-02T15:47:40.596Z",
    "updatedAt": "2026-11-02T15:47:40.596Z",
    "user": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "nim": "1234567890"
    }
  }
}
```

Tanpa `userId`, field `user` bernilai `null`.

- **400** — jumlah anggota keluarga bukan integer positif, `houseNumber` > 5 karakter
- **422** — `userId` tidak ditemukan

### `GET /houses`

Query: `page`, `pageSize`. Diurutkan `createdAt` descending.

**200**

```json
{
  "success": true,
  "message": "Houses retrieved successfully",
  "data": [
    {
      "id": 1,
      "streetName": "Gang Mawar",
      "houseNumber": "05",
      "rt": "02",
      "headOfFamilyName": "Bambang Pamungkas",
      "numberOfFamilyMembers": "4",
      "isSortingWaste": "ya",
      "userId": 1,
      "createdAt": "2026-11-02T15:47:40.596Z",
      "updatedAt": "2026-11-02T15:47:40.596Z",
      "user": {
        "id": 1,
        "name": "Budi Santoso",
        "email": "budi@example.com",
        "nim": "1234567890"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

### `GET /houses/:id`

`:id` harus angka ≥ 1.

**200** — satu objek di `data` (bentuk sama seperti item list).

**404** — `House with ID {id} not found`

### `PATCH /houses/:id`

Partial update. Kirim hanya field yang berubah. String wajib (`rt`, `headOfFamilyName`) tidak boleh kosong jika dikirim.
Mendukung `application/json` maupun `multipart/form-data`.
Bisa menyertakan field `file` (gambar) untuk mengganti foto rumah yang sudah ada. Gambar lama di Cloudinary akan otomatis dihapus dan digantikan gambar baru.

`userId: null` melepas relasi pendata.

**200** — `House updated successfully`, `data` lengkap termasuk `user` dan link `imageUrl`.

- **404** — rumah tidak ada
- **400** / **422** — sama seperti create

### `DELETE /houses/:id`

Menghapus data rumah sekaligus menghapus file foto rumah dari Cloudinary secara otomatis jika sebelumnya memiliki gambar.

**200** `{ "success": true, "message": "House deleted successfully" }`

- **404** — rumah tidak ada
- **409** — masih ada pencatatan sampah yang merujuk rumah ini. Hapus (atau pindahkan) data wastes dulu.

```json
{
  "success": false,
  "message": "Cannot delete house 1 because waste records still reference it."
}
```

---

## 3. Sampah (`/wastes`)

Create/update/get mengembalikan record **plus** `user` dan `house`.

### `POST /wastes`

| Field | Tipe | Wajib |
| :--- | :--- | :--- |
| `weight` | number \| string | Ya (≥ 0) |
| `typesOfWaste` | `"organik"` \| `"nonorganik"` \| `"residu"` \| `"lainnya"` | Ya |
| `houseId` | number \| null | Tidak |
| `userId` | number \| null | Tidak |

```json
{
  "weight": 3.75,
  "typesOfWaste": "organik",
  "houseId": 1,
  "userId": 1
}
```

**201**

```json
{
  "success": true,
  "message": "Waste record created successfully",
  "data": {
    "id": 1,
    "weight": "3.75",
    "typesOfWaste": "organik",
    "userId": 1,
    "houseId": 1,
    "createdAt": "2026-11-02T15:32:58.453Z",
    "updatedAt": "2026-11-02T15:32:58.453Z",
    "user": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "nim": "1234567890"
    },
    "house": {
      "id": 1,
      "streetName": "Gang Mawar",
      "houseNumber": "05",
      "rt": "02",
      "headOfFamilyName": "Bambang Pamungkas",
      "numberOfFamilyMembers": "4",
      "isSortingWaste": "ya"
    }
  }
}
```

- **400** — berat negatif atau bukan angka
- **422** — `userId` atau `houseId` tidak ditemukan

### `GET /wastes`

Query: `page`, `pageSize`. Urutan `createdAt` descending.

**200** — `data` array + `total`, `page`, `pageSize`, `totalPages`. Item sama seperti create (termasuk `user` dan `house`, masing-masing bisa `null`).

### `GET /wastes/:id`

**200** — satu record.

**404** — `Waste record with ID {id} not found`

### `PATCH /wastes/:id`

Partial update. `houseId: null` / `userId: null` melepas relasi.

**200** — `Waste record updated successfully`

- **404** — record tidak ada
- **400** / **422** — sama seperti create

### `DELETE /wastes/:id`

**200** `{ "success": true, "message": "Waste record deleted successfully" }`

**404** — record tidak ada

---

## Status code

| Kode | Kapan |
| :--- | :--- |
| `200` | GET, PATCH, DELETE, login, logout |
| `201` | Register, create house, create waste |
| `400` | Validasi bisnis (berat negatif, jumlah anggota tidak valid, identifier login kosong) |
| `401` | Login gagal |
| `404` | ID rumah/sampah tidak ada |
| `409` | Duplikasi NIM/email, atau hapus rumah yang masih punya data sampah |
| `422` | Schema request salah (Elysia), atau `userId`/`houseId` tidak ada di database |
| `500` | Error server / database |

---

## Health check

`GET /` → `{ "message": "KKN App API is running" }`
