const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

export const parseTimeToMinutes = (raw) => {
  const value = String(raw || "").trim();
  const match = value.match(TIME_RE);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const normalizeWebSchedule = (raw) => {
  if (!Array.isArray(raw)) return [];

  const byDay = new Map();

  raw.forEach((entry) => {
    const day = Number(entry?.dia);
    if (!Number.isInteger(day) || day < 0 || day > 6) return;
    const slots = Array.isArray(entry?.tramos) ? entry.tramos : [];

    const normalized = slots
      .map((slot) => {
        const ini = parseTimeToMinutes(slot?.inicio);
        const fin = parseTimeToMinutes(slot?.fin);
        if (ini === null || fin === null || fin <= ini) return null;
        return { ini, fin };
      })
      .filter(Boolean)
      .sort((a, b) => a.ini - b.ini);

    byDay.set(
      day,
      normalized.map((slot) => ({
        inicio: `${String(Math.floor(slot.ini / 60)).padStart(2, "0")}:${String(slot.ini % 60).padStart(2, "0")}`,
        fin: `${String(Math.floor(slot.fin / 60)).padStart(2, "0")}:${String(slot.fin % 60).padStart(2, "0")}`,
      }))
    );
  });

  return Array.from(byDay.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dia, tramos]) => ({ dia, tramos }));
};

export const hasAnySchedule = (schedule = []) =>
  Array.isArray(schedule) &&
  schedule.some((entry) => Array.isArray(entry?.tramos) && entry.tramos.length > 0);

export const getSlotsByDay = (schedule = [], day) => {
  const entry = (Array.isArray(schedule) ? schedule : []).find(
    (item) => Number(item?.dia) === Number(day)
  );
  return Array.isArray(entry?.tramos) ? entry.tramos : [];
};

export const isMinuteInsideSlots = (minute, slots = []) =>
  slots.some((slot) => {
    const ini = parseTimeToMinutes(slot?.inicio);
    const fin = parseTimeToMinutes(slot?.fin);
    if (ini === null || fin === null) return false;
    return minute >= ini && minute < fin;
  });

export const isTimeAllowedForDay = (schedule = [], day, time) => {
  const minute = parseTimeToMinutes(time);
  if (minute === null) return false;
  if (!hasAnySchedule(schedule)) return true;
  const slots = getSlotsByDay(schedule, day);
  return isMinuteInsideSlots(minute, slots);
};

export const isOpenNowBySchedule = (schedule = [], now = new Date()) => {
  if (!hasAnySchedule(schedule)) return true;
  const day = now.getDay();
  const minute = now.getHours() * 60 + now.getMinutes();
  return isMinuteInsideSlots(minute, getSlotsByDay(schedule, day));
};

export const formatSlots = (slots = []) =>
  slots
    .map((slot) => `${slot.inicio}-${slot.fin}`)
    .join(", ");
