import yt_dlp
import os
import asyncio

class DownloadService:
    def __init__(self):
        self.download_dir = "downloads"
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)

    async def download_video(self, url: str) -> dict:
        """
        Download video using yt-dlp and return metadata/file path.
        """
        ydl_opts = {
            'format': 'best',
            'outtmpl': f'{self.download_dir}/%(id)s.%(ext)s',
            'noplaylist': True,
            'quiet': True,
        }

        loop = asyncio.get_event_loop()
        
        # Run synchronous yt-dlp in a separate thread
        try:
             with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=True))
                filename = ydl.prepare_filename(info)
                return {
                    "status": "success",
                    "filename": filename,
                    "title": info.get('title'),
                    "id": info.get('id')
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}

download_service = DownloadService()
