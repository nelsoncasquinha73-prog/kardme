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

type LeadTask = {
  id: string;
  lead_id: string;
  title: string;
  due_at: string;
  status: string;
  action_type: string | null;
};

type CalendarEvent = {
  id: string;
  leadId: string;
  leadName: string;
  type: "followup" | "created" | "task";
  date: string;
  step?: string;
  taskTitle?: string;
  actionType?: string | null;
};

type Props = {
  leads: Lead[];
  tasks?: LeadTask[];
  onLeadClick?: (leadId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onMonthChange?: (year: number, month: number) => void;
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

const ACTION_ICONS: Record<string, string> = {
  follow_up: "✅",
  email: "📧",
  whatsapp: "💬",
  call: "📞",
  sms: "✉️",
  meeting: "📅",
};

function getStepColor(step?: string) {
  if (!step) return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  return STEP_COLORS[step.toLowerCase()] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";
}

export default function CalendarGrid({ leads, tasks = [], onLeadClick, onTaskClick, onMonthChange }: Props) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const leadById = useMemo(() => {
    const map = new Map<string, Lead>();
    for (const lead of leads) map.set(lead.id, lead);
    return map;
  }, [leads]);

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    for (const lead of leads) {
      if (lead.created_at) {
        result.push({ id: `created-${lead.id}`, leadId: lead.id, leadName: lead.name, type: "created", date: lead.created_at, step: lead.step });
      }
      if (lead.next_followup) {
        result.push({ id: `followup-${lead.id}`, leadId: lead.id, leadName: lead.name, type: "followup", date: lead.next_followup, step: lead.step });
      }
    }
    for (const task of tasks) {
      const lead = leadById.get(task.lead_id);
      result.push({ id: `task-${task.id}`, leadId: task.lead_id, leadName: lead?.name ?? "Lead", type: "task", date: task.due_at, step: lead?.step, taskTitle: task.title, actionType: task.action_type });
    }
    return result;
  }, [leads, tasks, leadById]);

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
    let y = currentYear, m = currentMonth;
    if (m === 0) { m = 11; y -= 1; } else { m -= 1; }
    setCurrentYear(y); setCurrentMonth(m); setSelectedDay(null); onMonthChange?.(y, m);
  }

  function nextMonth() {
    let y = currentYear, m = currentMonth;
    if (m === 11) { m = 0; y += 1; } else { m += 1; }
    setCurrentYear(y); setCurrentMonth(m); setSelectedDay(null); onMonthChange?.(y, m);
  }

  function goToToday() {
    setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); setSelectedDay(today.getDate());
    onMonthChange?.(today.getFullYear(), today.getMonth());
  }

  function getDayKey(day: number) {
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${currentYear}-${mm}-${dd}`;
  }

  const isToday = (day: number) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  const selectedDayEvents = selectedDay ? (eventsByDay[getDayKey(selectedDay)] ?? []) : [];

  function getEventStyle(ev: CalendarEvent) {
    if (ev.type === "task") return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    if (ev.type === "followup") return getStepColor(ev.step);
    return "bg-white/10 text-white/60 border-white/10";
  }

  function getEventIcon(ev: CalendarEvent) {
    if (ev.type === "task") return ACTION_ICONS[ev.actionType ?? "follow_up"] ?? "✅";
    if (ev.type === "followup") return "📅";
    return "🆕";
  }

  function getEventLabel(ev: CalendarEvent) {
    if (ev.type === "task") return ev.taskTitle ?? ev.leadName;
    return ev.leadName;
  }

  function getEventSubtitle(ev: CalendarEvent) {
    if (ev.type === "task") return `Tarefa · ${ev.leadName}`;
    if (ev.type === "followup") return `Follow-up · ${ev.step ?? ""}`;
    return `Lead criado · ${ev.step ?? ""}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">{MONTH_NAMES[currentMonth]} {currentYear}</h2>
          <button onClick={goToToday} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/15 transition-colors">Hoje</button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" aria-label="Mes anterior">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" aria-label="Proximo mes">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-white/50">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Tarefas</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> Follow-ups</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/30 inline-block"></span> Leads criados</span>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-7 bg-white/5">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-white/40 uppercase tracking-wide">{d}</div>
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
            const hasTask = dayEvents.some(e => e.type === "task");
            return (
              <div
                key={idx}
                onClick={() => { if (isCurrentMonth) setSelectedDay(isSelected ? null : dayNum); }}
                className={["min-h-[72px] p-1.5 flex flex-col gap-1 transition-colors", isCurrentMonth ? "cursor-pointer hover:bg-white/5" : "opacity-20 cursor-default", isSelected ? "bg-blue-500/10 ring-1 ring-inset ring-blue-500/30" : ""].join(" ")}
              >
                <div className="flex justify-end items-start gap-1">
                  {hasTask && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>}
                  <span className={["text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full", isTodayCell ? "bg-blue-500 text-white" : isCurrentMonth ? "text-white/70" : "text-white/20"].join(" ")}>
                    {isCurrentMonth ? dayNum : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); if (ev.type === 'task') { const taskId = ev.id.replace('task-', ''); onTaskClick?.(taskId); } else { onLeadClick?.(ev.leadId); } }}
                      title={`${getEventLabel(ev)} - ${getEventSubtitle(ev)}`}
                      className={["text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity", getEventStyle(ev)].join(" ")}
                    >
                      {getEventIcon(ev)} {getEventLabel(ev)}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[10px] text-white/40 pl-1">+{dayEvents.length - 2} mais</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">{selectedDay} de {MONTH_NAMES[currentMonth]}</h3>
            <button onClick={() => setSelectedDay(null)} className="text-white/40 hover:text-white/70 transition-colors">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-white/40">Nenhum evento neste dia.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => { if (ev.type === 'task') { const taskId = ev.id.replace('task-', ''); onTaskClick?.(taskId); } else { onLeadClick?.(ev.leadId); } }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                >
                  <div className="text-lg">{getEventIcon(ev)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">{getEventLabel(ev)}</p>
                    <p className="text-xs text-white/50">{getEventSubtitle(ev)}</p>
                  </div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-white/30 group-hover:text-white/60 flex-shrink-0">
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
