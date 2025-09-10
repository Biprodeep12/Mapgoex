const sentBodies = new Set<string>();
const inFlightBodies = new Set<string>();

export default function sendWebNotification(title: string, body: string) {
  if (sentBodies.has(body) || inFlightBodies.has(body)) {
    console.log("Notification already sent or in progress. Skipping.");
    return;
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.error("This browser does not support Notifications or Service Workers.");
    return;
  }

  const send = () => {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.showNotification(title, { body });
        sentBodies.add(body);
        inFlightBodies.delete(body);
      })
      .catch(err => {
        console.error("Failed to send notification:", err);
        inFlightBodies.delete(body);
      });
  };

  if (Notification.permission === "granted") {
    send();
  } else if (Notification.permission !== "denied") {
    inFlightBodies.add(body);
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        send();
      } else {
        console.warn("Notification permission denied by user.");
        inFlightBodies.delete(body);
      }
    });
  } else {
    console.warn("Notification permission has been denied previously.");
  }
};
