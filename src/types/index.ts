import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member';

export interface User {
  id: string; // from auth.uid
  email: string;
  displayName: string;
  role: UserRole;
  isVerified: boolean;
  linkedMemberId?: string; 
}

export type Gender = 'male' | 'female';

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Timestamp | Date;
  gender: Gender;
  address: string;
  job: string;
  profilePicture: string; // Base64 or URL
  parentId?: string; // ID of the parent (simplifies tree to one main lineage for basic setup)
  partnerId?: string; // ID of spouse
  isAlive: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp | Date;
}

export interface FamilyEvent {
  id: string;
  title: string;
  date: Timestamp | Date;
  description: string;
  createdBy: string;
}

export interface FamilyHistory {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp | Date;
}
