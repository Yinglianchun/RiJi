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
    days.push(<div key={`empty-${i}`} aria-hidden="true" className="min-h-11 rounded-md bg-bg-sidebar/45 sm:min-h-16 md:min-h-20" />);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();
    const diaryExists = hasDiary(i);
    const dateStr = `${monthPrefix}-${String(i).padStart(2, '0')}`;

    days.push(
      <button
        key={i}
        onClick={() => diaryExists && onDateClick(dateStr)}
        className={`group relative flex min-h-11 w-full flex-col items-start justify-between rounded-md border px-2 py-2 text-left transition-all duration-200 ease-out sm:min-h-16 sm:px-3 md:min-h-20 md:p-3 ${
          diaryExists
            ? 'cursor-pointer border-border-subtle bg-bg-main shadow-[0_10px_24px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:border-accent/35 hover:bg-accent/5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]'
            : 'cursor-default border-transparent bg-bg-sidebar/45 text-text-secondary/45'
        } ${isToday ? 'border-accent/30 bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(124,124,240,0.16)]' : ''}`}
      >
        <span className={`text-sm font-semibold leading-none transition-colors sm:text-base ${isToday ? 'text-accent' : diaryExists ? 'text-text-primary group-hover:text-accent' : ''}`}>{i}</span>
        {diaryExists && (
          <span className="h-1.5 w-5 rounded-full bg-accent/70 shadow-[0_0_0_3px_rgba(124,124,240,0.10)] transition-all duration-200 group-hover:w-7 group-hover:bg-accent" />
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
            <div key={day} className="rounded-md bg-bg-main/70 py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
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
