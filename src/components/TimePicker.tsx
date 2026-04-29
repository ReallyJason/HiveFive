import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  selectedDate?: string;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function parse(value: string) {
  const m = value?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { hour: null as number | null, minute: null as number | null, period: 'AM' as 'AM' | 'PM' };
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 1 || h > 12 || min < 0 || min > 59) return { hour: null, minute: null, period: 'AM' as 'AM' | 'PM' };
  return { hour: h, minute: min, period: m[3].toUpperCase() as 'AM' | 'PM' };
}

function fmt(m: number) { return m.toString().padStart(2, '0'); }

function build(h: number | null, m: number | null, p: 'AM' | 'PM') {
  if (h === null || m === null) return '';
  return `${h}:${fmt(m)} ${p}`;
}

function parseYMD(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function toMinutesOfDay(h: number, m: number, p: 'AM' | 'PM'): number {
  let hh = h % 12;
  if (p === 'PM') hh += 12;
  return hh * 60 + m;
}

export function TimePicker({
  value,
  onChange,
  selectedDate,
  placeholder = 'Select time',
  className = '',
}: TimePickerProps) {
  const p = parse(value);
  const now = new Date();
  const selected = selectedDate ? parseYMD(selectedDate) : null;
  const isToday = selected ? sameDay(selected, now) : false;
  const minMinutes = now.getHours() * 60 + now.getMinutes();
  const fallbackPeriod: 'AM' | 'PM' = now.getHours() >= 12 ? 'PM' : 'AM';

  const [hour, setHour] = useState<number | null>(p.hour);
  const [minute, setMinute] = useState<number | null>(p.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(p.period);
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const hRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<HTMLDivElement>(null);

  const isSelectable = (h: number | null, m: number | null, per: 'AM' | 'PM') => {
    if (h === null || m === null) return false;
    if (!isToday) return true;
    return toMinutesOfDay(h, m, per) >= minMinutes;
  };

  const anySelectableForHour = (h: number) => {
    if (!isToday) return true;
    return (['AM', 'PM'] as const).some(per => MINUTES.some(m => isSelectable(h, m, per)));
  };

  const anySelectableForPeriod = (per: 'AM' | 'PM') => {
    if (!isToday) return true;
    return HOURS.some(h => MINUTES.some(m => isSelectable(h, m, per)));
  };

  const firstMinuteFor = (h: number, per: 'AM' | 'PM') => MINUTES.find(m => isSelectable(h, m, per)) ?? null;

  const firstPairForPeriod = (per: 'AM' | 'PM'): { h: number; m: number } | null => {
    for (const h of HOURS) {
      for (const m of MINUTES) {
        if (isSelectable(h, m, per)) return { h, m };
      }
    }
    return null;
  };

  const minuteDisabled = (m: number) => {
    if (!isToday) return false;
    if (hour !== null) return !isSelectable(hour, m, period);
    return !HOURS.some(h => isSelectable(h, m, period));
  };

  const hourDisabled = (h: number) => !anySelectableForHour(h);

  const periodDisabled = (per: 'AM' | 'PM') => {
    if (!isToday) return false;
    if (hour !== null && minute !== null) return !isSelectable(hour, minute, per);
    if (hour !== null) return MINUTES.every(m => !isSelectable(hour, m, per));
    if (minute !== null) return HOURS.every(h => !isSelectable(h, minute, per));
    return !anySelectableForPeriod(per);
  };

  useEffect(() => {
    const v = parse(value);
    const nextPeriod = (v.hour === null && v.minute === null && isToday) ? fallbackPeriod : v.period;
    if (v.hour !== null && v.minute !== null && !isSelectable(v.hour, v.minute, nextPeriod)) {
      setHour(null);
      setMinute(null);
      setPeriod(fallbackPeriod);
      if (value) onChange('');
      return;
    }
    setHour(v.hour);
    setMinute(v.minute);
    setPeriod(nextPeriod);
  }, [value, selectedDate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      [hRef, mRef].forEach(r => {
        const el = r.current?.querySelector('[data-sel="true"]');
        if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
    });
  }, [open, hour, minute]);

  const emit = (h: number | null, m: number | null, per: 'AM' | 'PM') => {
    if (!isSelectable(h, m, per)) return;
    const s = build(h, m, per);
    if (s) onChange(s);
  };

  const pickHour = (h: number) => {
    if (hourDisabled(h)) return;
    setHour(h);
    let nextPeriod = period;
    let nextMinute = minute;

    if (nextMinute === null || !isSelectable(h, nextMinute, nextPeriod)) {
      nextMinute = firstMinuteFor(h, nextPeriod);
      if (nextMinute === null) {
        const alt: 'AM' | 'PM' = nextPeriod === 'AM' ? 'PM' : 'AM';
        const altMinute = firstMinuteFor(h, alt);
        if (altMinute !== null) {
          nextPeriod = alt;
          nextMinute = altMinute;
          setPeriod(alt);
        }
      }
    }

    setMinute(nextMinute);
    emit(h, nextMinute, nextPeriod);
  };

  const pickMinute = (m: number) => {
    if (minuteDisabled(m)) return;
    setMinute(m);
    let nextHour = hour;

    if (nextHour === null) {
      nextHour = HOURS.find(h => isSelectable(h, m, period)) ?? null;
      if (nextHour !== null) setHour(nextHour);
    }

    emit(nextHour, m, period);
  };

  const pickPeriod = (per: 'AM' | 'PM') => {
    if (periodDisabled(per)) return;
    setPeriod(per);
    let nextHour = hour;
    let nextMinute = minute;

    if (nextHour !== null && nextMinute !== null && isSelectable(nextHour, nextMinute, per)) {
      emit(nextHour, nextMinute, per);
      return;
    }

    if (nextHour !== null) {
      const m = firstMinuteFor(nextHour, per);
      if (m !== null) {
        nextMinute = m;
        setMinute(m);
        emit(nextHour, m, per);
        return;
      }
    }

    const pair = firstPairForPeriod(per);
    if (pair) {
      nextHour = pair.h;
      nextMinute = pair.m;
      setHour(nextHour);
      setMinute(nextMinute);
      emit(nextHour, nextMinute, per);
      return;
    }

    setHour(null);
    setMinute(null);
    onChange('');
  };

  const display = build(hour, minute, period);

  const colStyle: React.CSSProperties = {
    maxHeight: 176,
    overflowY: 'auto',
    borderRadius: 8,
    padding: 3,
    scrollbarWidth: 'none',
  };

  const itemBase: React.CSSProperties = {
    width: '100%',
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    padding: 0,
  };

  const selStyle: React.CSSProperties = { ...itemBase, background: '#E9A020', color: '#1A1A1A', fontWeight: 700 };
  const defStyle: React.CSSProperties = { ...itemBase, background: 'transparent', color: '#4B5563' };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-12 px-4 bg-white border-2 rounded-xl text-left flex items-center gap-3 shadow-sm transition-all font-sans ${
          open
            ? 'border-honey-500 ring-4 ring-honey-100'
            : 'border-charcoal-200 focus:border-honey-500 focus:ring-4 focus:ring-honey-100'
        } ${display ? 'text-charcoal-900' : 'text-charcoal-400'}`}
      >
        <Clock className="size-5 text-charcoal-400 shrink-0" />
        <span className="truncate text-base">{display || placeholder}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-2 bg-white border border-charcoal-100 rounded-xl shadow-2xl"
          style={{ padding: 10 }}
        >
          {/* Column headers */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Hour
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Min
            </div>
            <div style={{ width: 56, textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              &nbsp;
            </div>
          </div>

          {/* Columns */}
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Hours */}
            <div ref={hRef} className="bg-cream-50" style={{ ...colStyle, flex: 1 }}>
              {HOURS.map(h => (
                <button
                  key={h}
                  type="button"
                  data-sel={hour === h}
                  disabled={hourDisabled(h)}
                  onClick={() => pickHour(h)}
                  style={
                    hourDisabled(h)
                      ? { ...defStyle, color: '#D1D5DB', cursor: 'not-allowed' }
                      : (hour === h ? selStyle : defStyle)
                  }
                  onMouseEnter={e => {
                    if (!hourDisabled(h) && hour !== h) e.currentTarget.style.background = '#FEF7E8';
                  }}
                  onMouseLeave={e => {
                    if (!hourDisabled(h) && hour !== h) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {h}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div ref={mRef} className="bg-cream-50" style={{ ...colStyle, flex: 1 }}>
              {MINUTES.map(m => (
                <button
                  key={m}
                  type="button"
                  data-sel={minute === m}
                  disabled={minuteDisabled(m)}
                  onClick={() => pickMinute(m)}
                  style={
                    minuteDisabled(m)
                      ? { ...defStyle, color: '#D1D5DB', cursor: 'not-allowed' }
                      : (minute === m ? selStyle : defStyle)
                  }
                  onMouseEnter={e => {
                    if (!minuteDisabled(m) && minute !== m) e.currentTarget.style.background = '#FEF7E8';
                  }}
                  onMouseLeave={e => {
                    if (!minuteDisabled(m) && minute !== m) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {fmt(m)}
                </button>
              ))}
            </div>

            {/* AM/PM */}
            <div style={{ width: 56, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(['AM', 'PM'] as const).map(per => (
                <button
                  key={per}
                  type="button"
                  disabled={periodDisabled(per)}
                  onClick={() => pickPeriod(per)}
                  className="bg-cream-50"
                  style={{
                    ...itemBase,
                    height: 40,
                    borderRadius: 8,
                    ...(periodDisabled(per)
                      ? { color: '#D1D5DB', cursor: 'not-allowed' }
                      : period === per
                      ? { background: '#E9A020', color: '#1A1A1A', fontWeight: 700 }
                      : { color: '#4B5563' }),
                  }}
                  onMouseEnter={e => {
                    if (!periodDisabled(per) && period !== per) e.currentTarget.style.background = '#FEF7E8';
                  }}
                  onMouseLeave={e => {
                    if (!periodDisabled(per) && period !== per) {
                      e.currentTarget.style.background = period === per ? '#E9A020' : '';
                    }
                  }}
                >
                  {per}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
