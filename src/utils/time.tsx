export const formatTime = (ts: number): string => {
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr12 = ((h + 11) % 12) + 1;
    return `${hr12}:${m} ${ampm}`;
  };

export function convertUTCtoIST(utcString: string): string {
  const d = new Date(utcString);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export function has24HoursPassed(timestamp: string | number): boolean {
  const past = typeof timestamp === "number" ? timestamp : Date.parse(String(timestamp));
  if (Number.isNaN(past)) return false;
  return Date.now() - past >= 24 * 60 * 60 * 1000;
}