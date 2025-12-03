# Database Scripts - Sistem Pakar TOPSIS

Kumpulan script untuk manajemen database MongoDB.

---

## 📋 Daftar Script

### 1. Reset Database (`reset-db.js`)

Script untuk mereset database dan mengisi ulang dengan sample data.

**Fitur:**
- ✅ Menghapus semua data dari collection `kos` dan `calculations`
- ✅ Memasukkan 8 sample data kos baru (lebih banyak dari sebelumnya)
- ✅ Menampilkan summary lengkap hasil seeding
- ✅ Konfirmasi sebelum eksekusi (opsional)
- ✅ Output berwarna untuk kemudahan pembacaan

---

## 🚀 Cara Penggunaan

### Opsi 1: Dengan Konfirmasi (Recommended)

```bash
yarn reset-db
```

atau

```bash
node scripts/reset-db.js
```

Script akan menanyakan konfirmasi sebelum menghapus data:
```
⚠️  WARNING: This will DELETE ALL data in the database!
Are you sure you want to continue? (yes/no):
```

Ketik `yes` atau `y` untuk melanjutkan.

---

### Opsi 2: Tanpa Konfirmasi (Force)

```bash
yarn reset-db:force
```

atau

```bash
node scripts/reset-db.js --force
```

Script akan langsung menjalankan reset tanpa konfirmasi. **Gunakan dengan hati-hati!**

---

### Opsi 3: Alias untuk Seeding

```bash
yarn seed
```

Sama dengan `yarn reset-db:force` - langsung seed tanpa konfirmasi.

---

## 📊 Output Script

Contoh output saat menjalankan script:

```
============================================================
  DATABASE RESET & SEED SCRIPT
  Sistem Pakar Pemilihan Kos - TOPSIS
============================================================

ℹ️  Connecting to MongoDB...
ℹ️  MongoDB URL: mongodb://localhost:27017
ℹ️  Database: topsis_kos

✅ Connected to MongoDB successfully!

📦 Step 1: Clearing existing data...
ℹ️     Deleted 5 documents from 'kos' collection
ℹ️     Deleted 2 documents from 'calculations' collection

✅ All existing data cleared!

🌱 Step 2: Seeding sample data...
ℹ️     Inserted 8 kos records

✅ Sample data seeded successfully!

📊 Step 3: Database Summary
────────────────────────────────────────────────────────────
ℹ️  Total Kos in Database: 8

Kos List:
   1. Kos Mahasiswa Sejahtera
      Harga: Rp 1.500.000
      Jarak: 0.5 km
      Skor: Fasilitas=8, Keamanan=9, Kebersihan=8

   2. Kos Ekonomis Pratama
      Harga: Rp 800.000
      Jarak: 2.5 km
      Skor: Fasilitas=6, Keamanan=7, Kebersihan=7

   ... (dan seterusnya)

────────────────────────────────────────────────────────────

✨ Database reset completed successfully!

ℹ️  You can now access the application at: http://localhost:3000
ℹ️  API endpoint to test: curl http://localhost:3000/api/kos
```

---

## 📁 Struktur File

```
scripts/
├── README.md          # Dokumentasi ini
├── reset-db.js        # Script reset database
└── seed-data.js       # Data sample untuk seeding
```

---

## 🎯 Kapan Menggunakan Script Ini?

### Development
- ✅ Reset database saat development untuk testing
- ✅ Menambah sample data baru
- ✅ Testing perhitungan TOPSIS dengan data fresh

### Testing
- ✅ Setup environment testing dengan data konsisten
- ✅ Reset sebelum automated testing
- ✅ Benchmarking performa dengan dataset tetap

### Production (Hati-hati!)
- ⚠️  **JANGAN** gunakan di production tanpa backup!
- ⚠️  Selalu backup database sebelum reset
- ⚠️  Gunakan flag `--force` hanya jika yakin 100%

---

## 🔧 Konfigurasi

Script menggunakan environment variables dari file `.env`:

```env
MONGO_URL=mongodb://localhost:27017
```

Database name: `topsis_kos` (hardcoded di script)

---

## 🛠 Customisasi Sample Data

Edit file `seed-data.js` untuk menambah/mengubah sample data:

```javascript
const sampleKos = [
  {
    id: 'kos_xxx',
    nama: 'Nama Kos Baru',
    alamat: 'Alamat Lengkap',
    harga: 1000000,
    jarak: 1.5,
    fasilitas: 8,
    keamanan: 9,
    kebersihan: 8,
    deskripsi: 'Deskripsi kos',
    foto: 'https://example.com/image.jpg',
    createdAt: new Date()
  },
  // Tambahkan data lainnya...
];
```

---

## 📝 Sample Data Default

Script akan memasukkan **8 data kos** dengan karakteristik beragam:

1. **Kos Mahasiswa Sejahtera** - Menengah ke atas, dekat kampus
2. **Kos Ekonomis Pratama** - Budget friendly, agak jauh
3. **Kos Elite Premium** - Mewah, harga tinggi
4. **Kos Harmoni** - Balanced, semua aspek baik
5. **Kos Simpel Ceria** - Budget, jarak jauh
6. **Kos Pelajar Mandiri** - Strategis untuk pelajar
7. **Kos Green Valley** - Premium, lingkungan hijau
8. **Kos Budget Friendly** - Paling murah, paling jauh

---

## ⚠️ Troubleshooting

### Error: Cannot find module 'dotenv'

```bash
yarn add dotenv
```

### Error: Connection timeout

Pastikan MongoDB sudah running:
```bash
sudo supervisorctl status mongodb
```

Jika belum running:
```bash
sudo supervisorctl start mongodb
```

### Error: ECONNREFUSED

Cek apakah MongoDB berjalan di port yang benar:
```bash
mongo --eval "db.version()"
```

### Error: Permission denied

Pastikan file script executable:
```bash
chmod +x scripts/reset-db.js
```

---

## 📚 Referensi

- **MongoDB Client**: https://mongodb.github.io/node-mongodb-native/
- **Node.js Scripts**: https://docs.npmjs.com/cli/v8/using-npm/scripts
- **ANSI Colors**: Terminal output coloring untuk better UX

---

## 🔗 Related Commands

```bash
# Lihat semua data kos via API
curl http://localhost:3000/api/kos

# Lihat data langsung dari MongoDB
mongo topsis_kos --eval "db.kos.find().pretty()"

# Count documents
mongo topsis_kos --eval "db.kos.count()"

# Drop entire database (DANGER!)
mongo topsis_kos --eval "db.dropDatabase()"
```

---

## 📄 License

Part of Sistem Pakar Pemilihan Kos - TOPSIS Application

---

**Happy Coding! 🚀**
