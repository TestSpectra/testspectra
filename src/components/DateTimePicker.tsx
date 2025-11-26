import { useState, useEffect } from "react";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

interface DateTimePickerProps {
  value: string; // ISO datetime string or datetime-local format
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  required = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<
    Date | undefined
  >();
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");

  // Parse initial value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setHours(String(date.getHours()).padStart(2, "0"));
        setMinutes(String(date.getMinutes()).padStart(2, "0"));
      }
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateDateTime(date, hours, minutes);
    }
  };

  const handleHoursChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    const num = parseInt(val);
    if (val === "" || (!isNaN(num) && num >= 0 && num <= 23)) {
      const newHours =
        val === "" ? "00" : String(num).padStart(2, "0");
      setHours(newHours);
      if (selectedDate) {
        updateDateTime(selectedDate, newHours, minutes);
      }
    }
  };

  const handleMinutesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    const num = parseInt(val);
    if (val === "" || (!isNaN(num) && num >= 0 && num <= 59)) {
      const newMinutes =
        val === "" ? "00" : String(num).padStart(2, "0");
      setMinutes(newMinutes);
      if (selectedDate) {
        updateDateTime(selectedDate, hours, newMinutes);
      }
    }
  };

  const updateDateTime = (date: Date, h: string, m: string) => {
    const newDate = new Date(date);
    newDate.setHours(parseInt(h) || 0);
    newDate.setMinutes(parseInt(m) || 0);

    // Format to datetime-local format: YYYY-MM-DDTHH:MM
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(
      2,
      "0",
    );
    const day = String(newDate.getDate()).padStart(2, "0");
    const hours = String(newDate.getHours()).padStart(2, "0");
    const minutes = String(newDate.getMinutes()).padStart(
      2,
      "0",
    );

    onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const displayValue = () => {
    if (selectedDate) {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const day = selectedDate.getDate();
      const month = months[selectedDate.getMonth()];
      const year = selectedDate.getFullYear();
      return `${month} ${day}, ${year} ${hours}:${minutes}`;
    }
    return placeholder;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={
          (className ||
            "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left") +
          " flex flex-row items-center justify-between"
        }
      >
        <span
          className={
            selectedDate ? "text-slate-200" : "text-slate-500"
          }
        >
          {displayValue()}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <>
          {/* Overlay to close when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute z-50 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 w-auto">
            <div className="space-y-4">
              {/* Calendar */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className="rounded-md border-0"
              />

              {/* Time Picker */}
              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    Time
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={handleHoursChange}
                    className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-center text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-400">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={handleMinutesChange}
                    className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-center text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="bg-transparent border-slate-600 text-slate-100 hover:bg-slate-700 hover:text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}