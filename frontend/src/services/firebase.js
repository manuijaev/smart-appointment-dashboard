import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let messagingInstance = null;

async function getMessagingInstance() {
  const supported = await isSupported();
  if (!supported || !('Notification' in window)) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

export async function requestFcmToken() {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error('Missing VITE_FIREBASE_VAPID_KEY');
  }

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    registration = await navigator.serviceWorker.register('/sw.js');
  }

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
}

export async function listenForForegroundMessages(onNotification) {
  const messaging = await getMessagingInstance();
  if (!messaging || typeof onNotification !== 'function') return () => {};
  return onMessage(messaging, (payload) => {
    onNotification(payload);
  });
}
