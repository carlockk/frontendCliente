import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";
import { useLocal } from "./LocalContext";
import {
  DAY_LABELS,
  formatSlots,
  getSlotsByDay,
  hasAnySchedule,
  isOpenNowBySchedule,
  isTimeAllowedForDay,
  normalizeWebSchedule,
} from "../utils/webSchedule";

const WebScheduleContext = createContext(null);

export const WebScheduleProvider = ({ children }) => {
  const { localId } = useLocal();
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchSchedule = async () => {
      if (!localId) {
        if (mounted) {
          setSchedule([]);
          setScheduleError("");
          setLoadingSchedule(false);
        }
        return;
      }

      setLoadingSchedule(true);
      setScheduleError("");
      try {
        const res = await api.get("/social-config/public");
        const normalized = normalizeWebSchedule(res?.data?.horarios_web);
        if (mounted) setSchedule(normalized);
      } catch {
        if (mounted) {
          setSchedule([]);
          setScheduleError("No se pudo cargar horario de atencion.");
        }
      } finally {
        if (mounted) setLoadingSchedule(false);
      }
    };

    fetchSchedule();
    return () => {
      mounted = false;
    };
  }, [localId]);

  const [clockTick, setClockTick] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setClockTick(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const hasSchedule = useMemo(() => hasAnySchedule(schedule), [schedule]);
  const isOpenNow = useMemo(() => isOpenNowBySchedule(schedule, new Date(clockTick)), [schedule, clockTick]);
  const today = new Date(clockTick).getDay();
  const todaySlots = useMemo(() => getSlotsByDay(schedule, today), [schedule, today]);
  const todayScheduleText = useMemo(() => formatSlots(todaySlots), [todaySlots]);

  const closedMessage = hasSchedule
    ? `Sitio cerrado por horario de atencion. ${
        todaySlots.length > 0
          ? `Hoy atiende en: ${todayScheduleText}.`
          : `Hoy (${DAY_LABELS[today]}) no hay atencion.`
      }`
    : "";

  const value = useMemo(
    () => ({
      loadingSchedule,
      scheduleError,
      schedule,
      hasSchedule,
      isOpenNow,
      todaySlots,
      todayScheduleText,
      closedMessage,
      isPickupTimeAllowed: (time, day = today) => isTimeAllowedForDay(schedule, day, time),
    }),
    [
      loadingSchedule,
      scheduleError,
      schedule,
      hasSchedule,
      isOpenNow,
      todaySlots,
      todayScheduleText,
      closedMessage,
      today,
    ]
  );

  return (
    <WebScheduleContext.Provider value={value}>
      {children}
    </WebScheduleContext.Provider>
  );
};

export const useWebSchedule = () => {
  const ctx = useContext(WebScheduleContext);
  if (!ctx) {
    throw new Error("useWebSchedule debe usarse dentro de WebScheduleProvider");
  }
  return ctx;
};
