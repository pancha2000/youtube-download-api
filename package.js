{
  "name": "youtube-download-api",
  "version": "1.0.0",
  "description": "A simple Node.js API for downloading YouTube videos and audios using ytdl-core and ffmpeg.",
  "main": "main.js",
  "scripts": {
    "start": "node main.js",
    "dev": "nodemon main.js"
  },
  "keywords": [
    "youtube",
    "download",
    "api",
    "ytdl-core",
    "ffmpeg",
    "nodejs",
    "express"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.19.2",
    "ytdl-core": "^4.11.5",
    "fluent-ffmpeg": "^2.1.3",
    "ffmpeg-static": "^5.2.0",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}