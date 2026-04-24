/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { Diary } from '../types';

interface SearchViewProps {
  diaries: Diary[];
  onDiaryClick: (diary: Diary) => void;
}

export default function SearchView({ diaries, onDiaryClick }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(diaries.flatMap(d => d.emotion_tags || [])));

  const filteredDiaries = diaries.filter(diary => {
    const matchesQuery = diary.content.toLowerCase().includes(query.toLowerCase()) || 
                         diary.date.includes(query);
    const matchesTag = !selectedTag || diary.emotion_tags?.includes(selectedTag);
    return matchesQuery && matchesTag;
  });

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索日记内容、日期..."
            className="w-full bg-bg-sidebar border border-border-subtle rounded-2xl py-4 pl-12 pr-12 text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm sm:text-sm"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center hover:bg-sidebar-hover rounded-full"
              aria-label="清空搜索"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex min-h-8 items-center gap-2 text-xs text-text-secondary mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>情感标签:</span>
          </div>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`min-h-8 text-xs px-3 py-1.5 rounded-full border transition-all ${
                selectedTag === tag 
                  ? 'bg-accent border-accent text-white shadow-sm' 
                  : 'bg-bg-sidebar border-border-subtle text-text-secondary hover:border-accent/50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-text-secondary px-1">
          {filteredDiaries.length > 0 ? `找到 ${filteredDiaries.length} 条相关日记` : '没有找到匹配的日记'}
        </h3>
        
        <div className="grid gap-4">
          {filteredDiaries.map(diary => (
            <button
              key={diary.id}
              onClick={() => onDiaryClick(diary)}
              className="w-full text-left bg-bg-sidebar border border-border-subtle rounded-2xl p-4 hover:border-accent/30 hover:shadow-sm transition-all group sm:p-5"
            >
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-mono text-text-secondary">{diary.date}</span>
                <div className="flex flex-wrap gap-1">
                  {diary.emotion_tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-sidebar-hover text-text-secondary rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-text-secondary line-clamp-2 group-hover:text-text-primary transition-colors">
                {diary.content}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
