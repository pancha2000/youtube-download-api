const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra'); // For easier file operations

// FFmpeg path configure කරන්න.
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000; // API එක run වන port එක (Heroku, Render වැනි platforms වලදී process.env.PORT භාවිතා කරයි)
const TEMP_DIR = path.join(__dirname, 'tmp_downloads'); // Download කරන files තාවකාලිකව save වන directory එක

// API server එක start වන විට tmp_downloads directory එක සාදා, එහි ඇති පෙර files සියල්ල ඉවත් කරන්න.
fsExtra.ensureDirSync(TEMP_DIR);
fsExtra.emptyDirSync(TEMP_DIR); // පෙර downloads ඉවත් කරන්න (deploy කරන විට Disk Space ප්‍රශ්න වළක්වා ගැනීමට)
console.log(`Temporary download directory set up: ${TEMP_DIR}`);
console.log('Previous temporary files cleared.');

// 'tmp_downloads' folder එකේ තියෙන files, URL එකක් හරහා access කරන්න පුළුවන් වෙන්න සලස්වන්න.
// උදා: http://your-api-url:3000/downloads/your_video.mp4
app.use('/downloads', express.static(TEMP_DIR));

// API එකේ Root Endpoint (Health Check)
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: "YouTube Download API is running!",
        endpoints: {
            mp4: "/ytmp4?url=<youtube_url>",
            mp3: "/ytmp3?url=<youtube_url>"
        },
        info: "This API uses ytdl-core and ffmpeg. Ensure your hosting environment has sufficient resources for video/audio processing."
    });
});

// YouTube Video Download Endpoint
app.get('/ytmp4', async (req, res) => {
    const youtubeUrl = req.query.url; // URL එක query parameter එකක් ලෙස ලබාගන්න
    console.log(`[API: /ytmp4] Request received for: ${youtubeUrl}`);

    if (!youtubeUrl) {
        return res.status(400).json({ status: false, message: "Missing 'url' parameter. Please provide a YouTube video URL." });
    }
    if (!ytdl.validateURL(youtubeUrl)) {
        return res.status(400).json({ status: false, message: "Invalid YouTube URL provided. Please ensure it's a valid YouTube video link." });
    }

    try {
        const info = await ytdl.getInfo(youtubeUrl);
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9 ]/g, ''); // File නමක් ලෙස භාවිතා කිරීමට මාතෘකාව sanitize කිරීම
        const videoId = info.videoDetails.videoId;
        const filename = `${title}_${videoId}.mp4`;
        const videoFilePath = path.join(TEMP_DIR, filename);

        // පෙර තිබූ ගොනුවක් තිබේ නම් ඉවත් කරන්න
        if (fs.existsSync(videoFilePath)) {
            fsExtra.removeSync(videoFilePath);
            console.log(`[API: /ytmp4] Removed existing file: ${videoFilePath}`);
        }

        // ytdl-core භාවිතයෙන් video සහ audio streams ලබා ගැනීම
        const videoStream = ytdl(youtubeUrl, { quality: 'highestvideo', filter: 'videoonly' });
        const audioStream = ytdl(youtubeUrl, { quality: 'highestaudio', filter: 'audioonly' });

        // FFmpeg භාවිතයෙන් streams ඒකාබද්ධ කර MP4 ගොනුවක් ලෙස save කිරීම
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(videoStream)
                .videoCodec('copy') // වීඩියෝ codec එක කෙලින්ම පිටපත් කරන්න
                .input(audioStream)
                .audioCodec('copy') // ඕඩියෝ codec එක කෙලින්ම පිටපත් කරන්න
                .save(videoFilePath)
                .on('end', () => {
                    console.log(`[API: /ytmp4] FFmpeg merge complete for ${title}`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`[API: /ytmp4] FFmpeg Video Merge Error for ${title}:`, err);
                    reject(err);
                });
        });

        // බාගත කළ ගොනුවට access කිරීමට Public URL එක සාදන්න
        const downloadUrl = `${req.protocol}://${req.get('host')}/downloads/${encodeURIComponent(filename)}`;

        res.json({
            status: true,
            message: "Video downloaded successfully.",
            result: {
                title: title,
                url: downloadUrl, // API එකෙන් ලැබෙන direct download link එක
                videoId: videoId,
                fileSize: fs.statSync(videoFilePath).size // File size එක ලබා ගැනීම
            }
        });

        // Note: මෙම ගොනුව API server එකේ HDD එකේ save වේ.
        // සේවාදායකයා බාගත කිරීම ආරම්භ කිරීමෙන් පසු හෝ නිශ්චිත කාලයකට පසු
        // ගොනුව ඉවත් කිරීමට logic එකක් (e.g., cron job) ක්‍රියාත්මක කිරීම නිර්දේශ කෙරේ.
        // දැනට, මෙම ගොනු API server එක නැවත ආරම්භ කරන තුරු පවතිනු ඇත.

    } catch (error) {
        console.error('[API Error] /ytmp4:', error);
        let errorMessage = "An error occurred during video download.";
        if (error.message.includes('No video formats found')) {
            errorMessage = "Could not find downloadable formats for this video (age/geo-restricted or private).";
        } else if (error.message.includes('status code: 403')) {
            errorMessage = "YouTube server error (e.g., rate limit, geo-restriction).";
        }
        res.status(500).json({ status: false, message: errorMessage, error: error.message });
    }
});

