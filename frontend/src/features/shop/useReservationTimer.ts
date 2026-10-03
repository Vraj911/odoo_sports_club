import { useState, useEffect } from "react";

/** Returns seconds remaining from a reservation timestamp (10 min window). */
export function useReservationCountdown(reservedAt: number): number {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = Date.now() - reservedAt;
    const remaining = Math.max(0, 600 - Math.floor(elapsed / 1000));
    return remaining;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - reservedAt;
      const remaining = Math.max(0, 600 - Math.floor(elapsed / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [reservedAt]);

  return secondsLeft;
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
