import React, { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ date, setDate, className = "", placeholder = "Seleziona periodo..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className="flex items-center justify-between w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-black outline-none focus-within:border-[#32964D] cursor-pointer text-slate-600"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span>
            {date?.from ? (
              date.to ? (
                <>{format(date.from, "dd/MM/yyyy", { locale: it })} - {format(date.to, "dd/MM/yyyy", { locale: it })}</>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: it })
              )
            ) : (
              <span className="text-slate-400 font-normal">{placeholder}</span>
            )}
          </span>
        </div>
        {date?.from && (
          <button onClick={handleClear} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-3 h-3 text-slate-500" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-14 left-0 z-50 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 no-print">
          <DayPicker
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            locale={it}
            numberOfMonths={2}
            className="font-sans text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
