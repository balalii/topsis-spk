'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Home, Plus, Calculator, TrendingUp, DollarSign, MapPin, Star, Shield, Sparkles, Info, Trophy, BarChart3 } from 'lucide-react';

export default function App() {
  const [kosList, setKosList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [topsisResult, setTopsisResult] = useState(null);
  const [showCalculation, setShowCalculation] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    harga: '',
    jarak: '',
    fasilitas: '',
    keamanan: '',
    kebersihan: '',
    deskripsi: '',
    foto: '',
  });

  // Weight states
  const [weights, setWeights] = useState({
    harga: 25,
    jarak: 20,
    fasilitas: 20,
    keamanan: 20,
    kebersihan: 15,
  });

  useEffect(() => {
    fetchKos();
    seedData();
  }, []);

  const fetchKos = async () => {
    try {
      const response = await fetch('/api/kos');
      const data = await response.json();
      if (data.success) {
        setKosList(data.data);
      }
    } catch (err) {
      console.error('Error fetching kos:', err);
    }
  };

  const seedData = async () => {
    try {
      const response = await fetch('/api/kos');
      const data = await response.json();
      if (data.success && data.data.length === 0) {
        await fetch('/api/seed', { method: 'POST' });
        fetchKos();
      }
    } catch (err) {
      console.error('Error seeding data:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    setWeights((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);

  const handleAddKos = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/kos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Kos berhasil ditambahkan!');
        setFormData({
          nama: '',
          alamat: '',
          harga: '',
          jarak: '',
          fasilitas: '',
          keamanan: '',
          kebersihan: '',
          deskripsi: '',
          foto: '',
        });
        setIsAddDialogOpen(false);
        fetchKos();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Gagal menambahkan kos');
      }
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateTOPSIS = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (Math.abs(totalWeight - 100) > 0.01) {
      setError('Total bobot harus 100%');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights }),
      });

      const data = await response.json();

      if (data.success) {
        setTopsisResult(data.data);
        setShowCalculation(true);
        setSuccess('Perhitungan TOPSIS berhasil!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Gagal menghitung TOPSIS');
      }
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKos = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kos ini?')) return;

    try {
      const response = await fetch(`/api/kos/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setSuccess('Kos berhasil dihapus!');
        fetchKos();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Gagal menghapus kos');
      }
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
    }
  };

   const handleSeedData = async () => {
    if (!confirm('Apakah Anda yakin ingin mengisi data sample? Data yang ada akan ditambah.')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/seed', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setSuccess('Data sample berhasil ditambahkan!');
        fetchKos();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Gagal menambahkan data sample');
      }
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex md:items-center justify-between md:flex-row flex-col gap-4 ">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sistem Pakar Pemilihan Kos</h1>
                <p className="text-sm text-muted-foreground">Metode TOPSIS - Technique for Order of Preference by Similarity to Ideal Solution</p>
              </div>
            </div>
           <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSeedData}
                disabled={loading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? 'Loading...' : 'Isi Data Sample'}
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Kos
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Kos Baru</DialogTitle>
                  <DialogDescription>Masukkan informasi kos yang ingin ditambahkan</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddKos} className="space-y-4">
                  <div>
                    <Label htmlFor="nama">Nama Kos *</Label>
                    <Input id="nama" name="nama" value={formData.nama} onChange={handleInputChange} required placeholder="Contoh: Kos Mahasiswa Sejahtera" />
                  </div>
                  <div>
                    <Label htmlFor="alamat">Alamat</Label>
                    <Textarea id="alamat" name="alamat" value={formData.alamat} onChange={handleInputChange} placeholder="Alamat lengkap kos" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="harga">Harga/Bulan (Rp) *</Label>
                      <Input id="harga" name="harga" type="number" value={formData.harga} onChange={handleInputChange} required placeholder="1500000" />
                    </div>
                    <div>
                      <Label htmlFor="jarak">Jarak ke Kampus (km) *</Label>
                      <Input id="jarak" name="jarak" type="number" step="0.1" value={formData.jarak} onChange={handleInputChange} required placeholder="1.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="fasilitas">Fasilitas (1-10) *</Label>
                      <Input id="fasilitas" name="fasilitas" type="number" min="1" max="10" value={formData.fasilitas} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <Label htmlFor="keamanan">Keamanan (1-10) *</Label>
                      <Input id="keamanan" name="keamanan" type="number" min="1" max="10" value={formData.keamanan} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <Label htmlFor="kebersihan">Kebersihan (1-10) *</Label>
                      <Input id="kebersihan" name="kebersihan" type="number" min="1" max="10" value={formData.kebersihan} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deskripsi">Deskripsi</Label>
                    <Textarea id="deskripsi" name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} placeholder="Deskripsi singkat tentang kos" rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="foto">URL Foto</Label>
                    <Input id="foto" name="foto" value={formData.foto} onChange={handleInputChange} placeholder="https://example.com/image.jpg" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Menyimpan...' : 'Simpan Kos'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 bg-green-50 text-green-900 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="data" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="data">Data Kos</TabsTrigger>
            <TabsTrigger value="calculate">Hitung TOPSIS</TabsTrigger>
            <TabsTrigger value="result">Hasil Ranking</TabsTrigger>
          </TabsList>

          {/* Tab Data Kos */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Kos Tersedia</CardTitle>
                <CardDescription>Total {kosList.length} kos yang terdaftar dalam sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kosList.map((kos) => (
                    <Card key={kos.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {kos.foto && <img src={kos.foto} alt={kos.nama} className="w-full h-48 object-cover" />}
                      <CardHeader>
                        <CardTitle className="text-lg">{kos.nama}</CardTitle>
                        {kos.alamat && (
                          <CardDescription className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{kos.alamat}</span>
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Harga
                          </span>
                          <span className="font-semibold">Rp {kos.harga.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            Jarak
                          </span>
                          <span className="font-semibold">{kos.jarak} km</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div className="text-center">
                            <Badge variant="secondary" className="w-full">
                              <Star className="h-3 w-3 mr-1" />
                              {kos.fasilitas}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">Fasilitas</p>
                          </div>
                          <div className="text-center">
                            <Badge variant="secondary" className="w-full">
                              <Shield className="h-3 w-3 mr-1" />
                              {kos.keamanan}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">Keamanan</p>
                          </div>
                          <div className="text-center">
                            <Badge variant="secondary" className="w-full">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {kos.kebersihan}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">Kebersihan</p>
                          </div>
                        </div>
                        {kos.deskripsi && <p className="text-sm text-muted-foreground pt-2 border-t">{kos.deskripsi}</p>}
                        <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => handleDeleteKos(kos.id)}>
                          Hapus
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {kosList.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada data kos. Tambahkan kos pertama Anda!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Hitung TOPSIS */}
          <TabsContent value="calculate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-6 w-6" />
                  Pengaturan Bobot Kriteria
                </CardTitle>
                <CardDescription>Atur bobot untuk setiap kriteria. Total bobot harus 100%.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Kriteria COST:</strong> Harga, Jarak (semakin rendah semakin baik)
                    <br />
                    <strong>Kriteria BENEFIT:</strong> Fasilitas, Keamanan, Kebersihan (semakin tinggi semakin baik)
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6">
                  {[
                    { key: 'harga', label: 'Harga Sewa', icon: DollarSign, type: 'COST' },
                    { key: 'jarak', label: 'Jarak ke Kampus', icon: MapPin, type: 'COST' },
                    { key: 'fasilitas', label: 'Fasilitas', icon: Star, type: 'BENEFIT' },
                    { key: 'keamanan', label: 'Keamanan', icon: Shield, type: 'BENEFIT' },
                    { key: 'kebersihan', label: 'Kebersihan', icon: Sparkles, type: 'BENEFIT' },
                  ].map(({ key, label, icon: Icon, type }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={key} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                          <Badge variant={type === 'COST' ? 'destructive' : 'default'} className="text-xs">
                            {type}
                          </Badge>
                        </Label>
                        <span className="text-sm font-semibold">{weights[key]}%</span>
                      </div>
                      <Input id={key} name={key} type="range" min="0" max="100" value={weights[key]} onChange={handleWeightChange} className="cursor-pointer" />
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">Total Bobot:</span>
                    <span className={`text-2xl font-bold ${Math.abs(totalWeight - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>{totalWeight.toFixed(1)}%</span>
                  </div>
                  <Button
                    onClick={handleCalculateTOPSIS}
                    disabled={loading || kosList.length === 0 || Math.abs(totalWeight - 100) > 0.01}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    <Calculator className="mr-2 h-5 w-5" />
                    {loading ? 'Menghitung...' : 'Hitung TOPSIS'}
                  </Button>
                  {kosList.length === 0 && <p className="text-sm text-muted-foreground text-center mt-2">Tambahkan data kos terlebih dahulu</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Hasil Ranking */}
          <TabsContent value="result" className="space-y-6">
            {!topsisResult ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada hasil perhitungan. Silakan hitung TOPSIS terlebih dahulu.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className=" ">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-6 w-6 text-yellow-600" />
                      Hasil Ranking TOPSIS
                    </CardTitle>
                    <CardDescription>Kos terbaik berdasarkan kriteria dan bobot yang telah ditentukan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topsisResult.results.map((result, index) => (
                        <Card key={result.id} className={`overflow-hidden ${index === 0 ? 'border-yellow-400 border-2 shadow-lg' : ''}`}>
                          <div className="flex-col md:flex-row items-start gap-4 p-6">
                            {result.foto && <img src={result.foto} alt={result.nama} className="w-full h-full md:w-24 m:h-24 object-cover rounded-lg flex-shrink-0 mb-5" />}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={index === 0 ? 'default' : 'secondary'} className={index === 0 ? 'bg-yellow-500 hover:bg-yellow-600' : ''}>
                                      Rank #{result.rank}
                                    </Badge>
                                    {index === 0 && (
                                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">
                                        <Trophy className="h-3 w-3 mr-1" />
                                        TERBAIK
                                      </Badge>
                                    )}
                                  </div>
                                  <h3 className="text-xl font-bold">{result.nama}</h3>
                                  {result.alamat && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="h-3 w-3" />
                                      {result.alamat}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-blue-600">{(result.preference * 100).toFixed(2)}%</div>
                                  <p className="text-xs text-muted-foreground">Skor Preferensi</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-5 gap-3 mt-4">
                                <div className="text-center">
                                  <div className="text-sm font-semibold">Rp {result.values[0].toLocaleString('id-ID')}</div>
                                  <div className="text-xs text-muted-foreground">Harga</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-semibold">{result.values[1]} km</div>
                                  <div className="text-xs text-muted-foreground">Jarak</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-semibold">{result.values[2]}/10</div>
                                  <div className="text-xs text-muted-foreground">Fasilitas</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-semibold">{result.values[3]}/10</div>
                                  <div className="text-xs text-muted-foreground">Keamanan</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-semibold">{result.values[4]}/10</div>
                                  <div className="text-xs text-muted-foreground">Kebersihan</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Jarak ke Ideal Positif:</span>
                                  <span className="font-semibold ml-2">{result.distancePositive.toFixed(4)}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Jarak ke Ideal Negatif:</span>
                                  <span className="font-semibold ml-2">{result.distanceNegative.toFixed(4)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Detail Perhitungan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Detail Perhitungan TOPSIS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2">Solusi Ideal Positif (A+)</h4>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="grid grid-cols-5 gap-4 text-sm">
                            {['Harga', 'Jarak', 'Fasilitas', 'Keamanan', 'Kebersihan'].map((name, idx) => (
                              <div key={name}>
                                <div className="font-semibold text-green-800">{name}</div>
                                <div className="text-green-600">{topsisResult.idealPositive[idx].toFixed(4)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Solusi Ideal Negatif (A-)</h4>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="grid grid-cols-5 gap-4 text-sm">
                            {['Harga', 'Jarak', 'Fasilitas', 'Keamanan', 'Kebersihan'].map((name, idx) => (
                              <div key={name}>
                                <div className="font-semibold text-red-800">{name}</div>
                                <div className="text-red-600">{topsisResult.idealNegative[idx].toFixed(4)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Cara Kerja TOPSIS:</strong>
                          <br />
                          1. Normalisasi matriks keputusan menggunakan metode vector normalization
                          <br />
                          2. Pembobotan matriks ternormalisasi dengan bobot kriteria
                          <br />
                          3. Menentukan solusi ideal positif (A+) dan negatif (A-)
                          <br />
                          4. Menghitung jarak euclidean dari setiap alternatif ke A+ dan A-
                          <br />
                          5. Menghitung nilai preferensi: V = D- / (D+ + D-)
                          <br />
                          6. Ranking berdasarkan nilai preferensi tertinggi
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
