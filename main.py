from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import DiaryDatabase
import os

app = FastAPI(title="Haven的日记后端", version="1.0.0")
db = DiaryDatabase()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Pydantic 模型
class DiaryCreate(BaseModel):
    date: str
    title: Optional[str] = None  # 可选标题
    content: str
    author: Optional[str] = 'ai'  # 'ai' 或 'user'
    emotion_tags: Optional[List[str]] = None

class DiaryUpdate(BaseModel):
    content: Optional[str] = None
    title: Optional[str] = None
    emotion_tags: Optional[List[str]] = None

class CommentCreate(BaseModel):
    content: str
    author: str = 'user'  # 默认为用户

class DiarySearch(BaseModel):
    keyword: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    emotion_tag: Optional[str] = None
    limit: int = 50

@app.get("/")
def root():
    """返回前端页面"""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Haven的日记后端 API", "version": "1.0.0"}

@app.get("/api")
def api_info():
    return {"message": "Haven的日记后端 API", "version": "1.0.0"}

@app.post("/diaries")
def create_diary(diary: DiaryCreate):
    """创建日记"""
    try:
        # 验证日期格式
        datetime.strptime(diary.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="日期格式错误，应为 YYYY-MM-DD")

    # 验证 author 字段
    if diary.author not in ['ai', 'user']:
        raise HTTPException(status_code=400, detail="author 必须是 'ai' 或 'user'")

    # 允许同一天同一作者有多条日记（不检查重复）
    diary_id = db.create_diary(diary.date, diary.content, diary.emotion_tags, diary.author, diary.title)
    return {"id": diary_id, "message": "日记创建成功"}

@app.get("/diaries/date/{date}")
def get_diary_by_date(date: str):
    """根据日期获取日记"""
    diary = db.get_diary_by_date(date)
    if not diary:
        raise HTTPException(status_code=404, detail="未找到该日期的日记")

    # 获取评论
    comments = db.get_comments(diary['id'])
    diary['comments'] = comments

    return diary

@app.get("/diaries/{diary_id}")
def get_diary(diary_id: int):
    """根据 ID 获取日记"""
    diary = db.get_diary_by_id(diary_id)
    if not diary:
        raise HTTPException(status_code=404, detail="未找到该日记")

    # 获取评论
    comments = db.get_comments(diary_id)
    diary['comments'] = comments

    return diary

@app.post("/diaries/search")
def search_diaries(search: DiarySearch):
    """搜索日记"""
    diaries = db.search_diaries(
        keyword=search.keyword,
        start_date=search.start_date,
        end_date=search.end_date,
        emotion_tag=search.emotion_tag,
        limit=search.limit
    )
    return {"count": len(diaries), "diaries": diaries}

@app.put("/diaries/{diary_id}")
def update_diary(diary_id: int, update: DiaryUpdate):
    """更新日记"""
    success = db.update_diary(diary_id, update.content, update.emotion_tags, update.title)
    if not success:
        raise HTTPException(status_code=404, detail="未找到该日记或无更新内容")

    return {"message": "日记更新成功"}

@app.delete("/diaries/{diary_id}")
def delete_diary(diary_id: int):
    """删除日记"""
    diary = db.get_diary_by_id(diary_id)
    if not diary:
        raise HTTPException(status_code=404, detail="未找到该日记")

    db.delete_diary(diary_id)
    return {"message": "日记删除成功"}

@app.post("/diaries/{diary_id}/comments")
def add_comment(diary_id: int, comment: CommentCreate):
    """添加用户评论"""
    # 检查日记是否存在
    diary = db.get_diary_by_id(diary_id)
    if not diary:
        raise HTTPException(status_code=404, detail="未找到该日记")

    comment_id = db.add_comment(diary_id, comment.content, comment.author)
    return {"id": comment_id, "message": "评论添加成功"}

@app.get("/diaries/{diary_id}/comments")
def get_comments(diary_id: int):
    """获取日记的所有评论"""
    comments = db.get_comments(diary_id)
    return {"count": len(comments), "comments": comments}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
