
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import config from '../../firebase-applet-config.json';

let app: App | null = null;
let db: Firestore | null = null;

export function getAdminApp(): App {
  if (!app) {
    const appName = 'admin-app';
    const existingApp = getApps().find(a => a.name === appName);
    console.log("Initializing Admin App with project ID:", config.projectId);
    console.log("Environment variables:", JSON.stringify(process.env, null, 2));
    app = existingApp || initializeApp({
      projectId: config.projectId
    }, appName);
  }
  return app;
}

export function getAdminDb(): Firestore {
  if (!db) {
    db = getFirestore(getAdminApp(), config.firestoreDatabaseId);
  }
  return db;
}

// Export adminDb as a Proxy to ensure it's always initialized
export const adminDb = new Proxy({} as Firestore, {
  get(target, prop, receiver) {
    return Reflect.get(getAdminDb(), prop, receiver);
  },
});


