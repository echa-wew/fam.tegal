import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ActivityLog } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuthStore } from '../store';
import { Activity, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ActivityLogs() {
  const { userData } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.role !== 'admin') return;

    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'activityLogs'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengambil data log aktifitas');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [userData]);

  if (userData?.role !== 'admin') {
    return <p className="text-center mt-10">Anda tidak memiliki izin untuk melihat halaman ini.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-500" />
          Log Aktifitas
        </h1>
        <p className="text-muted-foreground mt-1">
          Pantau seluruh aktivitas yang dilakukan oleh anggota keluarga.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg">Riwayat Tindakan</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-xl bg-muted">
              <p className="text-muted-foreground">Belum ada aktifitas yang tercatat.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => {
                const date = log.createdAt 
                  ? ((log.createdAt as any).toDate ? (log.createdAt as any).toDate() : new Date()) 
                  : new Date();
                
                let bgColor = 'bg-muted';
                if (log.action.startsWith('CREATE')) bgColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
                if (log.action.startsWith('UPDATE')) bgColor = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500';
                if (log.action.startsWith('DELETE')) bgColor = 'bg-red-500/10 border-red-500/20 text-red-500';
                if (log.action.startsWith('VERIFY')) bgColor = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';

                return (
                  <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-background">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 flex-shrink-0 px-2 py-1 text-[10px] font-bold rounded border ${bgColor} uppercase tracking-wider`}>
                        {log.action.split('_')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{log.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Dilakukan oleh: <span className="font-medium text-foreground">{log.userName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      {date.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
