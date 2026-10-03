import type { Booking } from "@/features/booking/types";

export function downloadCalendarEvent(booking: Booking) {
  const [year, month, day] = booking.date.split("-").map(Number);
  const [startH, startM] = booking.startTime.split(":").map(Number);
  const [endH, endM] = booking.endTime.split(":").map(Number);

  if (!year || !month || !day) return;

  const pad = (n: number) => String(n).padStart(2, "0");

  const startIso = `${year}${pad(month)}${pad(day)}T${pad(startH ?? 0)}${pad(startM ?? 0)}00`;
  const endIso = `${year}${pad(month)}${pad(day)}T${pad(endH ?? 0)}${pad(endM ?? 0)}00`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Champions Club Management System//CCMS Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:booking-${booking.id}@ccms.club`,
    `DTSTAMP:${startIso}Z`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${booking.courtName} - ${booking.sport.toUpperCase()} (CCMS)`,
    `DESCRIPTION:Sports session at Champions Club.\\nCourt: ${booking.courtName}\\nBooking Ref: #${booking.id}\\nPrice: INR ${booking.price}\\nStatus: ${booking.status}`,
    `LOCATION:Champions Club - ${booking.courtName}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `booking-${booking.id}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
