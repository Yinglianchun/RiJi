/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Diary } from '../types';

interface CalendarViewProps {
  diaries: Diary[];
  onDateClick: (date: string) => void;
}

export default function CalendarView({ diaries, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const diaryDates = useMemo(() => new Set(diaries.map(diary => diary.date)), [diaries]);
  const monthDiaryCount = diaries.filter(diary => diary.date.startsWith(monthPrefix)).length;

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString('zh-CN', { month: 'long', year: 'numeric' });

  const hasDiary = (day: number) => {
    const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    return diaryDates.has(dateStr);
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} aria-hidden="true" className="min-h-11 sm:min-h-16 md:min-h-20" />);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();
    const diaryExists = hasDiary(i);
    const dateStr = `${monthPrefix}-${String(i).padStart(2, '0')}`;
    const isSelected = selectedDate === dateStr;

    days.push(
      <button
        key={i}
        onClick={() => {
          if (!diaryExists) return;
          setSelectedDate(dateStr);
          onDateClick(dateStr);
        }}
        className={`group relative flex min-h-11 w-full items-center justify-center rounded-md text-center transition-colors duration-200 ease-out sm:min-h-16 md:min-h-20 ${
          diaryExists
            ? 'cursor-pointer text-text-primary hover:text-accent'
            : 'cursor-default text-text-secondary/55'
        } ${isToday && !isSelected ? 'text-accent' : ''}`}
      >
        <span
          className={`grid h-9 w-9 place-items-center rounded-full text-sm font-medium leading-none transition-all duration-200 sm:h-10 sm:w-10 sm:text-base ${
            isSelected
              ? 'bg-accent text-bg-main shadow-[0_10px_24px_rgba(124,124,240,0.28)]'
              : 'group-hover:bg-accent/8'
          }`}
        >
          {i}
        </span>
        {diaryExists && (
          <span className={`absolute bottom-2 h-1.5 w-1.5 rounded-full shadow-[0_0_0_3px_rgba(124,124,240,0.12)] transition-colors duration-200 ${
            isSelected ? 'bg-bg-main' : 'bg-accent/70 group-hover:bg-accent'
          }`} />
        )}
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-main shadow-[0_28px_70px_rgba(15,23,42,0.10)] dark:bg-bg-sidebar dark:shadow-none">
      <div className="flex flex-col gap-5 border-b border-border-subtle bg-bg-sidebar/55 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-secondary">本月日记</p>
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{monthName}</h2>
              <span className="pb-1 text-xs font-medium text-text-secondary">{monthDiaryCount} 篇记录</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="grid h-10 w-10 place-items-center rounded-md border border-border-subtle bg-bg-main text-text-secondary shadow-sm transition-colors hover:border-accent/30 hover:text-text-primary sm:h-11 sm:w-11" aria-label="上个月">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={nextMonth} className="grid h-10 w-10 place-items-center rounded-md border border-border-subtle bg-bg-main text-text-secondary shadow-sm transition-colors hover:border-accent/30 hover:text-text-primary sm:h-11 sm:w-11" aria-label="下个月">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              {day}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 bg-bg-main p-3 sm:gap-2 sm:p-5 md:p-6 dark:bg-bg-sidebar">
        {days}
      </div>
    </div>
  );
}
