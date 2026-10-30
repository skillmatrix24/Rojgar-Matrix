import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

/**
 * Core Firebase initialization logic.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    // Directly use the config object to initialize
    const firebaseApp = initializeApp(firebaseConfig);

    // Initialize Firestore with settings to improve connectivity in restricted environments
    const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
    initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, dbId);

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp, dbId)
  };
}
