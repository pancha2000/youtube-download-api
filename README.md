# YouTube Download API

A simple Node.js API that allows you to download YouTube videos and audios.
This API uses `ytdl-core` for fetching YouTube streams and `fluent-ffmpeg` for processing them.

## Features

-   Download YouTube videos as MP4 (highest quality available, merging video and audio streams).
-   Download YouTube audios as MP3 (highest audio quality).
-   Returns a direct download URL to the processed file hosted temporarily on the API server itself.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_GITHUB_USERNAME/youtube-download-api.git
    cd youtube-download-api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the API:**
    ```bash
    npm start
    # Or for development with auto-restarts:
    # npm run dev
    ```

    The API will listen on port `3000` by default, or on the port specified by the `PORT` environment variable.

## API Endpoints

### 1. Download YouTube Video (MP4)

-   **Endpoint:** `/ytmp4`
-   **Method:** `GET`
-   **Query Parameters:**
    -   `url` (required): The full YouTube video URL.
-   **Example:**
    ```
    http://localhost:3000/ytmp4?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
    ```
-   **Success Response (JSON):**
    ```json
    {
      "status": true,
      "message": "Video downloaded successfully.",
      "result": {
        "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
        "url": "http://localhost:3000/downloads/Rick Astley - Never Gonna Give You Up (Official Music Video)_dQw4w9WgXcQ.mp4",
        "videoId": "dQw4w9WgXcQ",
        "fileSize": 12345678 // Size in bytes
      }
    }
    ```

### 2. Download YouTube Audio (MP3)

-   **Endpoint:** `/ytmp3`
-   **Method:** `GET`
-   **Query Parameters:**
    -   `url` (required): The full YouTube video URL.
-   **Example:**
    ```
    http://localhost:3000/ytmp3?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
    ```
-   **Success Response (JSON):**
    ```json
    {
      "status": true,
      "message": "Audio downloaded successfully.",
      "result": {
        "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
        "url": "http://localhost:3000/downloads/Rick Astley - Never Gonna Give You Up (Official Music Video)_dQw4w9WgXcQ.mp3",
        "videoId": "dQw4w9WgXcQ",
        "fileSize": 123456 // Size in bytes
      }
    }
    ```

## Deployment Considerations

*   This API performs CPU-intensive and I/O-intensive operations (downloading and processing media).
*   **It is highly recommended to deploy this API on a server with sufficient resources (RAM, CPU, and good network bandwidth).**
*   **Free tier hosting platforms like Koyeb, Render, Heroku (free) are generally NOT suitable for this API** as they often have strict resource limits, leading to timeouts or failures.
*   Consider a small VPS (e.g., DigitalOcean, Linode, AWS EC2, Contabo) for reliable performance.
*   Ensure `ffmpeg` is available on your deployment environment. `ffmpeg-static` bundles it, but direct system installation of `ffmpeg` might sometimes be more robust for certain environments.

## License

This project is licensed under the MIT License.# youtube-download-api