// YouTube Audio Download Endpoint
app.get('/ytmp3', async (req, res) => {
    const youtubeUrl = req.query.url;
    console.log(`[API: /ytmp3] Request received for: ${youtubeUrl}`);

    if (!youtubeUrl) {
        return res.status(400).json({ status: false, message: "Missing 'url' parameter. Please provide a YouTube video URL." });
    }
    if (!ytdl.validateURL(youtubeUrl)) {
        return res.status(400).json({ status: false, message: "Invalid YouTube URL provided. Please ensure it's a valid YouTube video link." });
    }

    try {
        const info = await ytdl.getInfo(youtubeUrl);
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9 ]/g, '');
        const videoId = info.videoDetails.videoId;
        const filename = `${title}_${videoId}.mp3`;
        const audioFilePath = path.join(TEMP_DIR, filename);

        if (fs.existsSync(audioFilePath)) {
            fsExtra.removeSync(audioFilePath);
            console.log(`[API: /ytmp3] Removed existing file: ${audioFilePath}`);
        }

        // ytdl-core භාවිතයෙන් audio stream එක ලබා ගැනීම
        await new Promise((resolve, reject) => {
            ffmpeg(ytdl(youtubeUrl, { filter: 'audioonly', quality: 'highestaudio' }))
                .audioBitrate(128) // Audio bitrate එක 128kbps ලෙස සකසන්න
                .save(audioFilePath)
                .on('end', () => {
                    console.log(`[API: /ytmp3] FFmpeg conversion complete for ${title}`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`[API: /ytmp3] FFmpeg Audio Convert Error for ${title}:`, err);
                    reject(err);
                });
        });

        // බාගත කළ ගොනුවට access කිරීමට Public URL එක සාදන්න
        const downloadUrl = `${req.protocol}://${req.get('host')}/downloads/${encodeURIComponent(filename)}`;

        res.json({
            status: true,
            message: "Audio downloaded successfully.",
            result: {
                title: title,
                url: downloadUrl, // API එකෙන් ලැබෙන direct download link එක
                videoId: videoId,
                fileSize: fs.statSync(audioFilePath).size // File size එක ලබා ගැනීම
            }
        });

    } catch (error) {
        console.error('[API Error] /ytmp3:', error);
        let errorMessage = "An error occurred during audio download.";
        if (error.message.includes('No video formats found')) {
            errorMessage = "Could not find downloadable formats for this audio (age/geo-restricted or private).";
        } else if (error.message.includes('status code: 403')) {
            errorMessage = "YouTube server error (e.g., rate limit, geo-restriction).";
        }
        res.status(500).json({ status: false, message: errorMessage, error: error.message });
    }
});

// Unhandled errors (global error handler)
app.use((err, req, res, next) => {
    console.error("Unhandled API Error:", err.stack);
    res.status(500).json({ status: false, message: "An unexpected error occurred on the server.", error: err.message });
});

// API server එක start කරන්න
app.listen(PORT, () => {
    console.log(`YouTube Download API listening on port ${PORT}`);
    console.log(`Access this API at http://localhost:${PORT} (or your public IP/domain)`);
});