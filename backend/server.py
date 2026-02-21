from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET', 'jnv-editorial-secret-key-2024')
JWT_ALGORITHM = "HS256"

class SubmissionCreate(BaseModel):
    title: str
    title_hi: Optional[str] = None
    content: str
    content_hi: Optional[str] = None
    author_name: str
    author_class: str
    category: Literal["poem", "story", "essay", "article"]
    language: Literal["english", "hindi", "both"]

class Submission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    title_hi: Optional[str] = None
    content: str
    content_hi: Optional[str] = None
    author_name: str
    author_class: str
    category: str
    language: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    admin_notes: Optional[str] = None

class SubmissionApproval(BaseModel):
    admin_notes: Optional[str] = None

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminResponse(BaseModel):
    token: str
    username: str

class StatsResponse(BaseModel):
    total_submissions: int
    approved: int
    pending: int
    rejected: int

def create_token(username: str) -> str:
    payload = {
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["username"]
    except:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@api_router.get("/")
async def root():
    return {"message": "JNV Editorial Club API"}

@api_router.post("/submissions", response_model=Submission)
async def create_submission(submission: SubmissionCreate):
    submission_obj = Submission(**submission.model_dump())
    doc = submission_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.submissions.insert_one(doc)
    return submission_obj

@api_router.get("/submissions", response_model=List[Submission])
async def get_submissions(
    status: Optional[str] = "approved",
    category: Optional[str] = None,
    language: Optional[str] = None
):
    query = {"status": status} if status else {}
    if category:
        query["category"] = category
    if language:
        query["language"] = language
    
    submissions = await db.submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for sub in submissions:
        if isinstance(sub.get('created_at'), str):
            sub['created_at'] = datetime.fromisoformat(sub['created_at'])
        if sub.get('approved_at') and isinstance(sub['approved_at'], str):
            sub['approved_at'] = datetime.fromisoformat(sub['approved_at'])
    
    return submissions

@api_router.get("/submissions/{submission_id}", response_model=Submission)
async def get_submission(submission_id: str):
    submission = await db.submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if isinstance(submission.get('created_at'), str):
        submission['created_at'] = datetime.fromisoformat(submission['created_at'])
    if submission.get('approved_at') and isinstance(submission['approved_at'], str):
        submission['approved_at'] = datetime.fromisoformat(submission['approved_at'])
    
    return submission

@api_router.get("/submissions/pending/list", response_model=List[Submission])
async def get_pending_submissions(username: str = Depends(verify_token)):
    submissions = await db.submissions.find({"status": "pending"}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    
    for sub in submissions:
        if isinstance(sub.get('created_at'), str):
            sub['created_at'] = datetime.fromisoformat(sub['created_at'])
    
    return submissions

@api_router.patch("/submissions/{submission_id}/approve", response_model=Submission)
async def approve_submission(
    submission_id: str,
    approval: SubmissionApproval,
    username: str = Depends(verify_token)
):
    result = await db.submissions.find_one_and_update(
        {"id": submission_id},
        {
            "$set": {
                "status": "approved",
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "admin_notes": approval.admin_notes
            }
        },
        projection={"_id": 0},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    if result.get('approved_at') and isinstance(result['approved_at'], str):
        result['approved_at'] = datetime.fromisoformat(result['approved_at'])
    
    return result

@api_router.patch("/submissions/{submission_id}/reject", response_model=Submission)
async def reject_submission(
    submission_id: str,
    approval: SubmissionApproval,
    username: str = Depends(verify_token)
):
    result = await db.submissions.find_one_and_update(
        {"id": submission_id},
        {
            "$set": {
                "status": "rejected",
                "admin_notes": approval.admin_notes
            }
        },
        projection={"_id": 0},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if isinstance(result.get('created_at'), str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    
    return result

@api_router.post("/admin/login", response_model=AdminResponse)
async def admin_login(credentials: AdminLogin):
    admin = await db.admins.find_one({"username": credentials.username}, {"_id": 0})
    
    if not admin:
        if credentials.username == "admin" and credentials.password == "jnv2024":
            hashed = pwd_context.hash(credentials.password)
            await db.admins.insert_one({"username": "admin", "password_hash": hashed})
            token = create_token(credentials.username)
            return AdminResponse(token=token, username=credentials.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(credentials.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(credentials.username)
    return AdminResponse(token=token, username=credentials.username)

@api_router.get("/stats", response_model=StatsResponse)
async def get_stats(username: str = Depends(verify_token)):
    total = await db.submissions.count_documents({})
    approved = await db.submissions.count_documents({"status": "approved"})
    pending = await db.submissions.count_documents({"status": "pending"})
    rejected = await db.submissions.count_documents({"status": "rejected"})
    
    return StatsResponse(
        total_submissions=total,
        approved=approved,
        pending=pending,
        rejected=rejected
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()