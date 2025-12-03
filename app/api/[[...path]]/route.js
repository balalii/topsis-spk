import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URL;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = await MongoClient.connect(uri);
  cachedClient = client;
  return client;
}

// Fungsi TOPSIS
class TOPSISCalculator {
  constructor(alternatives, criteria, weights, criteriaTypes) {
    this.alternatives = alternatives; // Array of objects with criteria values
    this.criteria = criteria; // Array of criteria names
    this.weights = weights; // Array of weights (should sum to 1)
    this.criteriaTypes = criteriaTypes; // Array of 'benefit' or 'cost'
  }

  // Step 1: Normalisasi matriks keputusan
  normalize() {
    const normalized = [];
    const n = this.alternatives.length;
    const m = this.criteria.length;

    // Hitung akar jumlah kuadrat untuk setiap kriteria
    const sqrtSums = new Array(m).fill(0);
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const value = this.alternatives[i].values[j];
        sum += value * value;
      }
      sqrtSums[j] = Math.sqrt(sum);
    }

    // Normalisasi setiap elemen
    for (let i = 0; i < n; i++) {
      const normalizedRow = [];
      for (let j = 0; j < m; j++) {
        const value = this.alternatives[i].values[j];
        normalizedRow.push(value / sqrtSums[j]);
      }
      normalized.push(normalizedRow);
    }

    return normalized;
  }

  // Step 2: Pembobotan matriks ternormalisasi
  weightedNormalize(normalized) {
    const weighted = [];
    for (let i = 0; i < normalized.length; i++) {
      const weightedRow = [];
      for (let j = 0; j < normalized[i].length; j++) {
        weightedRow.push(normalized[i][j] * this.weights[j]);
      }
      weighted.push(weightedRow);
    }
    return weighted;
  }

  // Step 3: Menentukan solusi ideal positif dan negatif
  findIdealSolutions(weighted) {
    const m = this.criteria.length;
    const idealPositive = [];
    const idealNegative = [];

    for (let j = 0; j < m; j++) {
      const column = weighted.map((row) => row[j]);
      if (this.criteriaTypes[j] === 'benefit') {
        idealPositive.push(Math.max(...column));
        idealNegative.push(Math.min(...column));
      } else {
        // cost
        idealPositive.push(Math.min(...column));
        idealNegative.push(Math.max(...column));
      }
    }

    return { idealPositive, idealNegative };
  }

  // Step 4: Menghitung jarak dari solusi ideal
  calculateDistances(weighted, idealPositive, idealNegative) {
    const distances = [];

    for (let i = 0; i < weighted.length; i++) {
      let distancePositive = 0;
      let distanceNegative = 0;

      for (let j = 0; j < weighted[i].length; j++) {
        distancePositive += Math.pow(weighted[i][j] - idealPositive[j], 2);
        distanceNegative += Math.pow(weighted[i][j] - idealNegative[j], 2);
      }

      distances.push({
        positive: Math.sqrt(distancePositive),
        negative: Math.sqrt(distanceNegative),
      });
    }

    return distances;
  }

  // Step 5: Menghitung nilai preferensi
  calculatePreference(distances) {
    return distances.map((d) => {
      return d.negative / (d.positive + d.negative);
    });
  }

  // Proses lengkap TOPSIS
  calculate() {
    const normalized = this.normalize();
    const weighted = this.weightedNormalize(normalized);
    const { idealPositive, idealNegative } = this.findIdealSolutions(weighted);
    const distances = this.calculateDistances(weighted, idealPositive, idealNegative);
    const preferences = this.calculatePreference(distances);

    // Buat hasil dengan ranking
    const results = this.alternatives.map((alt, index) => ({
      ...alt,
      normalized: normalized[index],
      weighted: weighted[index],
      distancePositive: distances[index].positive,
      distanceNegative: distances[index].negative,
      preference: preferences[index],
    }));

    // Sort berdasarkan preference (descending)
    results.sort((a, b) => b.preference - a.preference);

    // Tambahkan ranking
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return {
      results,
      idealPositive,
      idealNegative,
      normalized,
      weighted,
    };
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');

    const client = await connectToDatabase();
    const db = client.db('topsis_kos');

    // GET /api/kos - Get all kos
    if (path === 'kos' || path === '') {
      const kos = await db.collection('kos').find({}).toArray();
      return NextResponse.json({ success: true, data: kos });
    }

    // GET /api/kos/:id - Get single kos
    if (path.startsWith('kos/')) {
      const id = path.split('/')[1];
      const kos = await db.collection('kos').findOne({ id });
      if (!kos) {
        return NextResponse.json({ success: false, error: 'Kos tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: kos });
    }

    // GET /api/calculations - Get calculation history
    if (path === 'calculations') {
      const calculations = await db.collection('calculations').find({}).sort({ createdAt: -1 }).limit(10).toArray();
      return NextResponse.json({ success: true, data: calculations });
    }

    return NextResponse.json({ success: false, error: 'Endpoint tidak ditemukan' }, { status: 404 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');

    // Handle seed endpoint without body
    if (path === 'seed') {
      const client = await connectToDatabase();
      const db = client.db('topsis_kos');

      const sampleKos = [
        {
          id: 'kos_001',
          nama: 'Kos Mahasiswa Sejahtera',
          alamat: 'Jl. Sudirman No. 123',
          harga: 1500000,
          jarak: 0.5,
          fasilitas: 8,
          keamanan: 9,
          kebersihan: 8,
          deskripsi: 'Kos nyaman dengan fasilitas lengkap, dekat kampus',
          foto: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
          createdAt: new Date(),
        },
        {
          id: 'kos_002',
          nama: 'Kos Ekonomis Pratama',
          alamat: 'Jl. Gatot Subroto No. 45',
          harga: 800000,
          jarak: 2.5,
          fasilitas: 6,
          keamanan: 7,
          kebersihan: 7,
          deskripsi: 'Kos murah dan terjangkau untuk mahasiswa',
          foto: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
          createdAt: new Date(),
        },
        {
          id: 'kos_003',
          nama: 'Kos Elite Premium',
          alamat: 'Jl. Thamrin No. 78',
          harga: 2500000,
          jarak: 1.0,
          fasilitas: 10,
          keamanan: 10,
          kebersihan: 10,
          deskripsi: 'Kos mewah dengan fasilitas bintang 5',
          foto: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
          createdAt: new Date(),
        },
        {
          id: 'kos_004',
          nama: 'Kos Harmoni',
          alamat: 'Jl. Diponegoro No. 22',
          harga: 1200000,
          jarak: 1.5,
          fasilitas: 7,
          keamanan: 8,
          kebersihan: 8,
          deskripsi: 'Kos dengan suasana nyaman dan tenang',
          foto: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
          createdAt: new Date(),
        },
        {
          id: 'kos_005',
          nama: 'Kos Simpel Ceria',
          alamat: 'Jl. Ahmad Yani No. 88',
          harga: 950000,
          jarak: 3.0,
          fasilitas: 5,
          keamanan: 6,
          kebersihan: 6,
          deskripsi: 'Kos sederhana dengan harga terjangkau',
          foto: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400',
          createdAt: new Date(),
        },
      ];

      // Clear existing data
      await db.collection('kos').deleteMany({});
      await db.collection('calculations').deleteMany({});

      // Insert sample data
      await db.collection('kos').insertMany(sampleKos);

      return NextResponse.json({ success: true, message: 'Sample data berhasil ditambahkan', count: sampleKos.length });
    }

    const body = await request.json();

    const client = await connectToDatabase();
    const db = client.db('topsis_kos');

    // POST /api/kos - Create new kos
    if (path === 'kos') {
      const { nama, alamat, harga, jarak, fasilitas, keamanan, kebersihan, deskripsi, foto } = body;

      if (!nama || !harga || !jarak || !fasilitas || !keamanan || !kebersihan) {
        return NextResponse.json({ success: false, error: 'Data tidak lengkap' }, { status: 400 });
      }

      const newKos = {
        id: `kos_${Date.now()}`,
        nama,
        alamat: alamat || '',
        harga: parseFloat(harga),
        jarak: parseFloat(jarak),
        fasilitas: parseFloat(fasilitas),
        keamanan: parseFloat(keamanan),
        kebersihan: parseFloat(kebersihan),
        deskripsi: deskripsi || '',
        foto: foto || '',
        createdAt: new Date(),
      };

      await db.collection('kos').insertOne(newKos);
      return NextResponse.json({ success: true, data: newKos });
    }

    // POST /api/calculate - Calculate TOPSIS
    if (path === 'calculate') {
      const { weights } = body;

      if (!weights || !weights.harga || !weights.jarak || !weights.fasilitas || !weights.keamanan || !weights.kebersihan) {
        return NextResponse.json({ success: false, error: 'Bobot tidak lengkap' }, { status: 400 });
      }

      // Validasi total bobot harus 100%
      const totalWeight = weights.harga + weights.jarak + weights.fasilitas + weights.keamanan + weights.kebersihan;
      if (Math.abs(totalWeight - 100) > 0.01) {
        return NextResponse.json({ success: false, error: 'Total bobot harus 100%' }, { status: 400 });
      }

      // Get all kos data
      const allKos = await db.collection('kos').find({}).toArray();

      if (allKos.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada data kos untuk dihitung' }, { status: 400 });
      }

      // Prepare data for TOPSIS
      const alternatives = allKos.map((kos) => ({
        id: kos.id,
        nama: kos.nama,
        alamat: kos.alamat,
        foto: kos.foto,
        values: [kos.harga, kos.jarak, kos.fasilitas, kos.keamanan, kos.kebersihan],
      }));

      const criteria = ['Harga', 'Jarak', 'Fasilitas', 'Keamanan', 'Kebersihan'];
      const weightArray = [weights.harga / 100, weights.jarak / 100, weights.fasilitas / 100, weights.keamanan / 100, weights.kebersihan / 100];
      const criteriaTypes = ['cost', 'cost', 'benefit', 'benefit', 'benefit'];

      // Calculate TOPSIS
      const topsis = new TOPSISCalculator(alternatives, criteria, weightArray, criteriaTypes);
      const result = topsis.calculate();

      // Save calculation to database
      const calculation = {
        id: `calc_${Date.now()}`,
        weights: weights,
        results: result.results,
        idealPositive: result.idealPositive,
        idealNegative: result.idealNegative,
        createdAt: new Date(),
      };

      await db.collection('calculations').insertOne(calculation);

      return NextResponse.json({ success: true, data: result });
    }

    // POST /api/seed - Seed sample data
    if (path === 'seed') {
      const sampleKos = [
        {
          id: 'kos_001',
          nama: 'Kos Mahasiswa Sejahtera',
          alamat: 'Jl. Sudirman No. 123',
          harga: 1500000,
          jarak: 0.5,
          fasilitas: 8,
          keamanan: 9,
          kebersihan: 8,
          deskripsi: 'Kos nyaman dengan fasilitas lengkap, dekat kampus',
          foto: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
          createdAt: new Date(),
        },
        {
          id: 'kos_002',
          nama: 'Kos Ekonomis Pratama',
          alamat: 'Jl. Gatot Subroto No. 45',
          harga: 800000,
          jarak: 2.5,
          fasilitas: 6,
          keamanan: 7,
          kebersihan: 7,
          deskripsi: 'Kos murah dan terjangkau untuk mahasiswa',
          foto: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
          createdAt: new Date(),
        },
        {
          id: 'kos_003',
          nama: 'Kos Elite Premium',
          alamat: 'Jl. Thamrin No. 78',
          harga: 2500000,
          jarak: 1.0,
          fasilitas: 10,
          keamanan: 10,
          kebersihan: 10,
          deskripsi: 'Kos mewah dengan fasilitas bintang 5',
          foto: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
          createdAt: new Date(),
        },
        {
          id: 'kos_004',
          nama: 'Kos Harmoni',
          alamat: 'Jl. Diponegoro No. 22',
          harga: 1200000,
          jarak: 1.5,
          fasilitas: 7,
          keamanan: 8,
          kebersihan: 8,
          deskripsi: 'Kos dengan suasana nyaman dan tenang',
          foto: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
          createdAt: new Date(),
        },
        {
          id: 'kos_005',
          nama: 'Kos Simpel Ceria',
          alamat: 'Jl. Ahmad Yani No. 88',
          harga: 950000,
          jarak: 3.0,
          fasilitas: 5,
          keamanan: 6,
          kebersihan: 6,
          deskripsi: 'Kos sederhana dengan harga terjangkau',
          foto: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400',
          createdAt: new Date(),
        },
      ];

      // Clear existing data
      await db.collection('kos').deleteMany({});
      await db.collection('calculations').deleteMany({});

      // Insert sample data
      await db.collection('kos').insertMany(sampleKos);

      return NextResponse.json({ success: true, message: 'Sample data berhasil ditambahkan', count: sampleKos.length });
    }

    return NextResponse.json({ success: false, error: 'Endpoint tidak ditemukan' }, { status: 404 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    const body = await request.json();

    const client = await connectToDatabase();
    const db = client.db('topsis_kos');

    // PUT /api/kos/:id - Update kos
    if (path.startsWith('kos/')) {
      const id = path.split('/')[1];
      const { nama, alamat, harga, jarak, fasilitas, keamanan, kebersihan, deskripsi, foto } = body;

      const updateData = {};
      if (nama) updateData.nama = nama;
      if (alamat !== undefined) updateData.alamat = alamat;
      if (harga !== undefined) updateData.harga = parseFloat(harga);
      if (jarak !== undefined) updateData.jarak = parseFloat(jarak);
      if (fasilitas !== undefined) updateData.fasilitas = parseFloat(fasilitas);
      if (keamanan !== undefined) updateData.keamanan = parseFloat(keamanan);
      if (kebersihan !== undefined) updateData.kebersihan = parseFloat(kebersihan);
      if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
      if (foto !== undefined) updateData.foto = foto;
      updateData.updatedAt = new Date();

      const result = await db.collection('kos').updateOne({ id }, { $set: updateData });

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Kos tidak ditemukan' }, { status: 404 });
      }

      const updatedKos = await db.collection('kos').findOne({ id });
      return NextResponse.json({ success: true, data: updatedKos });
    }

    return NextResponse.json({ success: false, error: 'Endpoint tidak ditemukan' }, { status: 404 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');

    const client = await connectToDatabase();
    const db = client.db('topsis_kos');

    // DELETE /api/kos/:id - Delete kos
    if (path.startsWith('kos/')) {
      const id = path.split('/')[1];
      const result = await db.collection('kos').deleteOne({ id });

      if (result.deletedCount === 0) {
        return NextResponse.json({ success: false, error: 'Kos tidak ditemukan' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Kos berhasil dihapus' });
    }

    return NextResponse.json({ success: false, error: 'Endpoint tidak ditemukan' }, { status: 404 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
