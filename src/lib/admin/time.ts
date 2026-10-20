// Times in the admin are shown in Cairo time, where the teaching team works,
// whatever the server's or browser's time zone.
const TIME = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });

export function formatAdminTime(ms: number): string {
  return `${TIME.format(new Date(ms))} (Cairo)`;
}

const PARTS = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Africa/Cairo",
});

/** "2026-10-12T09:30" in Cairo time, for an <input type="datetime-local">. */
export function toCairoInput(ms: number): string {
  const p = Object.fromEntries(PARTS.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** The moment a Cairo wall-clock time ("2026-10-12T09:30") refers to, or null. */
export function fromCairoInput(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const asUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  // Cairo's offset at that moment (it changes with daylight saving): try the offset, then correct once.
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const shown = toCairoInput(guess);
    const [d, t] = shown.split("T");
    const [y, mo, da] = d!.split("-").map(Number);
    const [h, mi] = t!.split(":").map(Number);
    const shownUtc = Date.UTC(y!, mo! - 1, da!, h!, mi!);
    guess += asUtc - shownUtc;
  }
  return guess;
}

/** The current time. Server pages read it once per request; in a client component it is read when rendering, which is fine for "is this live yet" labels. */
export function currentTime(): number {
  return Date.now();
}
