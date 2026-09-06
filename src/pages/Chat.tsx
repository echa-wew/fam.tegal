import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatMessage } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Chat() {
  const { userData } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'chatMessages'), orderBy('timestamp', 'asc'));
      const snap = await getDocs(q);
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (userData?.isVerified) {
      fetchMessages();
      // In production, we'd use onSnapshot for real-time updates. 
      // For this implementation, setting up an interval for near real-time updates if snapshot is tricky, 
      // but let's use a simple interval polling for this demo.
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [userData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userData) return;

    try {
      await addDoc(collection(db, 'chatMessages'), {
        senderId: userData.id,
        senderName: userData.displayName,
        text: newMessage,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
      fetchMessages();
    } catch (error: any) {
      toast.error('Gagal mengirim pesan');
    }
  };

  if (!userData?.isVerified) return <p className="text-center mt-10">Akun Anda belum diverifikasi.</p>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pesan Keluarga</h1>
        <p className="text-muted-foreground">Ruang komunikasi internal terenkripsi</p>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden bg-card border-border">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === userData.id;
            const date = msg.timestamp ? ((msg.timestamp as any).toDate ? (msg.timestamp as any).toDate() : new Date()) : new Date();
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-muted-foreground mb-1 px-1">{isMe ? 'Anda' : msg.senderName}</span>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-600/20' : 'bg-muted border border-border/50 text-foreground rounded-bl-sm'}`}>
                  <p className="text-[13px]">{msg.text}</p>
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 px-1">
                  {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 bg-background border-t border-border/50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              placeholder="Tulis pesan..." 
              className="flex-1 rounded-full"
            />
            <Button type="submit" size="icon" className="rounded-full bg-indigo-600 hover:bg-indigo-700">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
