
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import config from '../../firebase-applet-config.json';

export function getAdminApp(): App {
  const appName = 'admin-app';
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return existingApp;
  }
  console.log('Initializing admin app:', appName);
  return initializeApp({
    projectId: config.projectId
  }, appName);
}

let db: Firestore | null = null;
export function getAdminDb(): Firestore {
  if (!db) {
    db = getFirestore(getAdminApp());
  }
  return db;
}


