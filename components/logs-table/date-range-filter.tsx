"use client"

import Datepicker, { type DateValueType } from "react-tailwindcss-datepicker"
import dayjs from "dayjs"
import { CalendarIcon } from "lucide-react"

interface DateRangeFilterProps {
  value: DateValueType
  onChange: (value: DateValueType) => void
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const handleDateChange = (newValue: DateValueType) => {
    if (newValue?.startDate && newValue?.endDate) {
      onChange({
        startDate: dayjs(newValue.startDate).startOf("day").toDate(),
        endDate: dayjs(newValue.endDate).endOf("day").toDate()
      })
    } else {
      onChange(newValue)
    }
  }

  return (
    <div className="relative w-full md:max-w-sm">
      <Datepicker
        value={value}
        displayFormat="DD MMM YYYY"
        separator=" - "
        onChange={handleDateChange}
        configs={{
          shortcuts: {
            today: "Today",
            yesterday: "Yesterday",
            past2Days: {
              text: "Last 2 days",
              period: {
                start: dayjs().subtract(2, "day").toDate(),
                end: dayjs().toDate()
              }
            },
            past3Days: {
              text: "Last 3 days",
              period: {
                start: dayjs().subtract(3, "day").toDate(),
                end: dayjs().toDate()
              }
            },
            past: (period) => `Last ${period} days`,
            currentMonth: "This month",
            pastMonth: "Last month"
          }
        }}
        showShortcuts
        useRange
        readOnly
        toggleClassName="hidden" // Date shouldn't be cleared out
        inputName="date-range-filter"
        inputClassName="relative border border-input text-foreground h-9 rounded-md py2.5 pl-3 pr-8 w-full text-base shadow-xs transition-[color,box-shadow] outline-none cursor-pointer md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground"
      />
      <CalendarIcon className="-translate-y-1/2 -z-10 pointer-events-none absolute top-1/2 right-3 h-4 w-4 text-muted-foreground" />
    </div>
  )
}
