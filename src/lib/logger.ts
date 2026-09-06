import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

export const logActivity = async (action: string, description: string, user: User | null) => {
  if (!user) return;
  try {
    await addDoc(collection(db, 'activityLogs'), {
      action,
      description,
      userId: user.id,
      userName: user.displayName,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
