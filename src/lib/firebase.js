import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || import.meta.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || import.meta.env.FIREBASE_PRIVATE_KEY || '')
    .replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase credentials in env');
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let db;
export function getDb() {
  if (!db) {
    getApp();
    db = getFirestore(getApps()[0], 'messaging_service_db');
  }
  return db;
}
