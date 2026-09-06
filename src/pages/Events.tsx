import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FamilyEvent } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { Calendar, Plus, Trash2 } from 'lucide-react';

export default function Events() {
  const { userData } = useAuthStore();
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'));
      const snap = await getDocs(q);
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyEvent)));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (userData?.isVerified) {
      fetchEvents();
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    
    try {
      await addDoc(collection(db, 'events'), {
        title,
        date: new Date(date),
        description,
        createdBy: userData.id
      });
      toast.success('Acara ditambahkan');
      setTitle('');
      setDate('');
      setDescription('');
      fetchEvents();
    } catch (error: any) {
      toast.error('Gagal menambah acara');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus acara ini?')) {
      try {
        await deleteDoc(doc(db, 'events', id));
        toast.success('Acara dihapus');
        fetchEvents();
      } catch (error) {
        toast.error('Gagal menghapus');
      }
    }
  };

  if (!userData?.isVerified) return <p className="text-center mt-10">Akun Anda belum diverifikasi.</p>;

  // Sort events (upcoming first)
  const sortedEvents = [...events].sort((a, b) => {
    const d1 = (a.date as any).toDate ? (a.date as any).toDate() : new Date(a.date as string);
    const d2 = (b.date as any).toDate ? (b.date as any).toDate() : new Date(b.date as string);
    return d1.getTime() - d2.getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Acara & Ulang Tahun</h1>
        <p className="text-muted-foreground">Kelola pengingat acara penting keluarga.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_350px]">
        <div className="space-y-4">
          {sortedEvents.map(evt => {
            const dateObj = (evt.date as any).toDate ? (evt.date as any).toDate() : new Date(evt.date as string);
            const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));
            
            return (
              <Card key={evt.id} className={isPast ? 'opacity-60 bg-card border-border/50' : 'bg-card border-border'}>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{evt.title}</h3>
                    <p className="text-sm font-medium text-emerald-400 mt-1">
                       {dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {evt.description && <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-lg">{evt.description}</p>}
                  </div>
                  {(userData.role === 'admin' || userData.id === evt.createdBy) && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(evt.id)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {sortedEvents.length === 0 && (
             <div className="text-center p-12 border border-dashed border-border rounded-2xl bg-muted">
                <p className="text-muted-foreground text-sm">Belum ada acara yang dijadwalkan.</p>
             </div>
          )}
        </div>

        <div>
          <Card className="bg-card border-border sticky top-4">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">Tambah Acara Baru</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Judul Acara</label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Arisan Keluarga" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanggal</label>
                  <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deskripsi</label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Lokasi atau catatan..." />
                </div>
                <Button type="submit" className="w-full mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Tambah Acara
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
