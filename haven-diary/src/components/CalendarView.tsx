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
    days.push(<div key={`empty-${i}`} className="aspect-square min-h-10 md:h-20" />);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();
    const diaryExists = hasDiary(i);
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

    days.push(
      <button
        key={i}
        onClick={() => diaryExists && onDateClick(dateStr)}
        className={`aspect-square min-h-10 border border-gray-50 flex flex-col items-center justify-center relative transition-all md:h-20 ${
          diaryExists ? 'hover:bg-accent/10 cursor-pointer' : 'cursor-default text-gray-300'
        } ${isToday ? 'bg-gray-50' : ''}`}
      >
        <span className={`text-sm font-medium ${isToday ? 'text-accent' : ''}`}>{i}</span>
        {diaryExists && (
          <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold">{monthName}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="grid h-11 w-11 place-items-center hover:bg-gray-100 rounded-full transition-colors" aria-label="上个月">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={nextMonth} className="grid h-11 w-11 place-items-center hover:bg-gray-100 rounded-full transition-colors" aria-label="下个月">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 text-center border-b border-gray-50">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days}
      </div>
    </div>
  );
}
