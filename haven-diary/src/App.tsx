/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactQuill from 'react-quill-new';
import {
  BookHeart,
  Calendar as CalendarIcon,
  Search as SearchIcon,
  Clock,
  Menu,
  X,
  ChevronRight,
  MessageCircle,
  Heart,
  Plus,
  Moon,
  Sun,
  Sparkles,
  History,
  PenLine,
  Save,
  Trash2,
  Edit2
} from 'lucide-react';
import { Diary, ViewType, Comment } from './types';
import CalendarView from './components/CalendarView';
import SearchView from './components/SearchView';
import diaryAPI from './api';

type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'danger';
  onConfirm: () => void | Promise<void>;
}

const getShanghaiToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

export default function App() {
  const [view, setView] = useState<ViewType>('memory-lane');
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  // 加载日记数据
  useEffect(() => {
    loadDiaries();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncLayout = () => {
      const matches = mediaQuery.matches;
      setIsMobile(matches);
      setIsSidebarOpen(!matches);
    };

    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);
    return () => mediaQuery.removeEventListener('change', syncLayout);
  }, []);

  const loadDiaries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await diaryAPI.searchDiaries({ limit: 50 });
      setDiaries(data);
    } catch (err) {
      console.error('加载日记失败:', err);
      setError('加载日记失败，请检查后端服务是否启动');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(current => current?.id === toast.id ? null : current);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const showToast = (message: string, tone: ToastTone = 'info') => {
    setToast({ id: Date.now(), message, tone });
  };

  const switchView = (nextView: ViewType) => {
    setView(nextView);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleAddComment = async (diaryId: number, content: string) => {
    if (!content.trim()) return;

    try {
      await diaryAPI.addComment(diaryId, content);

      // 重新加载该日记的详情
      const updatedDiary = await diaryAPI.getDiaryById(diaryId);

      // 更新列表中的日记
      setDiaries(prev => prev.map(d => d.id === diaryId ? updatedDiary : d));

      // 更新选中的日记
      if (selectedDiary && selectedDiary.id === diaryId) {
        setSelectedDiary(updatedDiary);
      }
    } catch (error) {
      console.error('添加评论失败:', error);
      showToast('添加评论失败，请重试', 'error');
    }
  };

  const handleDateClick = async (date: string) => {
    try {
      const diary = await diaryAPI.getDiaryByDate(date);
      setSelectedDiary(diary);
    } catch (error) {
      console.error('获取日记失败:', error);
      showToast('获取日记失败', 'error');
    }
  };

  const handleDeleteDiary = (diaryId: number) => {
    setDiaries(prev => prev.filter(d => d.id !== diaryId));
    setSelectedDiary(current => (current?.id === diaryId ? null : current));
  };

  const handleUpdateDiary = (updatedDiary: Diary) => {
    setDiaries(prev => prev.map(d => d.id === updatedDiary.id ? updatedDiary : d));
    setSelectedDiary(updatedDiary);
  };

  return (
    <div className="flex h-screen bg-bg-main text-text-primary font-sans overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.button
            type="button"
            aria-label="关闭导航"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/35 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={isMobile
          ? { x: isSidebarOpen ? 0 : -320, opacity: isSidebarOpen ? 1 : 0.96 }
          : { width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }
        }
        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        className="fixed inset-y-0 left-0 z-40 w-[min(82vw,20rem)] border-r border-border-main bg-bg-sidebar shadow-2xl md:relative md:z-auto md:w-auto md:flex-shrink-0 md:shadow-none overflow-hidden"
      >
        <div className="p-5 sm:p-6 h-full flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-10 px-2">
            <h1 className="text-[15px] font-semibold tracking-tight">Haven · 日记</h1>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="关闭导航"
              className="grid h-11 w-11 place-items-center rounded-xl text-text-secondary hover:bg-sidebar-hover md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-6 flex-grow">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-3 mb-3">导航</p>
              <NavItem
                icon={<Sparkles className="w-4 h-4" />}
                label="回忆长廊"
                active={view === 'memory-lane'}
                onClick={() => switchView('memory-lane')}
              />
              <NavItem
                icon={<CalendarIcon className="w-4 h-4" />}
                label="日历"
                active={view === 'calendar'}
                onClick={() => switchView('calendar')}
              />
              <NavItem
                icon={<SearchIcon className="w-4 h-4" />}
                label="搜索"
                active={view === 'search'}
                onClick={() => switchView('search')}
              />
            </div>

            <div className="px-3">
              <button
                onClick={() => switchView('write')}
                className="w-full flex min-h-11 items-center justify-center gap-2 px-4 py-3 bg-text-primary text-bg-main rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                撰写新篇章
              </button>
            </div>
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-grow min-w-0 min-h-0 flex flex-col relative">
        {/* Header */}
        <header className="h-14 sm:h-16 border-b border-border-main flex items-center px-4 sm:px-6 md:px-8 justify-between bg-bg-main/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="grid h-11 w-11 place-items-center hover:bg-sidebar-hover rounded-lg transition-colors"
              aria-label="打开导航"
            >
              <Menu className="w-5 h-5 text-text-secondary" />
            </button>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] sm:tracking-widest text-text-secondary truncate">
              {view === 'calendar' && 'Calendar'}
              {view === 'search' && 'Search'}
              {view === 'memory-lane' && 'Memory Lane'}
              {view === 'write' && 'Write'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleDarkMode}
              className="grid h-11 w-11 place-items-center hover:bg-sidebar-hover rounded-lg transition-colors text-text-secondary"
              title={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-grow overflow-y-auto px-4 py-8 sm:px-6 md:p-16">
          <div className="w-full max-w-4xl mx-auto min-h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                  <p className="text-text-secondary">加载中...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={loadDiaries}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
                  >
                    重试
                  </button>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {view === 'calendar' && (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    <CalendarView diaries={diaries} onDateClick={handleDateClick} />
                  </motion.div>
                )}

                {view === 'search' && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <SearchView diaries={diaries} onDiaryClick={setSelectedDiary} />
                  </motion.div>
                )}

                {view === 'memory-lane' && (
                  <motion.div
                    key="memory-lane"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MemoryLane diaries={diaries} onDiaryClick={setSelectedDiary} />
                  </motion.div>
                )}

                {view === 'write' && (
                  <motion.div
                    key="write"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <WriteDiary onSave={async (date: string, title: string, content: string, tags: string[], author: 'ai' | 'user') => {
                      try {
                        await diaryAPI.createDiary(date, title, content, tags, author);
                        await loadDiaries();
                        setView('memory-lane'); // 跳转到回忆长廊
                      } catch (error) {
                        console.error('创建日记失败:', error);
                        showToast('创建日记失败，请重试', 'error');
                      }
                    }} onCancel={() => setView('memory-lane')} onNotify={showToast} />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDiary && (
          <DiaryDetail 
            diary={selectedDiary} 
            onClose={() => setSelectedDiary(null)} 
            onAddComment={handleAddComment}
            onDelete={handleDeleteDiary}
            onUpdate={handleUpdateDiary}
            onNotify={showToast}
            onConfirm={setConfirmState}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmState && (
          <ConfirmDialog
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            cancelLabel={confirmState.cancelLabel}
            confirmVariant={confirmState.confirmVariant}
            onCancel={() => setConfirmState(null)}
            onConfirm={async () => {
              await confirmState.onConfirm();
              setConfirmState(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
        active 
          ? 'bg-sidebar-hover font-semibold text-text-primary' 
          : 'text-text-primary hover:bg-sidebar-hover'
      }`}
    >
      <span className={active ? 'text-accent' : 'text-text-secondary'}>{icon}</span>
      {label}
    </button>
  );
}

const DiaryCard: React.FC<{ diary: Diary, onClick: () => void }> = ({ diary, onClick }) => {
  const isAI = diary.author === 'ai';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`group bg-white border-b pb-10 cursor-pointer transition-all duration-300 ${
        isAI ? 'border-border-subtle' : 'border-l-4 border-l-blue-400 pl-4'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-text-secondary font-medium tracking-tight">{diary.date}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              isAI
                ? 'bg-purple-100 text-purple-600'
                : 'bg-blue-100 text-blue-600'
            }`}>
              {isAI ? ' Haven' : ' 小雨'}
            </span>
          </div>
          <div className="flex gap-2 mt-3">
            {diary.emotion_tags?.map(tag => (
              <span key={tag} className="text-[11px] px-3 py-1 rounded-full border border-border-subtle text-text-secondary">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <h2 className={`font-serif text-2xl font-bold mb-4 transition-colors ${
        isAI ? 'group-hover:text-accent' : 'group-hover:text-blue-500'
      }`}>
        {diary.title || diary.content.substring(0, 20)}...
      </h2>

      <p className="text-text-secondary leading-relaxed line-clamp-3 mb-6 text-[16px]">
        {diary.content}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-text-secondary">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{diary.comments?.length || 0} Comments</span>
        </div>
      </div>
    </motion.div>
  );
}

const DiaryDetail: React.FC<{
  diary: Diary,
  onClose: () => void,
  onAddComment: (id: number, content: string) => void,
  onDelete: (id: number) => void,
  onUpdate: (diary: Diary) => void,
  onNotify: (message: string, tone?: ToastTone) => void,
  onConfirm: (state: ConfirmState | null) => void
}> = ({ diary, onClose, onAddComment, onDelete, onUpdate, onNotify, onConfirm }) => {
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(diary.title || '');
  const [editContent, setEditContent] = useState(diary.content);
  const isAI = diary.author === 'ai';

  const handleSubmit = () => {
    if (!comment.trim()) return;
    onAddComment(diary.id, comment);
    setComment('');
  };

  const handleDelete = () => {
    onConfirm({
      title: '真的要删掉这篇日记吗？',
      message: '小雨，你真的舍得删掉吗？',
      confirmLabel: '还是删掉',
      cancelLabel: '留下它吧',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await diaryAPI.deleteDiary(diary.id);
          onDelete(diary.id);
          onClose();
          onNotify('日记已删除', 'success');
        } catch (error) {
          console.error('删除失败:', error);
          onNotify('删除失败，请重试', 'error');
        }
      },
    });
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      onNotify('日记内容不能为空', 'error');
      return;
    }

    try {
      await diaryAPI.updateDiary(diary.id, editContent, undefined, editTitle);
      const updatedDiary = await diaryAPI.getDiaryById(diary.id);
      onUpdate(updatedDiary);
      setIsEditing(false);
      onNotify('已经替你改好了', 'success');
    } catch (error) {
      console.error('更新失败:', error);
      onNotify('这次没改成，再试一下', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-t-3xl shadow-2xl overflow-hidden flex flex-col sm:max-h-[90vh] sm:rounded-2xl"
      >
        <div className="p-4 sm:p-8 border-b border-border-subtle flex justify-between items-start gap-3 bg-white sticky top-0 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm text-text-secondary">{diary.date}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isAI
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {isAI ? 'Haven' : '小雨'}
              </span>
            </div>
            {diary.title && (
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight break-words">{diary.title}</h2>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-blue-50 rounded-full transition-colors"
                  title="编辑"
                >
                  <Edit2 className="w-5 h-5 text-blue-600" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-sidebar-hover rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 sm:p-10 md:p-16">
          <article className="max-w-2xl">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">标题</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-3 border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="日记标题..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">内容</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[260px] sm:min-h-[300px] p-4 border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base sm:text-[18px] leading-[1.8]"
                    placeholder="编辑日记内容..."
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={handleSaveEdit}
                    className="min-h-11 px-6 py-2 bg-accent text-white rounded-lg hover:opacity-90"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(diary.title || '');
                      setEditContent(diary.content);
                    }}
                    className="min-h-11 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-base sm:text-[18px] text-text-primary leading-[1.8] whitespace-pre-wrap mb-10 sm:text-justify break-words">
                {diary.content}
              </p>
            )}
          </article>

         

          <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-border-subtle">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-8 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Comments ({diary.comments?.length || 0})
            </h3>
            
            <div className="space-y-8 mb-12">
              {diary.comments?.map(comment => (
                <div key={comment.id} className="border-b border-border-subtle pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold uppercase tracking-widest ${comment.author === 'ai' ? 'text-accent' : 'text-text-secondary'}`}>
                      {comment.author === 'ai' ? 'Haven' : '小雨'}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed break-words">{comment.content}</p>
                </div>
              ))}
              {(!diary.comments || diary.comments.length === 0) && (
                <p className="text-sm text-text-secondary italic">No comments yet. </p>
              )}
            </div>

            <div className="relative">
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a response..."
                className="w-full bg-bg-sidebar border border-border-subtle rounded-xl p-4 sm:p-5 pr-14 focus:outline-none focus:border-accent transition-all resize-none h-32 text-base sm:text-sm"
              />
              <button 
                onClick={handleSubmit}
                disabled={!comment.trim()}
                className="absolute right-4 bottom-4 grid h-11 w-11 place-items-center bg-text-primary text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const Toast: React.FC<{
  message: string,
  tone: ToastTone,
  onClose: () => void
}> = ({ message, tone, onClose }) => {
  const toneClass = {
    success: 'border-emerald-200 bg-white text-text-primary',
    error: 'border-red-200 bg-white text-text-primary',
    info: 'border-border-subtle bg-white text-text-primary',
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="fixed bottom-6 left-1/2 z-[70] w-[min(92vw,24rem)] -translate-x-1/2"
    >
      <div className={`rounded-2xl border shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur ${toneClass}`}>
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className={`mt-1 h-2.5 w-2.5 rounded-full ${
            tone === 'success' ? 'bg-emerald-500' : tone === 'error' ? 'bg-red-500' : 'bg-accent'
          }`} />
          <p className="flex-1 text-sm leading-6">{message}</p>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-sidebar-hover hover:text-text-primary"
            aria-label="关闭提示"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ConfirmDialog: React.FC<{
  title: string,
  message: string,
  confirmLabel?: string,
  cancelLabel?: string,
  confirmVariant?: 'default' | 'danger',
  onCancel: () => void,
  onConfirm: () => void | Promise<void>
}> = ({
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  confirmVariant = 'default',
  onCancel,
  onConfirm,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-border-subtle bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]"
      >
        <div className="mb-6 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-text-secondary">Just a second</p>
          <h3 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h3>
          <p className="text-sm leading-6 text-text-secondary">{message}</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-sidebar-hover hover:text-text-primary"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => void onConfirm()}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 ${
              confirmVariant === 'danger' ? 'bg-red-500' : 'bg-text-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const WriteDiary: React.FC<{
  onSave: (date: string, title: string, content: string, tags: string[], author: 'ai' | 'user') => void,
  onCancel: () => void,
  onNotify: (message: string, tone?: ToastTone) => void
}> = ({ onSave, onCancel, onNotify }) => {
  const [date, setDate] = useState(getShanghaiToday());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [author, setAuthor] = useState<'ai' | 'user'>('user'); // 默认小雨身份

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      onNotify('先写点内容给我看，别留空白', 'error');
      return;
    }
    onSave(date, title, content, tags, author);
  };

  return (
    <div className="space-y-8">
      <div className="mb-10 sm:mb-16">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-4 block">Write</span>
        <h2 className="text-4xl sm:text-5xl font-bold diary-title tracking-tight">撰写新篇章</h2>
      </div>

      <div className="bg-white rounded-2xl border border-border-subtle p-4 sm:p-8 shadow-sm">
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-h-11 bg-bg-sidebar border border-border-subtle rounded-xl p-4 focus:outline-none focus:border-accent transition-all text-base sm:text-sm"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">角色</label>
          <div className="flex gap-3">
            <button
              onClick={() => setAuthor('user')}
              className={`flex-1 min-h-11 py-3 rounded-xl border transition-all text-sm font-medium ${
                author === 'user'
                  ? 'bg-gray-200 border-gray-400 text-gray-700'
                  : 'border-border-subtle text-text-secondary hover:bg-sidebar-hover'
              }`}
            >
              小雨
            </button>
            <button
              onClick={() => setAuthor('ai')}
              className={`flex-1 min-h-11 py-3 rounded-xl border transition-all text-sm font-medium ${
                author === 'ai'
                  ? 'bg-gray-200 border-gray-400 text-gray-700'
                  : 'border-border-subtle text-text-secondary hover:bg-sidebar-hover'
              }`}
            >
              Haven
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给这篇日记起个标题吧..."
            className="w-full min-h-11 bg-bg-sidebar border border-border-subtle rounded-xl p-4 focus:outline-none focus:border-accent transition-all text-base sm:text-sm"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">日记内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记录今天的心情和想法..."
            className="w-full bg-bg-sidebar border border-border-subtle rounded-xl p-4 sm:p-5 focus:outline-none focus:border-accent transition-all resize-none h-56 sm:h-64 text-base sm:text-sm"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">情感标签</label>
          <div className="flex flex-col gap-2 mb-3 sm:flex-row">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="输入标签后按回车"
              className="flex-1 min-h-11 bg-bg-sidebar border border-border-subtle rounded-lg px-4 py-2 focus:outline-none focus:border-accent transition-all text-base sm:text-sm"
            />
            <button
              onClick={handleAddTag}
              className="min-h-11 px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-all text-sm"
            >
              添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-accent/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 justify-end sm:flex-row">
          <button
            onClick={onCancel}
            className="min-h-11 px-6 py-2.5 border border-border-subtle rounded-lg hover:bg-sidebar-hover transition-all text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="min-h-11 px-6 py-2.5 bg-text-primary text-white rounded-lg hover:opacity-90 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存日记
          </button>
        </div>
      </div>
    </div>
  );
};

const MemoryLane: React.FC<{ diaries: Diary[], onDiaryClick: (diary: Diary) => void }> = ({ diaries, onDiaryClick }) => {
  // 按月份分组日记
  const diariesByMonth = useMemo(() => {
    const grouped: { [key: string]: Diary[] } = {};
    diaries.forEach(diary => {
      const month = diary.date.substring(0, 7); // YYYY-MM
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(diary);
    });
    return grouped;
  }, [diaries]);

  const months = Object.keys(diariesByMonth).sort().reverse();

  return (
    <div className="space-y-10 sm:space-y-12">
      <div className="mb-10 sm:mb-16">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-4 block">Memory Lane</span>
        <h2 className="text-4xl sm:text-5xl font-bold diary-title tracking-tight">回忆长廊</h2>
        <p className="text-text-secondary mt-4">按时间顺序回顾我们的每一个瞬间</p>
      </div>

      {months.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-secondary text-lg">还没有日记，开始记录吧 🌸</p>
        </div>
      ) : (
        <div className="space-y-12 sm:space-y-16">
          {months.map(month => (
            <div key={month} className="relative">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-accent">
                  {new Date(month + '-01').toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {diariesByMonth[month].length} 条日记
                </p>
              </div>

              <div className="space-y-5 border-l border-border-subtle pl-4 sm:space-y-6 sm:border-l-2 sm:pl-8">
                {diariesByMonth[month].map(diary => (
                  <motion.div
                    key={diary.id}
                    whileHover={{ x: 4 }}
                    onClick={() => onDiaryClick(diary)}
                    className="relative cursor-pointer group"
                  >
                    <div className="absolute -left-[21px] top-4 h-3 w-3 rounded-full bg-accent ring-4 ring-bg-main transition-transform group-hover:scale-125 sm:-left-[33px]" />

                    <div className="bg-white rounded-xl border border-border-subtle p-4 hover:border-accent/30 hover:shadow-sm transition-all sm:p-6">
                      <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <span className="text-sm text-text-secondary font-medium">{diary.date}</span>
                          {diary.title && (
                            <h4 className="text-base font-bold text-text-primary mt-1 break-words">{diary.title}</h4>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {diary.emotion_tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 rounded-full border border-border-subtle text-text-secondary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-text-primary line-clamp-3 leading-relaxed sm:line-clamp-2">
                        {diary.content}
                      </p>
                      {diary.comments && diary.comments.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-3">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{diary.comments.length} 条评论</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
