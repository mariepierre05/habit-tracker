import { shareOrDownload } from "./share";
import { pad } from "./dates";

// Why a calendar event rather than a notification:
//
// A scheduled local notification would need the Notification Triggers API
// (TimestampTrigger), which no browser ever shipped. Web Push does work in an
// installed PWA on iOS 16.4+, but a push has to be *sent* by a server holding
// VAPID keys — this app is static files on GitHub Pages, with nothing running
// to send anything. Periodic Background Sync is Chrome-only and absent on iOS.
//
// A recurring calendar event with an alarm needs no server, fires reliably at
// the chosen time, survives the app being closed, and the user can edit or
// delete it from the Calendar app like anything else.

const KEY = "reminderTime";

export function getReminderTime() {
  try {
    return localStorage.getItem(KEY);
  } catch (_) {
    return null;
  }
}

export function saveReminderTime(hhmm) {
  try {
    localStorage.setItem(KEY, hhmm);
  } catch (_) {
    // A remembered preference isn't worth failing the whole action over.
  }
}

function stamp(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function localStamp(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

// Escaped per RFC 5545: commas, semicolons and backslashes are separators.
function escapeText(s) {
  return s.replace(/([\\,;])/g, "\\$1").replace(/\n/g, "\\n");
}

export function buildReminderIcs(hhmm, appUrl) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  // A start time already past would put the first occurrence in the past.
  if (start.getTime() <= Date.now()) start.setDate(start.getDate() + 1);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//habit-tracker//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:habit-tracker-reminder-${hhmm.replace(":", "")}@habit-tracker`,
    `DTSTAMP:${stamp(new Date())}`,
    // Floating local time — no TZID, so it stays at the chosen wall-clock time
    // wherever the phone is, which is what a daily reminder should do.
    `DTSTART:${localStamp(start)}`,
    "DURATION:PT15M",
    "RRULE:FREQ=DAILY",
    `SUMMARY:${escapeText("🌱 Cocher mes habitudes")}`,
    `DESCRIPTION:${escapeText("Ouvre ton jardin et fais le point sur ta journée.")}`,
    `URL:${appUrl}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText("Cocher mes habitudes")}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

export async function shareReminder(hhmm, appUrl) {
  const result = await shareOrDownload(
    buildReminderIcs(hhmm, appUrl),
    `rappel-habitudes-${hhmm.replace(":", "h")}.ics`,
    "text/calendar"
  );
  if (result !== "cancelled") saveReminderTime(hhmm);
  return result;
}
