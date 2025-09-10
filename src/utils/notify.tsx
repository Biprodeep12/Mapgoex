export default function sendWebNotification(title:string, body:string) {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body });
      } else {
        console.warn("Notification permission denied by user.");
      }
    });
  } else {
    console.warn("Notification permission has been denied previously.");
  }
}
