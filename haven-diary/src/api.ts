/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diary, Comment } from './types';

// API 基础 URL - 可以通过环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * API 响应类型
 */
interface SearchResponse {
  count: number;
  diaries: Diary[];
}

interface CommentsResponse {
  count: number;
  comments: Comment[];
}

interface CreateResponse {
  id: number;
  message: string;
}

/**
 * 搜索参数
 */
interface SearchParams {
  keyword?: string;
  start_date?: string;
  end_date?: string;
  emotion_tag?: string;
  limit?: number;
}

/**
 * API 服务类
 */
class DiaryAPI {
  /**
   * 搜索日记
   */
  async searchDiaries(params: SearchParams = {}): Promise<Diary[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/diaries/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 50,
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      return data.diaries;
    } catch (error) {
      console.error('搜索日记失败:', error);
      throw error;
    }
  }

  /**
   * 根据日期获取日记
   */
  async getDiaryByDate(date: string): Promise<Diary> {
    try {
      const response = await fetch(`${API_BASE_URL}/diaries/date/${date}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取日记失败:', error);
      throw error;
    }
  }

  /**
   * 根据 ID 获取日记
   */
  async getDiaryById(id: number): Promise<Diary> {
    try {
      const response = await fetch(`${API_BASE_URL}/diaries/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取日记失败:', error);
      throw error;
    }
  }

  /**
   * 创建日记
   */
  async createDiary(date: string, title: string, content: string, emotion_tags?: string[], author: 'ai' | 'user' = 'user'): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/diaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          title,
          content,
          author,
          emotion_tags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      const data: CreateResponse = await response.json();
      return data.id;
    } catch (error) {
      console.error('创建日记失败:', error);
      throw error;
    }
  }

  /**
   * 更新日记
   */
  async updateDiary(id: number, content?: string, emotion_tags?: string[], title?: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/diaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          emotion_tags,
          title,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('更新日记失败:', error);
      throw error;
    }
  }

  /**
   * 删除日记
   */
  async deleteDiary(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/diaries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('删除日记失败:', error);
      throw error;
    }
  }

  /**
   * 添加评论
   */
  async addComment(diaryId: number, content: string, author: 'ai' | 'user' = 'user'): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/diaries/${diaryId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          author,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CreateResponse = await response.json();
      return data.id;
    } catch (error) {
      console.error('添加评论失败:', error);
      throw error;
    }
  }

  /**
   * 获取日记的所有评论
   */
  async getComments(diaryId: number): Promise<Comment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/diaries/${diaryId}/comments`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CommentsResponse = await response.json();
      return data.comments;
    } catch (error) {
      console.error('获取评论失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const diaryAPI = new DiaryAPI();
export default diaryAPI;
