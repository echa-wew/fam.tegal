import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import toast from 'react-hot-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Berhasil masuk!');
        navigate('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Save to firestore users collection
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          displayName: name,
          role: 'member',
          isVerified: false,
        });
        
        toast.success('Pendaftaran berhasil! Akun menunggu verifikasi admin.');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center space-y-2 border-b border-border/50 pb-6">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl mb-2">P</div>
          <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
            Pancakarsa
          </CardTitle>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            fam.pancakarsa.my.id
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold text-muted-foreground">Nama Lengkap</label>
                <Input 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Sesuai identitas" 
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-muted-foreground">Email Keluarga</label>
              <Input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="nama@email.com" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-muted-foreground">Kata Sandi</label>
              <Input 
                required 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full py-5 font-bold" disabled={loading}>
              {loading ? 'Memproses Akses...' : (isLogin ? 'Masuk Portal Terenkripsi' : 'Daftar Akses Keluarga')}
            </Button>
            
            <div className="text-center text-xs pt-6 border-t border-border/50">
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                {isLogin ? 'Keluarga baru? Daftar disini' : 'Sudah terdaftar? Masuk'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
