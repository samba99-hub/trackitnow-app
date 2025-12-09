from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.locations import router as location_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(location_router, prefix="/locations")
