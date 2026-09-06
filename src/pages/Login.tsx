import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc, getDocs, collection, query, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import toast from 'react-hot-toast';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user already exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user registration flow
        // Check if there are any users yet to determine if they are the first user
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
        const isFirstUser = usersSnap.empty;
        
        const role = isFirstUser ? 'admin' : 'member';
        const isVerified = isFirstUser ? true : false;
        
        // Save to firestore users collection
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || 'Anggota Keluarga',
          profilePicture: user.photoURL,
          role,
          isVerified,
        });
        
        if (isFirstUser) {
          toast.success('Pendaftaran berhasil! Anda otomatis menjadi Admin Utama.');
        } else {
          toast.success('Pendaftaran berhasil! Akun menunggu verifikasi admin.');
        }
      } else {
        toast.success('Berhasil masuk!');
      }
      
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center space-y-2 border-b border-border/50 pb-6">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl mb-2">T</div>
          <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
            Fam.Tegal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-6 flex flex-col items-center">
          <p className="text-sm text-muted-foreground text-center mb-6">
            Silakan masuk menggunakan Akun Google Anda untuk mengakses data keluarga yang terenkripsi secara aman.
          </p>
          <Button 
            onClick={handleGoogleLogin} 
            className="w-full py-6 font-bold flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 hover:text-black border border-gray-200" 
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            {loading ? 'Memproses Akses...' : 'Lanjutkan dengan Google'}
          </Button>
          
          <div className="mt-8 text-[10px] text-muted-foreground text-center">
            Pendaftar pertama akan otomatis menjadi Admin Utama
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
