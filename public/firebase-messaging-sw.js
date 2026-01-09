importScripts("https://www.gstatic.com/firebasejs/12.7.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging-compat.js")

const firebaseConfig = {
  apiKey: "AIzaSyBrlXe9dqwV-EfJ53FMJ5f7oY1FeVc8f5Y",
  authDomain: "cupo-notificaciones-1d238.firebaseapp.com",
  projectId: "cupo-notificaciones-1d238",
  storageBucket: "cupo-notificaciones-1d238.firebasestorage.app",
  messagingSenderId: "152986208278",
  appId: "1:152986208278:web:237a3e8ba12adf6fa94d37",
  measurementId: "G-PDDSS1MW3X"
};

const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging(app);

messaging.onBackgroundMessage(payload => {
  console.log('Recibiste un mensaje en segundo plano: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/9.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});