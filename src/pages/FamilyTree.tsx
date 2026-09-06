import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FamilyMember } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function FamilyTree() {
  const { userData } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userData?.isVerified) {
      const fetchMembers = async () => {
        const q = query(collection(db, 'familyMembers'));
        const snap = await getDocs(q);
        setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember)));
      };
      fetchMembers();
    }
  }, [userData]);

  const handleExportPDF = async () => {
    if (!treeRef.current) return;
    try {
      const canvas = await html2canvas(treeRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('Silsilah-Keluarga-Pancakarsa.pdf');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportImage = async () => {
    if (!treeRef.current) return;
    try {
      const canvas = await html2canvas(treeRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = 'Silsilah-Keluarga-Pancakarsa.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  // Build tree structure
  const buildTree = (parentId: string | null = null) => {
    // Basic rendering of a tree node
    const children = members.filter(m => (m.parentId || null) === parentId);
    
    if (children.length === 0) return null;

    return (
      <div className="flex justify-center mt-4">
        <div className="flex flex-row space-x-6 relative">
          {children.map((child, index) => (
            <div key={child.id} className="flex flex-col items-center">
              {/* Connector line from parent */}
              {parentId && (
                <div className="w-px h-6 bg-white/20 mb-2 relative">
                  {/* Horizontal line connecting siblings */}
                  {children.length > 1 && (
                    <div className="absolute top-0 w-[calc(100%+1.5rem)] h-px bg-white/20" 
                         style={{ 
                           left: index === 0 ? '50%' : index === children.length - 1 ? 'auto' : '-50%',
                           right: index === children.length - 1 ? '50%' : 'auto',
                           width: index === 0 || index === children.length - 1 ? '50%' : '100%'
                         }} 
                    />
                  )}
                </div>
              )}
              
              <Card className="w-32 min-w-[128px] border-border shadow-sm bg-card">
                <CardContent className="p-3 text-center flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full overflow-hidden mb-2 bg-indigo-500/10 border border-indigo-500/20">
                    {child.profilePicture ? (
                      <img src={child.profilePicture} alt={child.firstName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm font-bold text-indigo-400">
                        {child.firstName[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold truncate w-full text-foreground" title={`${child.firstName} ${child.lastName}`}>
                    {child.firstName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{!child.isAlive && '(Alm)'}</p>
                </CardContent>
              </Card>

              {/* Render grand-children recursively */}
              {buildTree(child.id)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!userData?.isVerified) return <p className="text-center mt-10">Akun Anda belum diverifikasi.</p>;

  // Find root nodes (members with no parents)
  const rootMembers = members.filter(m => !m.parentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pohon Keluarga</h1>
          <p className="text-muted-foreground">Bagan visual silsilah Fam.Tegal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportImage}>
            <Download className="mr-2 h-4 w-4" /> Gambar
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" /> Ekspor PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-8 pt-4 border border-border rounded-2xl bg-card min-h-[500px]">
        <div ref={treeRef} className="min-w-max p-8 inline-block bg-card">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center w-full">Belum ada data anggota keluarga. Silakan tambah di menu Anggota.</p>
          ) : (
            <div className="flex justify-center">
               {buildTree(null)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
