'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Trophy, Info, ArrowUpCircle, ArrowDownCircle, MapPin, Search, Moon, Sun, Palette, Star } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Konfigurasi Tema Warna
const THEMES = {
  blue: {
    label: 'Ocean',
    primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500',
    light: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-600 to-indigo-600',
  },
  green: {
    label: 'Nature',
    primary: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500',
    light: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-600 to-green-600',
  },
  purple: {
    label: 'Royal',
    primary: 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500',
    light: 'bg-violet-50 dark:bg-violet-900/10',
    border: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-600 to-purple-600',
  },
};

export default function GuestApp() {
  const [loading, setLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewState, setViewState] = useState('browse'); // 'browse' | 'result'

  const theme = THEMES[currentTheme];

  // Data States
  const [criteria, setCriteria] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [evaluations, setEvaluations] = useState([]); // TAMBAHAN: State untuk nilai
  const [calculationResult, setCalculationResult] = useState(null);

  // Init Data & Theme
  useEffect(() => {
    fetchData();
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('themeMode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('themeMode', 'light');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // TAMBAHAN: Fetch evaluations juga
      const [critRes, altRes, evalRes] = await Promise.all([fetch('/api?type=criteria'), fetch('/api?type=alternatives'), fetch('/api?type=evaluations')]);

      const critData = await critRes.json();
      const altData = await altRes.json();
      const evalData = await evalRes.json();

      if (critData.success) setCriteria(critData.data);
      if (altData.success) setAlternatives(altData.data);
      if (evalData.success) setEvaluations(evalData.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk mendapatkan nilai skor (1-5) dari state
  const getScore = (altId, critId) => {
    const found = evaluations.find((e) => e.alternative_id === altId && e.criteria_id === critId);
    return found ? found.value : '-';
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api?type=calculate');
      const json = await res.json();
      if (json.success) {
        setCalculationResult(json.data);
        setViewState('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(json.error);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Navbar Simple */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient} text-white`}>
              <Search className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg hidden sm:block">
              CariKos<span className={theme.text}></span>
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Palette className={`w-5 h-5 ${theme.text}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                {Object.entries(THEMES).map(([key, val]) => (
                  <DropdownMenuItem key={key} onClick={() => setCurrentTheme(key)} className="gap-2 cursor-pointer dark:text-slate-200">
                    <div className={`w-4 h-4 rounded-full ${val.primary.split(' ')[0]}`} />
                    {val.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8 md:py-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Temukan Kos <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>Idealmu</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Sistem cerdas (SPK TOPSIS) untuk merekomendasikan kos terbaik.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {viewState === 'result' && (
              <Button variant="outline" size="lg" onClick={() => setViewState('browse')} className="border-slate-300 dark:border-slate-700">
                Lihat Daftar Kos
              </Button>
            )}
            <Button size="lg" onClick={handleCalculate} disabled={loading} className={`shadow-lg shadow-blue-500/20 ${theme.primary} text-white min-w-[200px] `}>
              {loading ? 'Menganalisa...' : 'Hitung Rekomendasi'}
              {!loading && <Calculator className="ml-2 w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* VIEW 1: RESULT */}
        {viewState === 'result' && calculationResult && (
          <div className="animate-in slide-in-from-bottom-6 duration-500 space-y-6">
            {/* Winner Banner */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} p-8 text-white shadow-2xl`}>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-3 opacity-90">
                    <Trophy className="w-6 h-6 text-yellow-300" />
                    <span className="font-bold tracking-widest uppercase text-sm">Rekomendasi Terbaik</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-extrabold mb-2">{calculationResult.results[0].name}</h2>
                  <p className="opacity-90 text-lg max-w-lg">{calculationResult.results[0].description || 'Pilihan paling optimal.'}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl min-w-[140px] border border-white/30">
                  <div className="text-xs uppercase tracking-widest opacity-80 mb-1">Skor Kecocokan</div>
                  <div className="text-4xl font-black">{(calculationResult.results[0].preference * 100).toFixed(0)}%</div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            </div>

            {/* Ranking Table */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="dark:text-slate-100">Ranking Lengkap</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
                      <TableHead className="w-[80px] text-center">#</TableHead>
                      <TableHead>Nama Kos</TableHead>
                      <TableHead className="text-right">Skor Akhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculationResult.results.map((res, idx) => (
                      <TableRow key={res.id} className="dark:border-slate-800">
                        <TableCell className="text-center font-bold">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${idx === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            {res.rank}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium dark:text-slate-200">
                          {res.name}
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">{res.description}</div>
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold ${theme.text}`}>{(res.preference * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VIEW 2: BROWSE */}
        <div className={`grid md:grid-cols-12 gap-8 ${viewState === 'result' ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
          {/* Sidebar: Kriteria Info */}
          <div className="md:col-span-4 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-fit sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-slate-400" />
                  Bobot Kriteria
                </CardTitle>
                <CardDescription>Semakin besar %, semakin berpengaruh.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {criteria.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${c.type === 'benefit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                        {c.type === 'benefit' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                      </div>
                      <div className="text-sm font-medium dark:text-slate-200">{c.name}</div>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {c.weight}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main: Daftar Kos */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-slate-100">Daftar Pilihan Kos</h3>
              <span className="text-sm text-slate-500">{alternatives.length} unit tersedia</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {alternatives.map((alt) => (
                <Card key={alt.id} className="flex flex-col group overflow-hidden border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-md bg-white dark:bg-slate-900">
                  {/* Gambar / Icon Placeholder */}
                  {/* <div className="h-32 bg-slate-100 dark:bg-slate-800 w-full relative">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                      <MapPin className="w-8 h-8 opacity-50" />
                    </div>
                  </div> */}

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1 dark:text-slate-200">{alt.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px] text-xs">{alt.description || 'Tidak ada deskripsi tersedia.'}</CardDescription>
                  </CardHeader>

                  <CardContent className="grow">
                    {/* TAMBAHAN: Menampilkan Bobot/Nilai Kos */}
                    <div className="mt-2 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Spesifikasi </p>
                      <div className="grid grid-cols-2 gap-2">
                        {criteria.map((c) => {
                          const valRaw = getScore(alt.id, c.id);
                          const val = parseInt(valRaw);
                          const isBenefit = c.type === 'benefit';

                          // Logika Label & Warna
                          let label = '-';
                          let colorClass = 'text-slate-400 dark:text-slate-500';

                          if (!isNaN(val)) {
                            if (val === 1) {
                              label = isBenefit ? 'Sangat Buruk' : 'Sangat Baik';
                              colorClass = isBenefit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
                            } else if (val === 2) {
                              label = isBenefit ? 'Buruk' : 'Baik';
                              colorClass = isBenefit ? 'text-orange-500 dark:text-orange-400' : 'text-emerald-500 dark:text-emerald-500';
                            } else if (val === 3) {
                              label = 'Netral';
                              colorClass = 'text-yellow-600 dark:text-yellow-500';
                            } else if (val === 4) {
                              label = isBenefit ? 'Baik' : 'Buruk';
                              colorClass = isBenefit ? 'text-emerald-500 dark:text-emerald-500' : 'text-orange-500 dark:text-orange-400';
                            } else if (val === 5) {
                              label = isBenefit ? 'Sangat Baik' : 'Sangat Buruk';
                              colorClass = isBenefit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
                            }
                          }

                          return (
                            <div key={c.id} className="flex flex-col justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                              {/* Nama Kriteria */}
                              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 truncate mb-1">{c.name}</span>

                              {/* Nilai & Label */}
                              <div className="flex items-end gap-1.5">
                                <span className={`text-[10px] font-medium leading-tight mb-[1px] ${colorClass}`}>{label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 mt-12 bg-white dark:bg-slate-950">
        <p>© 2024 Sistem Pendukung Keputusan Pemilihan Kos.</p>
      </footer>
    </div>
  );
}
