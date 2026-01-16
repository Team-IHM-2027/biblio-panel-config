import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type SystemAlertType = 'success' | 'error' | 'warning' | 'info';
export type SystemAlertTargetRole = 'librarian' | 'admin' | 'client';

export interface CreateSystemAlertInput {
  title: string;
  message?: string;
  type: SystemAlertType;
  targetRole: SystemAlertTargetRole;
  createdBy?: string | null;
}

export async function createSystemAlert(input: CreateSystemAlertInput): Promise<void> {
  await addDoc(collection(db, 'SystemAlerts'), {
    title: input.title.trim(),
    message: input.message?.trim() || '',
    type: input.type,
    targetRole: input.targetRole,
    createdBy: input.createdBy ?? null,
    read: false,
    createdAt: serverTimestamp(),
  });
}
