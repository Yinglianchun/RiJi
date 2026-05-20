/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString('zh-CN', { month: 'long', year: 'numeric' });

  const hasDiary = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return diaries.some(d => d.date === dateStr);
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-12 border-r border-b border-border-subtle/50 bg-bg-main/40 sm:h-16 md:h-20" />);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();
    const diaryExists = hasDiary(i);
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

    days.push(
      <button
        key={i}
        onClick={() => diaryExists && onDateClick(dateStr)}
        className={`group relative flex h-12 w-full flex-col items-center justify-center border-r border-b border-border-subtle/50 transition-all duration-200 ease-out sm:h-16 md:h-20 ${
          diaryExists ? 'cursor-pointer hover:border-accent/25 hover:bg-accent/5' : 'cursor-default text-text-secondary/45'
        } ${isToday ? 'bg-accent/10 ring-1 ring-inset ring-accent/20' : 'bg-bg-main/70'}`}
      >
        <span className={`text-sm font-medium transition-colors ${isToday ? 'text-accent' : diaryExists ? 'group-hover:text-accent' : ''}`}>{i}</span>
        {diaryExists && (
          <div className="absolute bottom-2 h-1.5 w-1.5 rounded-full bg-accent/70 shadow-[0_0_0_3px_rgba(124,124,240,0.12)]" />
        )}
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border-subtle/80 bg-bg-main shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:shadow-none">
      <div className="flex items-center justify-between border-b border-border-subtle/70 px-5 py-5 sm:px-7 sm:py-6">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{monthName}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="grid h-10 w-10 place-items-center rounded-full text-text-secondary transition-colors hover:bg-sidebar-hover hover:text-text-primary sm:h-11 sm:w-11" aria-label="上个月">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={nextMonth} className="grid h-10 w-10 place-items-center rounded-full text-text-secondary transition-colors hover:bg-sidebar-hover hover:text-text-primary sm:h-11 sm:w-11" aria-label="下个月">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-border-subtle/70 bg-bg-sidebar/45 text-center">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-bg-main">
        {days}
      </div>
    </div>
  );
}
