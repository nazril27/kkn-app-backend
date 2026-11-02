# 📖 Dokumentasi API - KKN App Backend

Dokumentasi ini ditujukan untuk tim **Frontend** sebagai panduan integrasi API.

---

## 🌐 Base URL

- **Lokal:** `http://localhost:3000`
- **Produksi (Vercel):** `https://kkn-app-backend.vercel.app`

Semua request dengan payload body **wajib** menyertakan header:
```http
Content-Type: application/json
```

> **Catatan Autentikasi Saat Ini:**  
> Backend saat ini **belum menerapkan token (JWT/Session)**.  
> Data login/register langsung mengembalikan profil user yang bisa disimpan di state / `localStorage` frontend untuk sementara.

---

## 📦 Format Respon Standar

### Respon Sukses
```json
{
  "success": true,
  "message": "Pesan deskriptif sukses",
  "data": { ... } // Atau array [ ... ]
}
```

### Respon Error
```json
{
  "success": false,
  "message": "Pesan deskriptif error"
}
```

---

## 1. 🔐 Modul Autentikasi (`/auth`)

### a. Register User Baru
- **Endpoint:** `POST /auth/register`
- **Request Body:**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `name` | `string` | Ya | Nama lengkap |
  | `nim` | `string` | Ya | Nomor Induk Mahasiswa (harus unik) |
  | `password` | `string` | Ya | Minimal 1 karakter |
  | `email` | `string` | Tidak | Opsional (harus unik jika diisi) |

- **Contoh Body:**
  ```json
  {
    "name": "Budi Santoso",
    "nim": "1234567890",
    "password": "password123",
    "email": "budi@example.com"
  }
  ```
- **Response `201 Created`:**
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
- **Response Error (`400 Bad Request`):** Jika NIM atau email sudah terdaftar.

---

### b. Login User
- **Endpoint:** `POST /auth/login`
- **Catatan:** Bisa login menggunakan `identifier` (bisa diisi email atau NIM), atau langsung lewat field `email` / `nim`.
- **Request Body:**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `identifier` | `string` | Ya* | Email ATAU NIM |
  | `password` | `string` | Ya | Password pengguna |
  | `email` | `string` | Alternatif | Bisa dipakai jika tidak memakai `identifier` |
  | `nim` | `string` | Alternatif | Bisa dipakai jika tidak memakai `identifier` |

- **Contoh Body:**
  ```json
  {
    "identifier": "1234567890",
    "password": "password123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Login successful",
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
- **Response Error (`401 Unauthorized`):** Jika email/NIM atau password salah.

---

### c. Logout
- **Endpoint:** `POST /auth/logout`
- **Request Body:** `{}` (kosong)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

---

## 2. 🏠 Modul Data Rumah (`/houses`)

### a. Tambah Data Rumah
- **Endpoint:** `POST /houses`
- **Request Body:**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `rt` | `string` | Ya | Nomor RT (contoh: `"01"`, `"02"`) |
  | `headOfFamilyName` | `string` | Ya | Nama Kepala Keluarga |
  | `numberOfFamilyMembers` | `number` \| `string` | Ya | Jumlah anggota keluarga |
  | `isSortingWaste` | `string` | Ya | Pilihan: `"ya"`, `"tidak"`, `"sebagian"` |
  | `streetName` | `string` | Tidak | Nama jalan atau gang |
  | `houseNumber` | `string` \| `number` | Tidak | Nomor rumah |
  | `userId` | `number` | Tidak | ID user/mahasiswa pendata (jika ada) |

- **Contoh Body:**
  ```json
  {
    "rt": "02",
    "headOfFamilyName": "Bambang Pamungkas",
    "numberOfFamilyMembers": 4,
    "isSortingWaste": "ya",
    "streetName": "Gang Mawar",
    "houseNumber": "05"
  }
  ```
- **Response `201 Created`:**
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
      "userId": null,
      "createdAt": "2026-11-02T15:47:40.596Z",
      "updatedAt": "2026-11-02T15:47:40.596Z"
    }
  }
  ```

---

