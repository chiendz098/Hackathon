from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from src.apis.routers.multi_agent_router import router as multi_agent_router

api_router = APIRouter()
api_router.include_router(multi_agent_router)

def create_app():
    app = FastAPI(
        docs_url="/docs",
        title="AI Service",
    )

    @app.get("/")
    def root():
        return {
            "message": "Backend Python is running"
        }

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app