import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FamilyHistory } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { logActivity } from '../lib/logger';

export default function History() {
  const { userData } = useAuthStore();
  const [histories, setHistories] = useState<FamilyHistory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  const fetchHistories = async () => {
    try {
      const q = query(collection(db, 'familyHistory'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setHistories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyHistory)));
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data sejarah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.isVerified) {
      fetchHistories();
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      await addDoc(collection(db, 'familyHistory'), {
        title: formData.title,
        content: formData.content,
        authorId: userData.id,
        authorName: userData.displayName,
        createdAt: serverTimestamp(),
      });
      await logActivity('CREATE_HISTORY', `Menambahkan cerita sejarah: ${formData.title}`, userData);
      toast.success('Cerita berhasil ditambahkan');
      setFormData({ title: '', content: '' });
      setIsModalOpen(false);
      fetchHistories();
    } catch (error: any) {
      toast.error('Gagal menyimpan cerita');
    }
  };

  const handleDelete = async (history: FamilyHistory) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus cerita ini?')) return;
    try {
      await deleteDoc(doc(db, 'familyHistory', history.id));
      await logActivity('DELETE_HISTORY', `Menghapus cerita sejarah: ${history.title}`, userData);
      toast.success('Cerita berhasil dihapus');
      fetchHistories();
    } catch (error) {
      toast.error('Gagal menghapus cerita');
    }
  };

  if (!userData?.isVerified) return <p className="text-center mt-10">Akun Anda belum diverifikasi.</p>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-500" />
            Kenangan & Sejarah
          </h1>
          <p className="text-muted-foreground mt-1">
            Cerita asal muasal dan kenangan tak terlupakan keluarga Fam.Tegal.
          </p>
        </div>
        {(userData.role === 'admin' || userData.isVerified) && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Tulis Cerita
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : histories.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">Belum ada cerita</h3>
            <p className="text-sm text-muted-foreground mt-1">Jadilah yang pertama menuliskan sejarah atau kenangan keluarga.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {histories.map((history) => {
            const date = history.createdAt 
              ? ((history.createdAt as any).toDate ? (history.createdAt as any).toDate() : new Date()) 
              : new Date();
              
            return (
              <Card key={history.id} className="bg-card border-border overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-xl text-foreground font-bold">{history.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-indigo-400">Oleh: {history.authorName}</span>
                      <span>•</span>
                      <span>{date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  {(userData.role === 'admin' || userData.id === history.authorId) && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(history)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                    {history.content}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8 border-border bg-card shadow-2xl">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-foreground">Tulis Cerita Sejarah / Kenangan</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground">Judul Cerita</label>
                  <Input 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="Cth: Asal Mula Keluarga Tegal, Kenangan Lebaran 2010"
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground">Isi Cerita</label>
                  <textarea 
                    required
                    rows={12}
                    className="flex w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 resize-y"
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder="Tuliskan cerita secara detail di sini..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-border/50 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Terbitkan Cerita</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
