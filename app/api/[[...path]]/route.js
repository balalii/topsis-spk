import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- LOGIKA TOPSIS DINAMIS ---
class TOPSISCalculator {
  constructor(alternatives, criteria, evaluations) {
    this.alternatives = alternatives;
    this.criteria = criteria;
    this.evaluations = evaluations;
  }

  // Helper untuk mendapatkan nilai value dari array evaluations
  getValue(altId, critId) {
    const evaluation = this.evaluations.find((e) => e.alternative_id === altId && e.criteria_id === critId);
    return evaluation ? evaluation.value : 0;
  }

  calculate() {
    // 1. Membangun Matriks Keputusan (X)
    // Rows: Alternatives, Cols: Criteria
    const matrix = this.alternatives.map((alt) => {
      return this.criteria.map((crit) => this.getValue(alt.id, crit.id));
    });

    const n = this.alternatives.length;
    const m = this.criteria.length;

    // 2. Normalisasi Matriks (R)
    const normalizedMatrix = [];
    const divisors = new Array(m).fill(0);

    // Hitung pembagi (akar dari jumlah kuadrat setiap kolom)
    for (let j = 0; j < m; j++) {
      let sumSq = 0;
      for (let i = 0; i < n; i++) {
        sumSq += Math.pow(matrix[i][j], 2);
      }
      divisors[j] = Math.sqrt(sumSq);
    }

    // Lakukan normalisasi
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < m; j++) {
        // Handle division by zero
        row.push(divisors[j] === 0 ? 0 : matrix[i][j] / divisors[j]);
      }
      normalizedMatrix.push(row);
    }

    // 3. Normalisasi Terbobot (Y)
    const weightedMatrix = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < m; j++) {
        // Asumsi bobot di DB disimpan sbg angka biasa (e.g. 25), kita bagi 100 jika perlu
        // Atau biarkan raw jika user input desimal. Di sini kita normalisasi bobot total jadi 1
        const totalWeight = this.criteria.reduce((a, b) => a + b.weight, 0);
        const normalizedWeight = this.criteria[j].weight / totalWeight;

        row.push(normalizedMatrix[i][j] * normalizedWeight);
      }
      weightedMatrix.push(row);
    }

    // 4. Solusi Ideal Positif (A+) dan Negatif (A-)
    const idealPositive = [];
    const idealNegative = [];

    for (let j = 0; j < m; j++) {
      const colValues = weightedMatrix.map((row) => row[j]);
      const maxVal = Math.max(...colValues);
      const minVal = Math.min(...colValues);

      if (this.criteria[j].type === 'benefit') {
        idealPositive.push(maxVal);
        idealNegative.push(minVal);
      } else {
        // Cost
        idealPositive.push(minVal);
        idealNegative.push(maxVal);
      }
    }

    // 5. Jarak Euclidean (D+ dan D-)
    const distances = [];
    for (let i = 0; i < n; i++) {
      let dPos = 0;
      let dNeg = 0;
      for (let j = 0; j < m; j++) {
        dPos += Math.pow(weightedMatrix[i][j] - idealPositive[j], 2);
        dNeg += Math.pow(weightedMatrix[i][j] - idealNegative[j], 2);
      }
      distances.push({
        pos: Math.sqrt(dPos),
        neg: Math.sqrt(dNeg),
      });
    }

    // 6. Nilai Preferensi (V)
    const results = this.alternatives.map((alt, i) => {
      const { pos, neg } = distances[i];
      const preference = pos + neg === 0 ? 0 : neg / (pos + neg);

      return {
        ...alt,
        preference,
        score: preference, // Alias
        details: {
          normalized: normalizedMatrix[i],
          weighted: weightedMatrix[i],
          distancePositive: pos,
          distanceNegative: neg,
        },
      };
    });

    // 7. Perangkingan
    results.sort((a, b) => b.preference - a.preference);
    results.forEach((r, idx) => (r.rank = idx + 1));

    return {
      results,
      criteria: this.criteria,
      idealPositive,
      idealNegative,
    };
  }
}

// --- API ROUTER ---

export async function GET(request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // 'criteria', 'alternatives', 'evaluations', 'calculate'

  try {
    if (type === 'criteria') {
      const { data, error } = await supabase.from('criteria').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (type === 'alternatives') {
      const { data, error } = await supabase.from('alternatives').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (type === 'evaluations') {
      // Mengambil semua data untuk membangun matriks di frontend
      const { data, error } = await supabase.from('evaluations').select('*');
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (type === 'calculate') {
      // Fetch all needed data
      const [critRes, altRes, evalRes] = await Promise.all([supabase.from('criteria').select('*').order('created_at'), supabase.from('alternatives').select('*'), supabase.from('evaluations').select('*')]);

      if (critRes.error) throw critRes.error;
      if (altRes.error) throw altRes.error;
      if (evalRes.error) throw evalRes.error;

      if (altRes.data.length === 0 || critRes.data.length === 0) {
        return NextResponse.json({ success: false, error: 'Data Alternatif atau Kriteria masih kosong.' });
      }

      const calculator = new TOPSISCalculator(altRes.data, critRes.data, evalRes.data);
      const result = calculator.calculate();

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json();
  const { type, data } = body;

  try {
    if (type === 'criteria') {
      const { error } = await supabase.from('criteria').insert(data);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (type === 'alternatives') {
      const { error } = await supabase.from('alternatives').insert(data);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (type === 'evaluations') {
      // Upsert: Insert jika belum ada, Update jika sudah ada (based on constraint unique)
      const { error } = await supabase.from('evaluations').upsert(data, { onConflict: 'alternative_id, criteria_id' });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');

  try {
    let table = '';
    if (type === 'criteria') table = 'criteria';
    else if (type === 'alternatives') table = 'alternatives';
    else return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
