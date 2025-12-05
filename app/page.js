'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Calculator, Trophy, Info, Edit, ArrowUpCircle, ArrowDownCircle, CheckCircle2, AlertTriangle, Palette, Sun, Moon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Konfigurasi Tema Warna (Support Dark Mode)
const THEMES = {
  blue: {
    label: 'Ocean',
    primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500',
    secondary: 'bg-indigo-600 hover:bg-indigo-700',
    // Background tint untuk light mode & dark mode
    light: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-600 to-indigo-600',
    accent: 'accent-blue-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  green: {
    label: 'Nature',
    primary: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500',
    secondary: 'bg-green-600 hover:bg-green-700',
    light: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-600 to-green-600',
    accent: 'accent-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  purple: {
    label: 'Royal',
    primary: 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500',
    secondary: 'bg-purple-600 hover:bg-purple-700',
    light: 'bg-violet-50 dark:bg-violet-900/10',
    border: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-600 to-purple-600',
    accent: 'accent-violet-600',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  },
  orange: {
    label: 'Sunset',
    primary: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500',
    secondary: 'bg-red-600 hover:bg-red-700',
    light: 'bg-orange-50 dark:bg-orange-900/10',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-red-600',
    accent: 'accent-orange-600',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('criteria');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = THEMES[currentTheme];

  // Data States
  const [criteria, setCriteria] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [calculationResult, setCalculationResult] = useState(null);

  // Form States
  const [newCriteria, setNewCriteria] = useState({ name: '', type: 'benefit', weight: 20 });
  const [newAlternative, setNewAlternative] = useState({ name: '', description: '' });

  // Interactive Evaluation State
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [tempEvaluations, setTempEvaluations] = useState({});

  // Init Data & Theme Preference
  useEffect(() => {
    fetchData();

    // Check local storage for theme
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
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

  const showNotif = (type, msg) => {
    setNotification({ type, message: msg });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  const totalWeight = criteria.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);

  // --- HANDLERS (Same as before) ---
  const handleAddCriteria = async (e) => {
    e.preventDefault();
    if (!newCriteria.name || !newCriteria.weight) return;

    if (totalWeight + parseFloat(newCriteria.weight) > 100) {
      if (!confirm(`Total bobot akan menjadi ${totalWeight + parseFloat(newCriteria.weight)}%. Lanjutkan?`)) return;
    }

    await fetch('/api', { method: 'POST', body: JSON.stringify({ type: 'criteria', data: newCriteria }) });
    setNewCriteria({ name: '', type: 'benefit', weight: 20 });
    fetchData();
    showNotif('success', 'Kriteria ditambahkan');
  };

  const handleDeleteCriteria = async (id) => {
    if (!confirm('Hapus kriteria?')) return;
    await fetch(`/api?type=criteria&id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleAddAlternative = async (e) => {
    e.preventDefault();
    if (!newAlternative.name) return;
    await fetch('/api', { method: 'POST', body: JSON.stringify({ type: 'alternatives', data: newAlternative }) });
    setNewAlternative({ name: '', description: '' });
    fetchData();
    showNotif('success', 'Alternatif ditambahkan');
  };

  const handleDeleteAlternative = async (id) => {
    if (!confirm('Hapus alternatif?')) return;
    await fetch(`/api?type=alternatives&id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const openEvaluationModal = (alt) => {
    setSelectedAlternative(alt);
    const currentVals = {};
    criteria.forEach((c) => {
      const found = evaluations.find((e) => e.alternative_id === alt.id && e.criteria_id === c.id);
      currentVals[c.id] = found ? found.value : 1;
    });
    setTempEvaluations(currentVals);
  };

  const handleTempEvalChange = (critId, val) => {
    setTempEvaluations((prev) => ({ ...prev, [critId]: parseFloat(val) || 0 }));
  };

  const saveSpecificEvaluation = async () => {
    setLoading(true);
    const promises = Object.entries(tempEvaluations).map(([critId, val]) => {
      return {
        alternative_id: selectedAlternative.id,
        criteria_id: critId,
        value: parseFloat(val),
      };
    });

    try {
      await fetch('/api', {
        method: 'POST',
        body: JSON.stringify({ type: 'evaluations', data: promises }),
      });
      showNotif('success', `Penilaian ${selectedAlternative.name} disimpan!`);
      setSelectedAlternative(null);
      fetchData();
    } catch (err) {
      showNotif('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionStatus = (altId) => {
    if (criteria.length === 0) return 0;
    const filledCount = criteria.filter((c) => evaluations.some((e) => e.alternative_id === altId && e.criteria_id === c.id && e.value !== null && e.value !== undefined)).length;
    return Math.round((filledCount / criteria.length) * 100);
  };

  const handleCalculate = async () => {
    setLoading(true);
    if (Math.abs(totalWeight - 100) > 1) {
      if (!confirm(`Total bobot saat ini ${totalWeight}%. Hasil mungkin tidak akurat jika tidak 100%. Lanjutkan?`)) return;
    }

    try {
      const res = await fetch('/api?type=calculate');
      const json = await res.json();
      if (json.success) {
        setCalculationResult(json.data);
        setActiveTab('result');
        showNotif('success', 'Perhitungan Selesai');
      } else {
        showNotif('error', json.error);
      }
    } catch (err) {
      showNotif('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Base Background menyesuaikan Dark Mode
    <div className={`min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-950`}>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 font-sans text-slate-900 dark:text-slate-100">
        {/* Header Responsive */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex-1">
            <h1 className={`text-2xl md:text-3xl font-extrabold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>SPK TOPSIS</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Sistem Pendukung Keputusan Interaktif</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Notification Area */}
            {notification.message && (
              <div
                className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                  notification.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}
              >
                {notification.message}
              </div>
            )}

            <div className="flex gap-2">
              {/* Dark Mode Toggle */}
              <Button variant="outline" size="icon" className="rounded-full shadow-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={toggleDarkMode}>
                {isDarkMode ? <Moon className="w-5 h-5 text-slate-200" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </Button>

              {/* Theme Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full shadow-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Palette className={`w-5 h-5 ${theme.text}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-700">
                  {Object.entries(THEMES).map(([key, val]) => (
                    <DropdownMenuItem key={key} onClick={() => setCurrentTheme(key)} className="gap-2 cursor-pointer dark:text-slate-200 dark:focus:bg-slate-800">
                      <div className={`w-4 h-4 rounded-full ${val.primary.split(' ')[0]}`} />
                      {val.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="flex flex-col md:flex-row w-full h-auto p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl gap-1">
            <TabsTrigger value="criteria" className="w-full rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:text-slate-100">
              <span className="hidden md:inline mr-2">1.</span> Data Kriteria
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="w-full rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:text-slate-100">
              <span className="hidden md:inline mr-2">2.</span> Data Alternatif
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="w-full rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:text-slate-100">
              <span className="hidden md:inline mr-2">3.</span> Penilaian
            </TabsTrigger>
            <TabsTrigger value="result" className="w-full rounded-lg py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:text-slate-100">
              <span className="hidden md:inline mr-2">4.</span> Hasil Akhir
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DATA KRITERIA */}
          <TabsContent value="criteria" className="animate-in fade-in zoom-in-95 duration-200">
            <div className="grid md:grid-cols-12 gap-6">
              <Card className="md:col-span-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Tambah Kriteria</CardTitle>
                  <CardDescription>Atur nama dan bobot.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCriteria} className="space-y-5">
                    <div className="space-y-2">
                      <Label>Nama Kriteria</Label>
                      <Input className="bg-white dark:bg-slate-950 dark:border-slate-700" value={newCriteria.name} onChange={(e) => setNewCriteria({ ...newCriteria, name: e.target.value })} placeholder="Contoh: Harga..." required />
                    </div>
                    <div className="space-y-2">
                      <Label>Atribut</Label>
                      <Select value={newCriteria.type} onValueChange={(val) => setNewCriteria({ ...newCriteria, type: val })}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-700">
                          <SelectItem value="benefit">Benefit (Tinggi = Bagus)</SelectItem>
                          <SelectItem value="cost">Cost (Rendah = Bagus)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label>Bobot (%)</Label>
                        <span className={`text-sm font-bold ${theme.text}`}>{newCriteria.weight}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={newCriteria.weight}
                        onChange={(e) => setNewCriteria({ ...newCriteria, weight: parseFloat(e.target.value) })}
                        className={`w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${theme.accent}`}
                      />
                    </div>
                    <Button type="submit" className={`w-full ${theme.primary} text-white`} disabled={loading}>
                      <Plus className="w-4 h-4 mr-2" /> Tambah
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="md:col-span-8">
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Total Bobot:</span>
                  </div>
                  <div className={`text-2xl font-bold ${totalWeight === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>{totalWeight}%</div>
                </div>

                <div className="grid gap-3">
                  {criteria.length === 0 && <div className="text-center py-12 text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">Data Kosong</div>}
                  {criteria.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all gap-3"
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div
                          className={`p-3 rounded-full shrink-0 ${c.type === 'benefit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}
                        >
                          {c.type === 'benefit' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</h3>
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{c.weight}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${c.type === 'benefit' ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${Math.min(c.weight, 100)}%` }}></div>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{c.type}</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCriteria(c.id)} className="self-end sm:self-center text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ALTERNATIF */}
          <TabsContent value="alternatives" className="animate-in fade-in zoom-in-95 duration-200">
            <div className="grid md:grid-cols-12 gap-6">
              <Card className="md:col-span-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Tambah Kandidat</CardTitle>
                  <CardDescription>Objek yang akan dinilai.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddAlternative} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nama Alternatif</Label>
                      <Input
                        className="bg-white dark:bg-slate-950 dark:border-slate-700"
                        value={newAlternative.name}
                        onChange={(e) => setNewAlternative({ ...newAlternative, name: e.target.value })}
                        placeholder="Contoh: Kos Melati"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Keterangan</Label>
                      <Input className="bg-white dark:bg-slate-950 dark:border-slate-700" value={newAlternative.description} onChange={(e) => setNewAlternative({ ...newAlternative, description: e.target.value })} placeholder="Opsional" />
                    </div>
                    <Button type="submit" className={`w-full ${theme.primary} text-white`} disabled={loading}>
                      <Plus className="w-4 h-4 mr-2" /> Tambah
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="md:col-span-8 grid sm:grid-cols-2 gap-4">
                {alternatives.length === 0 && <div className="col-span-2 text-center py-12 text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">Data Kosong</div>}
                {alternatives.map((a) => (
                  <Card key={a.id} className="group hover:border-blue-200 dark:hover:border-blue-800 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all">
                    <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                      <div className="font-bold text-lg truncate pr-2 dark:text-slate-200">{a.name}</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400" onClick={() => handleDeleteAlternative(a.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{a.description || '-'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: PENILAIAN */}
          <TabsContent value="evaluation" className="animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold dark:text-slate-100">Input Penilaian</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Skala 1 (Buruk) sampai 5 (Sangat Baik).</p>
                </div>
                {alternatives.length > 0 && criteria.length > 0 && (
                  <Button onClick={handleCalculate} size="lg" className={`w-full md:w-auto bg-gradient-to-r ${theme.gradient} shadow-lg text-white border-0`}>
                    <Calculator className="w-4 h-4 mr-2" /> Hitung Hasil
                  </Button>
                )}
              </div>

              {Math.abs(totalWeight - 100) > 0.01 && criteria.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Bobot saat ini <strong>{totalWeight}%</strong>. Sesuaikan agar akurat.
                  </span>
                </div>
              )}

              {criteria.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 border-dashed">
                  Harap isi <strong>Data Kriteria</strong> terlebih dahulu.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {alternatives.map((alt) => {
                    const percent = getCompletionStatus(alt.id);
                    const isComplete = percent === 100;

                    return (
                      <Card
                        key={alt.id}
                        className={`relative overflow-hidden transition-all hover:shadow-lg bg-white dark:bg-slate-900 ${
                          isComplete ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="flex justify-between items-center text-base md:text-lg">
                            <span className="truncate pr-2 dark:text-slate-200">{alt.name}</span>
                            {isComplete && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                          </CardTitle>
                          <CardDescription className="line-clamp-1 dark:text-slate-400">{alt.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>Progress</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : theme.primary.split(' ')[0]}`} style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            variant={isComplete ? 'outline' : 'default'}
                            className={`w-full ${!isComplete ? theme.primary : 'dark:bg-transparent dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800'}`}
                            onClick={() => openEvaluationModal(alt)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {isComplete ? 'Edit Nilai' : 'Beri Nilai'}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* MODAL INPUT RESPONSIVE */}
              <Dialog open={!!selectedAlternative} onOpenChange={(open) => !open && setSelectedAlternative(null)}>
                <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 dark:border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="dark:text-slate-100">Nilai: {selectedAlternative?.name}</DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                      Geser slider (1-5). Perhatikan indikator <strong>Cost</strong> vs <strong>Benefit</strong>.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6 py-4">
                    {criteria.map((c) => {
                      const val = tempEvaluations[c.id] || 1;
                      const isBenefit = c.type === 'benefit';

                      // Logika Label Dinamis
                      const leftLabel = isBenefit ? '1 (Sangat Buruk)' : '1 (Sangat Baik)';
                      const rightLabel = isBenefit ? '5 (Sangat Baik)' : '5 (Sangat Buruk)';

                      // Logika Warna Label
                      const leftColor = isBenefit ? 'text-rose-500' : 'text-emerald-500';
                      const rightColor = isBenefit ? 'text-emerald-500' : 'text-rose-500';

                      return (
                        <div key={c.id} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                          {/* Header Label & Badge */}
                          <div className="flex items-center justify-between">
                            <Label className="text-sm md:text-base font-semibold flex flex-col md:flex-row md:items-center gap-1 md:gap-2 dark:text-slate-200">
                              {c.name}
                              <Badge
                                variant="outline"
                                className={`w-fit text-[10px] h-5 ${
                                  isBenefit
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
                                }`}
                              >
                                {isBenefit ? 'Benefit' : 'Cost'}
                              </Badge>
                            </Label>

                            {/* Score Display */}
                            <div className="text-right">
                              <span className={`text-2xl font-bold ${theme.text}`}>{val}</span>
                              <span className="text-xs text-slate-400 font-normal ml-1">/ 5</span>
                            </div>
                          </div>

                          {/* Slider Area */}
                          <div className="space-y-2 pt-2">
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={val > 5 ? 5 : val}
                              onChange={(e) => handleTempEvalChange(c.id, e.target.value)}
                              className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 ${isBenefit ? 'accent-emerald-600' : 'accent-rose-600'}`}
                            />

                            {/* Dynamic Labels Bottom */}
                            <div className="flex justify-between text-[10px] font-semibold px-1">
                              <span className={leftColor}>{leftLabel}</span>
                              <span className="text-slate-400 font-normal">3 (Netral)</span>
                              <span className={rightColor}>{rightLabel}</span>
                            </div>
                          </div>

                          {/* Helper Text Contextual */}
                          <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                            💡 Artinya:
                            {isBenefit ? (
                              <span className="ml-1">
                                Semakin ke kanan (5), kondisi semakin <strong>menguntungkan</strong>.
                              </span>
                            ) : (
                              <span className="ml-1">
                                Semakin ke kiri (1), kondisi semakin <strong>menguntungkan (Murah/Dekat)</strong>.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setSelectedAlternative(null)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                      Batal
                    </Button>
                    <Button onClick={saveSpecificEvaluation} disabled={loading} className={`${theme.primary} text-white`}>
                      {loading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* TAB 4: HASIL AKHIR */}
          <TabsContent value="result" className="animate-in fade-in zoom-in-95 duration-200">
            {!calculationResult ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <Calculator className="w-16 h-16 mb-4 opacity-20" />
                <p>Belum ada hasil.</p>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                {/* Winner Banner */}
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-6 md:p-8 text-white shadow-xl`}>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2 opacity-90">
                        <Trophy className="w-5 h-5" />
                        <span className="font-semibold tracking-wider uppercase text-sm">Rekomendasi Terbaik</span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-extrabold mb-1">{calculationResult.results[0].name}</h2>
                      <p className="opacity-90 text-sm md:text-base">{calculationResult.results[0].description || 'Pilihan optimal.'}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl min-w-[120px]">
                      <div className="text-xs uppercase tracking-widest opacity-80 mb-1">Skor</div>
                      <div className="text-3xl font-bold">{(calculationResult.results[0].preference * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {/* Table Responsive Wrapper */}
                <Card className="overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="dark:text-slate-100">Ranking Lengkap</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 md:p-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="dark:border-slate-800">
                            <TableHead className="w-[60px] text-center dark:text-slate-400">#</TableHead>
                            <TableHead className="dark:text-slate-400">Alternatif</TableHead>
                            <TableHead className="text-right dark:text-slate-400">Skor Preferensi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculationResult.results.map((res, idx) => (
                            <TableRow key={res.id} className={`${idx === 0 ? theme.light : ''} dark:border-slate-800`}>
                              <TableCell className="text-center">
                                <div
                                  className={`mx-auto flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${idx === 0 ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                                >
                                  {res.rank}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium dark:text-slate-200">{res.name}</TableCell>
                              <TableCell className={`text-right font-mono font-bold ${theme.text}`}>{res.preference.toFixed(4)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
