import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FamilyMember } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function MembersList() {
  const { userData } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'male',
    address: '',
    job: '',
    profilePicture: '',
    parentId: '',
    partnerId: '',
    isAlive: true,
  });

  const fetchMembers = async () => {
    try {
      const q = query(collection(db, 'familyMembers'));
      const snap = await getDocs(q);
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember)));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (userData?.isVerified) {
      fetchMembers();
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        birthDate: new Date(formData.birthDate), // In production use proper timestamp conversion
      };

      if (editingId) {
        await updateDoc(doc(db, 'familyMembers', editingId), payload);
        toast.success('Data anggota diperbarui');
      } else {
        await addDoc(collection(db, 'familyMembers'), payload);
        toast.success('Anggota keluarga ditambahkan');
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (m: FamilyMember) => {
    const d = (m.birthDate as any).toDate ? (m.birthDate as any).toDate() : new Date(m.birthDate as any);
    setFormData({
      firstName: m.firstName,
      lastName: m.lastName,
      birthDate: d.toISOString().split('T')[0],
      gender: m.gender,
      address: m.address,
      job: m.job,
      profilePicture: m.profilePicture,
      parentId: m.parentId || '',
      partnerId: m.partnerId || '',
      isAlive: m.isAlive,
    });
    setEditingId(m.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus anggota ini?')) {
      try {
        await deleteDoc(doc(db, 'familyMembers', id));
        toast.success('Anggota dihapus');
        fetchMembers();
      } catch (error: any) {
        toast.error('Gagal menghapus: ' + error.message);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredMembers = members.filter(m => 
    m.firstName.toLowerCase().includes(search.toLowerCase()) || 
    m.lastName.toLowerCase().includes(search.toLowerCase())
  );

  if (!userData?.isVerified) {
    return <p className="text-center mt-10">Akun Anda belum diverifikasi.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anggota Keluarga</h1>
          <p className="text-muted-foreground">Kelola data seluruh anggota keluarga.</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({
            firstName: '', lastName: '', birthDate: '', gender: 'male', 
            address: '', job: '', profilePicture: '', parentId: '', partnerId: '', isAlive: true
          });
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Anggota
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Cari nama anggota..." 
          className="pl-9 max-w-md bg-muted border-border" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((m) => (
          <Card key={m.id} className="overflow-hidden flex flex-col bg-card border-border">
            <div className="p-6 flex items-start gap-4">
              <div className="h-16 w-16 rounded-full border border-border bg-muted/80 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                {m.profilePicture ? (
                  <img src={m.profilePicture} alt={m.firstName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-foreground">{m.firstName[0]}</span>
                )}
              </div>
              <div className="flex-1 overflow-hidden pt-1">
                <h3 className="font-semibold text-lg truncate text-foreground">{m.firstName} {m.lastName}</h3>
                <p className="text-xs text-indigo-400 font-medium truncate mt-1">{m.job || 'Belum ada pekerjaan'}</p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{m.address || 'Alamat belum diisi'}</p>
              </div>
            </div>
            <div className="mt-auto bg-muted p-3 flex justify-end gap-2 border-t border-border/50">
              <Button variant="outline" size="sm" className="bg-transparent border-border hover:bg-muted/80" onClick={() => handleEdit(m)}>
                <Edit2 className="h-4 w-4 mr-1" /> Edit
              </Button>
              {userData.role === 'admin' && (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-8">
            <CardHeader>
              <CardTitle className="text-foreground">{editingId ? 'Edit Data Anggota' : 'Tambah Anggota Keluarga'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold text-muted-foreground">Nama Depan</label>
                    <Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold text-muted-foreground">Nama Belakang</label>
                    <Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold text-muted-foreground">Tanggal Lahir</label>
                    <Input type="date" required value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold text-muted-foreground">Jenis Kelamin</label>
                    <select 
                      className="flex h-9 w-full rounded-md border border-border bg-muted px-3 py-1 text-sm shadow-sm text-foreground focus-visible:outline-none focus-visible:border-indigo-500"
                      value={formData.gender} 
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                    >
                      <option value="male" className="bg-card">Laki-laki</option>
                      <option value="female" className="bg-card">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground">Alamat Lengkap</label>
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground">Pekerjaan</label>
                  <Input value={formData.job} onChange={e => setFormData({...formData, job: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground">Foto Profil (Opsional, kecil)</label>
                  <Input type="file" accept="image/*" onChange={handleFileChange} />
                  {formData.profilePicture && (
                    <div className="mt-2 h-16 w-16 rounded-full overflow-hidden border border-border">
                      <img src={formData.profilePicture} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold text-muted-foreground">Orang Tua (Opsional)</label>
                    <select 
                      className="flex h-9 w-full rounded-md border border-border bg-muted px-3 py-1 text-sm shadow-sm text-foreground focus-visible:outline-none focus-visible:border-indigo-500"
                      value={formData.parentId} 
                      onChange={e => setFormData({...formData, parentId: e.target.value})}
                    >
                      <option value="" className="bg-card">- Tidak ada / Root -</option>
                      {members.filter(m => m.id !== editingId).map(m => (
                        <option key={m.id} value={m.id} className="bg-card">{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <label className="flex items-center space-x-2 text-[11px] uppercase font-bold text-muted-foreground cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.isAlive} 
                        onChange={e => setFormData({...formData, isAlive: e.target.checked})}
                        className="rounded border-border bg-muted"
                      />
                      <span>Masih Hidup</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-border/50 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
