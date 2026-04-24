/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Comment {
  id: number;
  diary_id: number;
  content: string;
  author: 'ai' | 'user';
  created_at: string;
}

export interface Diary {
  id: number;
  date: string;
  title: string;
  content: string;
  author: 'ai' | 'user';
  emotion_tags: string[] | null;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
}

export type ViewType = 'timeline' | 'calendar' | 'search' | 'memory-lane' | 'write';
