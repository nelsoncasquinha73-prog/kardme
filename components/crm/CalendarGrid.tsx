"use client";

import { useState, useMemo } from "react";

type Lead = {
  id: string;
  name: string;
  email: string;
  step?: string;
  created_at?: string;
  next_followup?: string;
};

type CalendarEvent = {
  id: string;
  leadId: string;
  leadName: string;
  type: "followup" | "created";
  date: string;
  step?: string;
};

type Props = {
  leads: Lead[];
  onLeadClick?: (leadId: string) => void;
};

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const STEP_COLORS: Record<string, string> = {
  novo: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  contactado: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  qualificado: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  proposta: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  fechado: "bg-green-500/20 text-green-300 border-green-500/30",
  perdido: "bg-red-500/20 text-red-300 border-red-500/30",
};

function getStepColor(step?: string) {
  if (!step) return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  return STEP_COLORS[step.toLowerCase()] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";
}

export default function CalendarGrid({ leads, onLeadClick }: Props) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    for (const lead of leads) {
      if (lead.next_followup) {
        result.push({
          id: `followup-${lead.id}`,
          leadId: lead.id,
          leadName: lead.name,
          type: "followup",
          date: lead.next_followup,
          step: lead.step,
        });
      }
      if (lead.created_at) {
        result.push({
          id: `created-${lead.id}`,
          leadId: lead.id,
          leadName: lead.name,
          type: "created",
          date: lead.created_at,
          step: lead.step,
        });
      }
    }
    return result;
  }, [leads]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const d = ev.date.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    }
    return map;
  }, [events]);

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  }

  function getDayKey(day: number) {
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${currentYear}-${mm}-${dd}`;
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const selectedDayEvents = selectedDay
    ? (eventsByDay[getDayKey(selectedDay)] ?? [])
    : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
          >
            Hoje
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Mês anterior"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Próximo mês"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-7 bg-white/5">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-white/40 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-white/5">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - firstDayOfMonth + 1;
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
            const dayKey = isCurrentMonth ? getDayKey(dayNum) : null;
            const dayEvents = dayKey ? (eventsByDay[dayKey] ?? []) : [];
            const isSelected = selectedDay === dayNum && isCurrentMonth;
            const isTodayCell = isCurrentMonth && isToday(dayNum);

            return (
              <div
                key={idx}
                onClick={() => {
                  if (isCurrentMonth) {
                    setSelectedDay(isSelected ? null : dayNum);
                  }
                }}
                className={[
                  "min-h-[72px] p-1.5 flex flex-col gap-1 transition-colors",
                  isCurrentMonth
                    ? "cursor-pointer hover:bg-white/5"
                    : "opacity-20 cursor-default",
                  isSelected ? "bg-blue-500/10 ring-1 ring-inset ring-blue-500/30" : "",
                ].join(" ")}
              >
                <div className="flex justify-end">
                  <span
                    className={[
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isTodayCell
                        ? "bg-blue-500 text-white"
                        : isCurrentMonth
                        ? "text-white/70"
                        : "text-white/20",
                    ].join(" ")}
                  >
                    {isCurrentMonth ? dayNum : ""}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeadClick?.(ev.leadId);
                      }}
                      title={`${ev.leadName} — ${ev.type === "followup" ? "Follow-up" : "Novo lead"}`}
                      className={[
                        "text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity",
                        ev.type === "followup"
                          ? getStepColor(ev.step)
                          : "bg-white/10 text-white/60 border-white/10",
                      ].join(" ")}
                    >
                      {ev.type === "followup" ? "📅" : "🆕"} {ev.leadName}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-white/40 pl-1">
                      +{dayEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selectedDay && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              {selectedDay} de {MONTH_NAMES[currentMonth]}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-white/40">Nenhum evento neste dia.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onLeadClick?.(ev.leadId)}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                >
                  <div className="text-lg">
                    {ev.type === "followup" ? "📅" : "🆕"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                      {ev.leadName}
                    </p>
                    <p className="text-xs text-white/50">
                      {ev.type === "followup" ? "Follow-up agendado" : "Lead criado"}
                      {ev.step && ` · ${ev.step}`}
                    </p>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="text-white/30 group-hover:text-white/60 flex-shrink-0"
                  >
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
