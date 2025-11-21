from fastapi import FastAPI
from routes import router

app = FastAPI(title="Notification Service")
app.include_router(router, prefix="/api")