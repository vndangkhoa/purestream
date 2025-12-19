from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.download_service import download_service
from fastapi.responses import FileResponse
import os

router = APIRouter()

class DownloadRequest(BaseModel):
    url: str

@router.post("")
async def download_video(req: DownloadRequest):
    result = await download_service.download_video(req.url)
    
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
        
    # In a real app, we might upload to cloud storage and return a URL
    # Or stream it. For now, let's return the file info.
    # To actually serve the file, we can add a GET endpoint or return FileResponse here 
    # (though returning FileResponse on POST is valid but less common for "trigger download" flows).
    
    return result

@router.get("/file/{video_id}")
async def get_downloaded_file(video_id: str):
    # Security risk: path traversal. MVP only.
    # We need to find the file extension... or just allow the service to return the full path in the previous call
    # Let's assume content content-disposition
    # This is a bit tricky without knowing the extension.
    # For MVP, we'll search the dir.
    
    download_dir = "downloads"
    for filename in os.listdir(download_dir):
        if filename.startswith(video_id):
            return FileResponse(path=os.path.join(download_dir, filename), filename=filename)
            
    raise HTTPException(status_code=404, detail="File not found")

