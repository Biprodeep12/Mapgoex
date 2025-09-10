const sentBodies = new Set<string>();

export default function sendWebNotification(title: string, body: string) {
  if (sentBodies.has(body)) {
    console.log("Notification with same body already sent. Skipping.");
    return;
  }

  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notifications.");
    return;
  }

  const send = () => {
    new Notification(title, { body });
    sentBodies.add(body);
  };

  if (Notification.permission === "granted") {
    send();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        if (!sentBodies.has(body)) {
          send();
        }
      } else {
        console.warn("Notification permission denied by user.");
      }
    });
  } else {
    console.warn("Notification permission has been denied previously.");
  }
};