### b. Ambil Semua Data Rumah
- **Endpoint:** `GET /houses`
- **Response `200 OK`:** (Menyertakan relasi `user` pendata, bernilai `null` jika tidak ada)
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
    ]
  }
  ```

---

### c. Ambil Detail Rumah Berdasarkan ID
- **Endpoint:** `GET /houses/:id`
- **Parameter URL:** `id` (integer)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "House retrieved successfully",
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
- **Response Error (`404 Not Found`):**
  ```json
  {
    "success": false,
    "message": "House with ID 999 not found"
  }
  ```

---

## 3. 🗑️ Modul Pencatatan Sampah (`/wastes`)

### a. Tambah Pencatatan Sampah
- **Endpoint:** `POST /wastes`
- **Request Body:**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `weight` | `number` \| `string` | Ya | Berat sampah dalam kg (contoh: `3.75` atau `"3.75"`) |
  | `typesOfWaste` | `string` | Ya | Kategori sampah (misal: `"organik"`, `"nonorganik"`, `"residu"`) |
  | `houseId` | `number` | Tidak | ID rumah terkait |
  | `userId` | `number` | Tidak | ID user/mahasiswa pencatat |

- **Contoh Body:**
  ```json
  {
    "weight": 3.75,
    "typesOfWaste": "organik",
    "houseId": 1
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Waste record created successfully",
    "data": {
      "id": 1,
      "userId": null,
      "houseId": 1,
      "weight": "3.75",
      "typesOfWaste": "organik",
      "createdAt": "2026-11-02T15:32:58.453Z",
      "updatedAt": "2026-11-02T15:32:58.453Z"
    }
  }
  ```

---

### b. Ambil Semua Data Pencatatan Sampah
- **Endpoint:** `GET /wastes`
- **Response `200 OK`:** (Menyertakan relasi `house` dan `user`)
  ```json
  {
    "success": true,
    "message": "Waste records retrieved successfully",
    "data": [
      {
        "id": 1,
        "weight": "3.75",
        "typesOfWaste": "organik",
        "userId": 1,
        "houseId": 2,
        "createdAt": "2026-11-02T15:32:58.453Z",
        "updatedAt": "2026-11-02T15:32:58.453Z",
        "user": {
          "id": 1,
          "name": "Budi Santoso",
          "email": "budi@example.com",
          "nim": "1234567890"
        },
        "house": {
          "id": 2,
          "streetName": "Gang Mawar",
          "houseNumber": "05",
          "rt": "02",
          "headOfFamilyName": "Bambang Pamungkas",
          "numberOfFamilyMembers": "4",
          "isSortingWaste": "ya"
        }
      }
    ]
  }
  ```

---

### c. Ambil Detail Sampah Berdasarkan ID
- **Endpoint:** `GET /wastes/:id`
- **Parameter URL:** `id` (integer)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Waste record retrieved successfully",
    "data": {
      "id": 1,
      "weight": "3.75",
      "typesOfWaste": "organik",
      "userId": 1,
      "houseId": 2,
      "createdAt": "2026-11-02T15:32:58.453Z",
      "updatedAt": "2026-11-02T15:32:58.453Z",
      "user": {
        "id": 1,
        "name": "Budi Santoso",
        "email": "budi@example.com",
        "nim": "1234567890"
      },
      "house": {
        "id": 2,
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
- **Response Error (`404 Not Found`):**
  ```json
  {
    "success": false,
    "message": "Waste record with ID 999 not found"
  }
  ```

---

## 🚦 Ringkasan Status Code HTTP

| Status Code | Arti | Keterangan |
| :--- | :--- | :--- |
| `200 OK` | Sukses | Request GET berhasil, atau proses login/logout sukses |
| `201 Created` | Berhasil Dibuat | Data baru berhasil disimpan (Register, House, Waste) |
| `400 Bad Request` | Permintaan Tidak Sah | Validasi bisnis gagal (misal duplikasi NIM/Email) |
| `401 Unauthorized` | Autentikasi Gagal | Password atau NIM/Email salah saat login |
| `404 Not Found` | Data Tidak Ditemukan | ID rumah atau ID sampah tidak ada di database |
| `422 Unprocessable` | Format Schema Salah | Ada field wajib yang kosong atau tipe data tidak sesuai |
