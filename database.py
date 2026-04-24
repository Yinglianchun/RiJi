import sqlite3
from datetime import datetime
from typing import List, Optional, Dict, Any
import json

class DiaryDatabase:
    def __init__(self, db_path: str = "diary.db"):
        self.db_path = db_path
        self.init_database()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def init_database(self):
        """初始化数据库表"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # 日记表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                content TEXT NOT NULL,
                author TEXT NOT NULL DEFAULT 'ai',
                emotion_tags TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # 检查是否需要添加 author 列（兼容旧数据库）
        cursor.execute("PRAGMA table_info(diaries)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'author' not in columns:
            cursor.execute("ALTER TABLE diaries ADD COLUMN author TEXT NOT NULL DEFAULT 'ai'")

        # 检查是否需要添加 title 列（兼容旧数据库）
        if 'title' not in columns:
            cursor.execute("ALTER TABLE diaries ADD COLUMN title TEXT DEFAULT NULL")

        # 用户评论表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                diary_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                author TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL,
                FOREIGN KEY (diary_id) REFERENCES diaries (id) ON DELETE CASCADE
            )
        """)

        # 检查是否需要添加 author 列（兼容旧数据库）
        cursor.execute("PRAGMA table_info(comments)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'author' not in columns:
            cursor.execute("ALTER TABLE comments ADD COLUMN author TEXT NOT NULL DEFAULT 'user'")

        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_date ON diaries(date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_diary_id ON comments(diary_id)")

        conn.commit()
        conn.close()

    def create_diary(self, date: str, content: str, emotion_tags: Optional[List[str]] = None, author: str = 'ai', title: Optional[str] = None) -> int:
        """创建日记"""
        conn = self.get_connection()
        cursor = conn.cursor()

        now = datetime.now().isoformat()
        tags_json = json.dumps(emotion_tags) if emotion_tags else None

        cursor.execute("""
            INSERT INTO diaries (date, title, content, author, emotion_tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (date, title, content, author, tags_json, now, now))

        diary_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return diary_id

    def get_diary_by_date(self, date: str, author: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """根据日期获取日记"""
        conn = self.get_connection()
        cursor = conn.cursor()

        if author:
            cursor.execute("SELECT * FROM diaries WHERE date = ? AND author = ?", (date, author))
        else:
            cursor.execute("SELECT * FROM diaries WHERE date = ?", (date,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return self._row_to_dict(row)
        return None

    def get_diary_by_id(self, diary_id: int) -> Optional[Dict[str, Any]]:
        """根据 ID 获取日记"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM diaries WHERE id = ?", (diary_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return self._row_to_dict(row)
        return None

    def search_diaries(self, keyword: Optional[str] = None,
                      start_date: Optional[str] = None,
                      end_date: Optional[str] = None,
                      emotion_tag: Optional[str] = None,
                      limit: int = 50) -> List[Dict[str, Any]]:
        """搜索日记"""
        conn = self.get_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM diaries WHERE 1=1"
        params = []

        if keyword:
            query += " AND content LIKE ?"
            params.append(f"%{keyword}%")

        if start_date:
            query += " AND date >= ?"
            params.append(start_date)

        if end_date:
            query += " AND date <= ?"
            params.append(end_date)

        if emotion_tag:
            query += " AND emotion_tags LIKE ?"
            params.append(f"%{emotion_tag}%")

        query += " ORDER BY date DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [self._row_to_dict(row) for row in rows]

    def update_diary(self, diary_id: int, content: Optional[str] = None,
                    emotion_tags: Optional[List[str]] = None, title: Optional[str] = None) -> bool:
        """更新日记"""
        conn = self.get_connection()
        cursor = conn.cursor()

        updates = []
        params = []

        if content is not None:
            updates.append("content = ?")
            params.append(content)

        if emotion_tags is not None:
            updates.append("emotion_tags = ?")
            params.append(json.dumps(emotion_tags))

        if title is not None:
            updates.append("title = ?")
            params.append(title)

        if not updates:
            return False

        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(diary_id)

        query = f"UPDATE diaries SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)

        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return success

    def delete_diary(self, diary_id: int) -> bool:
        """删除日记"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM diaries WHERE id = ?", (diary_id,))

        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return success

    def add_comment(self, diary_id: int, content: str, author: str = 'user') -> int:
        """添加用户评论"""
        conn = self.get_connection()
        cursor = conn.cursor()

        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO comments (diary_id, content, author, created_at)
            VALUES (?, ?, ?, ?)
        """, (diary_id, content, author, now))

        comment_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return comment_id

    def get_comments(self, diary_id: int) -> List[Dict[str, Any]]:
        """获取日记的所有评论"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM comments WHERE diary_id = ? ORDER BY created_at ASC
        """, (diary_id,))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def _row_to_dict(self, row) -> Dict[str, Any]:
        """将数据库行转换为字典"""
        data = dict(row)
        if data.get('emotion_tags'):
            data['emotion_tags'] = json.loads(data['emotion_tags'])
        return data
