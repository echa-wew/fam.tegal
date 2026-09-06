import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { FamilyMember, FamilyEvent, User } from '../types';
import { Users, Calendar, Cake, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

import { logActivity } from '../lib/logger';

export default function Dashboard() {
  const { userData } = useAuthStore();
  const [totalMembers, setTotalMembers] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<FamilyEvent[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<FamilyMember[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!userData?.isVerified) return;

    const fetchDashboardData = async () => {
      // Fetch total members
      const membersSnap = await getDocs(collection(db, 'familyMembers'));
      const members: FamilyMember[] = [];
      membersSnap.forEach(doc => members.push({ id: doc.id, ...doc.data() } as FamilyMember));
      setTotalMembers(members.length);

      // Pending users for admin
      if (userData.role === 'admin') {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('isVerified', '==', false)));
        setPendingUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      }

      // Find upcoming birthdays (simplified: just showing some members for UI)
      // In a real scenario, this requires complex querying or cloud functions.
      // We will sort members by closest birthday in client side for simplicity.
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentDay = today.getDate();
      
      const bdays = members.filter(m => m.isAlive && m.birthDate).map(m => {
        const bdate = (m.birthDate as any).toDate ? (m.birthDate as any).toDate() : new Date(m.birthDate as any);
        return { ...m, parsedDate: bdate };
      }).sort((a, b) => {
        // Calculate days until next birthday
        const aNext = new Date(today.getFullYear(), a.parsedDate.getMonth(), a.parsedDate.getDate());
        if (aNext < today) aNext.setFullYear(today.getFullYear() + 1);
        const bNext = new Date(today.getFullYear(), b.parsedDate.getMonth(), b.parsedDate.getDate());
        if (bNext < today) bNext.setFullYear(today.getFullYear() + 1);
        return aNext.getTime() - bNext.getTime();
      }).slice(0, 3);
      
      setUpcomingBirthdays(bdays);

      // Fetch Events
      const eventsQ = query(collection(db, 'events'), where('date', '>=', new Date()), orderBy('date', 'asc'), limit(3));
      const eventsSnap = await getDocs(eventsQ);
      setUpcomingEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyEvent)));
    };

    fetchDashboardData();
  }, [userData]);

  const handleVerifyUser = async (user: User) => {
    try {
      await updateDoc(doc(db, 'users', user.id), { isVerified: true });
      await logActivity('VERIFY_USER', `Memverifikasi akun: ${user.displayName}`, userData);
      setPendingUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success('Pengguna berhasil diverifikasi!');
    } catch (error) {
      toast.error('Gagal verifikasi pengguna.');
    }
  };

  if (!userData?.isVerified) {
    return (
      <Card className="max-w-2xl mx-auto mt-12 border-yellow-500 bg-yellow-500/10">
        <CardContent className="pt-6 text-center">
          <h2 className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mb-2">Akun Menunggu Verifikasi</h2>
          <p className="text-yellow-600 dark:text-yellow-500">
            Akun Anda berhasil dibuat tetapi sedang menunggu persetujuan admin untuk mengakses data keluarga. 
            Hal ini untuk menjaga privasi dan keamanan silsilah Fam.Tegal.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
              <CardTitle className="text-xl font-bold">Struktur Silsilah Cepat</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">Detail</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-64 border border-dashed border-border rounded-xl flex items-center justify-center relative bg-black/40">
                <div className="flex flex-col items-center gap-12">
                  <div className="bg-indigo-600/20 border-2 border-indigo-500 p-3 rounded-lg text-center w-32 shadow-lg shadow-indigo-500/20">
                    <div className="text-xs font-bold text-white">Root / Leluhur</div>
                    <div className="text-[10px] text-indigo-300 italic uppercase">Fam.Tegal</div>
                  </div>
                  <div className="flex gap-16 relative">
                    <div className="absolute top-[-24px] left-1/2 w-[150%] h-[2px] bg-muted/80 -translate-x-1/2"></div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg text-center w-32">
                      <div className="text-xs font-semibold">{totalMembers}</div>
                      <div className="text-[10px] text-muted-foreground">Total Anggota</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cake className="w-4 h-4 text-pink-500" /> Ulang Tahun Terdekat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingBirthdays.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tidak ada data ulang tahun.</p>
                ) : (
                  upcomingBirthdays.map((member, i) => {
                    const date = (member as any).parsedDate;
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 bg-muted rounded-lg border-l-2 border-indigo-500">
                        <div className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center text-[10px] border border-border overflow-hidden">
                          {member.profilePicture ? (
                            <img src={member.profilePicture} alt={member.firstName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-semibold text-foreground">{member.firstName[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[11px] font-bold truncate text-foreground">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] text-indigo-400">
                            {date.getDate()} {date.toLocaleString('id-ID', { month: 'short' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" /> Acara Keluarga
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada acara yang dijadwalkan.</p>
                ) : (
                  upcomingEvents.map((evt) => {
                    const date = (evt.date as any).toDate ? (evt.date as any).toDate() : new Date(evt.date as string);
                    return (
                      <div key={evt.id} className="flex flex-col gap-1 p-2 bg-muted rounded-lg border-l-2 border-emerald-500">
                        <p className="text-[11px] font-bold text-foreground">{evt.title}</p>
                        <p className="text-[10px] text-emerald-400">
                          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600/40 to-purple-600/40 p-4 h-20"></div>
            <CardContent className="p-6 -mt-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden mb-4 shadow-xl">
                  {userData.profilePicture ? (
                    <img src={userData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-xl font-bold">{userData?.displayName?.substring(0,2).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold leading-tight">{userData?.displayName}</h3>
                <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded uppercase mt-1">
                  Verified {userData?.role}
                </div>
              </div>
            </CardContent>
          </Card>

          {userData.role === 'admin' && pendingUsers.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-yellow-500" /> Persetujuan Akun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-background rounded-lg border border-border">
                    <div className="overflow-hidden pr-2">
                      <p className="text-xs font-bold truncate text-foreground">{user.displayName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => handleVerifyUser(user)}>Setujui</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="bg-indigo-600 rounded-2xl p-6 shadow-xl shadow-indigo-600/20 text-white">
            <h4 className="font-bold text-sm mb-2">Statistik Silsilah</h4>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-2xl font-black">{totalMembers}</div>
                <div className="text-[10px] text-indigo-200">Anggota Keluarga</div>
              </div>
              <div>
                <div className="text-2xl font-black">{upcomingEvents.length}</div>
                <div className="text-[10px] text-indigo-200">Acara Mendatang</div>
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-white"></div>
            </div>
            <div className="mt-2 text-[10px] text-indigo-100 font-medium">85% Sistem Aktif</div>
          </div>
        </div>
      </div>
    </div>
  );
}
