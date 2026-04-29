import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function same(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DatePicker({ value, onChange, placeholder = 'Select a date', minDate, className = '' }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sel = parseDate(value);
  const min = minDate ? parseDate(minDate) : null;

  const [open, setOpen] = useState(false);
  const [vYear, setVYear] = useState(sel ? sel.getFullYear() : today.getFullYear());
  const [vMonth, setVMonth] = useState(sel ? sel.getMonth() : today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = parseDate(value);
    if (d) { setVYear(d.getFullYear()); setVMonth(d.getMonth()); }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prev = () => { if (vMonth === 0) { setVMonth(11); setVYear(vYear - 1); } else setVMonth(vMonth - 1); };
  const next = () => { if (vMonth === 11) { setVMonth(0); setVYear(vYear + 1); } else setVMonth(vMonth + 1); };

  const pick = (d: Date) => { onChange(toYMD(d)); setOpen(false); };

  const disabled = (d: Date) => min ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) < new Date(min.getFullYear(), min.getMonth(), min.getDate()) : false;

  // Build calendar cells
  const daysInMonth = new Date(vYear, vMonth + 1, 0).getDate();
  const firstDow = new Date(vYear, vMonth, 1).getDay();
  const pMonth = vMonth === 0 ? 11 : vMonth - 1;
  const pYear = vMonth === 0 ? vYear - 1 : vYear;
  const daysInPrev = new Date(pYear, pMonth + 1, 0).getDate();

  type Cell = { date: Date; current: boolean };
  const cells: Cell[] = [];

  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ date: new Date(pYear, pMonth, daysInPrev - i), current: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(vYear, vMonth, d), current: true });
  const nMonth = vMonth === 11 ? 0 : vMonth + 1;
  const nYear = vMonth === 11 ? vYear + 1 : vYear;
  const rows = Math.ceil(cells.length / 7);
  const total = rows * 7;
  for (let d = 1; cells.length < total; d++)
    cells.push({ date: new Date(nYear, nMonth, d), current: false });

  const displayText = sel
    ? sel.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-12 px-4 bg-white border-2 rounded-xl text-left flex items-center gap-3 shadow-sm transition-all ${
          open
            ? 'border-honey-500 ring-4 ring-honey-100'
            : 'border-charcoal-200 focus:border-honey-500 focus:ring-4 focus:ring-honey-100'
        } ${value ? 'text-charcoal-900' : 'text-charcoal-400'}`}
      >
        <Calendar className="size-5 text-charcoal-400 shrink-0" />
        <span className="truncate text-base font-sans">{displayText}</span>
      </button>

      {/* Calendar Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-2 bg-white border border-charcoal-100 rounded-xl shadow-2xl p-3"
          style={{ width: 284, left: '50%', transform: 'translateX(-50%)' }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prev}
              className="flex items-center justify-center rounded-lg text-charcoal-500 hover:bg-honey-50 transition-colors"
              style={{ width: 32, height: 32 }}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-sans font-bold text-sm text-charcoal-900 select-none">
              {MONTHS[vMonth]} {vYear}
            </span>
            <button
              type="button"
              onClick={next}
              className="flex items-center justify-center rounded-lg text-charcoal-500 hover:bg-honey-50 transition-colors"
              style={{ width: 32, height: 32 }}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
            {DAYS.map((d) => (
              <div
                key={d}
                className="flex items-center justify-center text-charcoal-400 font-medium select-none"
                style={{ height: 32, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((c, i) => {
              const dis = disabled(c.date);
              const isSel = sel && same(c.date, sel);
              const isTod = same(c.date, today);

              let bg = 'transparent';
              let color = c.current ? '#374151' : '#CBD5E1';
              let fontWeight = '400';
              let border = 'none';
              let cursor = 'pointer';

              if (dis) {
                color = '#E2E8F0';
                cursor = 'not-allowed';
              } else if (isSel) {
                bg = '#E9A020';
                color = '#1A1A1A';
                fontWeight = '700';
              } else if (isTod && !isSel) {
                border = '2px solid #F0C96B';
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={dis}
                  onClick={() => !dis && pick(c.date)}
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    background: bg,
                    color,
                    fontWeight,
                    border,
                    cursor,
                    transition: 'background 0.15s, color 0.15s',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!dis && !isSel) {
                      e.currentTarget.style.background = '#FEF7E8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!dis && !isSel) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {c.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
