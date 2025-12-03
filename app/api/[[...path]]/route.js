import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Client
// Gunakan Service Role Key untuk akses penuh di sisi server (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- LOGIKA TOPSIS (Tidak Berubah) ---
class TOPSISCalculator {
  constructor(alternatives, criteria, weights, criteriaTypes) {
    this.alternatives = alternatives;
    this.criteria = criteria;
    this.weights = weights;
    this.criteriaTypes = criteriaTypes;
  }

  normalize() {
    const normalized = [];
    const n = this.alternatives.length;
    const m = this.criteria.length;

    const sqrtSums = new Array(m).fill(0);
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const value = this.alternatives[i].values[j];
        sum += value * value;
      }
      sqrtSums[j] = Math.sqrt(sum);
    }

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
        idealPositive.push(Math.min(...column));
        idealNegative.push(Math.max(...column));
      }
    }
    return { idealPositive, idealNegative };
  }

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

  calculatePreference(distances) {
    return distances.map((d) => {
      // Handle division by zero potential
      if (d.positive + d.negative === 0) return 0;
      return d.negative / (d.positive + d.negative);
    });
  }

  calculate() {
    const normalized = this.normalize();
    const weighted = this.weightedNormalize(normalized);
    const { idealPositive, idealNegative } = this.findIdealSolutions(weighted);
    const distances = this.calculateDistances(weighted, idealPositive, idealNegative);
    const preferences = this.calculatePreference(distances);

    const results = this.alternatives.map((alt, index) => ({
      ...alt,
      normalized: normalized[index],
      weighted: weighted[index],
      distancePositive: distances[index].positive,
      distanceNegative: distances[index].negative,
      preference: preferences[index],
    }));

    results.sort((a, b) => b.preference - a.preference);

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

// --- API HANDLERS ---

export async function GET(request) {
  try {
    const url = new URL(request.url);
    // Mengambil path relatif dari API. Sesuaikan logic ini jika routingmu berbeda.
    // Asumsi: request masuk ke /api/[...path] atau sejenisnya.
    // Jika file ini di app/api/topsis/[...slug]/route.js, logic path di bawah perlu disesuaikan.
    // Code di bawah mengikuti logic original user.
    const path = url.pathname.replace('/api/', '');

    // GET /api/kos - Get all kos
    if (path === 'kos' || path === '' || path === 'kos/') {
      const { data: kos, error } = await supabase.from('kos').select('*').order('createdAt', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, data: kos });
    }

    // GET /api/kos/:id - Get single kos
    if (path.startsWith('kos/')) {
      const id = path.split('/')[1];
      const { data: kos, error } = await supabase.from('kos').select('*').eq('id', id).single();

      if (error || !kos) {
        return NextResponse.json({ success: false, error: 'Kos tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: kos });
    }

    // GET /api/calculations - Get calculation history
    if (path === 'calculations') {
      const { data: calculations, error } = await supabase.from('calculations').select('*').order('createdAt', { ascending: false }).limit(10);

      if (error) throw error;
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

    // Handle seed endpoint without body parsing first
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
          createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
        },
      ];

      // Clear existing data
      await supabase.from('kos').delete().neq('id', '0');
      await supabase.from('calculations').delete().neq('id', '0');

      // Insert sample data
      const { error } = await supabase.from('kos').insert(sampleKos);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Sample data berhasil ditambahkan', count: sampleKos.length });
    }

    const body = await request.json();

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
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('kos').insert(newKos).select().single();

      if (error) throw error;
      return NextResponse.json({ success: true, data: data });
    }

    // POST /api/calculate - Calculate TOPSIS
    if (path === 'calculate') {
      const { weights } = body;

      if (!weights || !weights.harga || !weights.jarak || !weights.fasilitas || !weights.keamanan || !weights.kebersihan) {
        return NextResponse.json({ success: false, error: 'Bobot tidak lengkap' }, { status: 400 });
      }

      // Validasi total bobot
      const totalWeight = weights.harga + weights.jarak + weights.fasilitas + weights.keamanan + weights.kebersihan;
      if (Math.abs(totalWeight - 100) > 0.01) {
        return NextResponse.json({ success: false, error: 'Total bobot harus 100%' }, { status: 400 });
      }

      // --- PERBAIKAN DI SINI ---
      // Kita menghapus baris .find() yang salah dan hanya menggunakan .select('*')
      const { data: kosData, error: dbError } = await supabase.from('kos').select('*');

      if (dbError) throw dbError;
      if (!kosData || kosData.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada data kos untuk dihitung' }, { status: 400 });
      }

      // Prepare data for TOPSIS
      const alternatives = kosData.map((kos) => ({
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
        createdAt: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('calculations').insert(calculation);

      if (insertError) throw insertError;

      return NextResponse.json({ success: true, data: result });
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

      // Gunakan ISO string untuk timestamp di Supabase
      updateData.updatedAt = new Date().toISOString();

      const { data, error } = await supabase.from('kos').update(updateData).eq('id', id).select().single();

      if (error || !data) {
        // Jika errornya karena tidak ketemu (biasanya Supabase return empty data, bukan error untuk update no match, tapi kita cek data)
        if (!data && !error) return NextResponse.json({ success: false, error: 'Kos tidak ditemukan' }, { status: 404 });
        throw error;
      }

      return NextResponse.json({ success: true, data: data });
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

    // DELETE /api/kos/:id - Delete kos
    if (path.startsWith('kos/')) {
      const id = path.split('/')[1];

      // Supabase tidak mengembalikan deletedCount secara langsung seperti Mongo
      // Kita gunakan .select() untuk memastikan data ada sebelum dihapus atau setelah dihapus
      const { data, error } = await supabase.from('kos').delete().eq('id', id).select();

      if (error) throw error;

      if (data.length === 0) {
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
