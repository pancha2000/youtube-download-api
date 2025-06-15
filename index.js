require('dotenv').config(); // Load environment variables from .env file

const express = require("express");
const { execFile } = require("child_process"); // Use execFile for security

const app = express();
const port = process.env.PORT || 3000;

// Default User-Agent to mimic a common browser if not set in .env
const USER_AGENT = process.env.USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
// Proxy URL (optional)
const PROXY_URL = process.env.PROXY_URL;

app.get("/", (req, res) => {
  res.send("🎵 YouTube Download API is running.");
});

app.get("/audio", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "Missing YouTube URL parameter." });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: "Invalid URL format." });
  }

  const args = ["-f", "bestaudio"];

  // Add Proxy if PROXY_URL is set
  if (PROXY_URL) {
    args.push("--proxy", PROXY_URL);
  }
  // Add User-Agent to mimic a browser
  args.push("--user-agent", USER_AGENT);
  // Add Cookies for bot detection bypass (ensure youtube_cookies.txt exists)
  args.push("--cookies", "youtube_cookies.txt");
  // Add sleep intervals for human-like request patterns
  args.push("--sleep-interval", "1");   // Minimum 1 second delay
  args.push("--max-sleep-interval", "5"); // Maximum 5 seconds delay (randomly picked)

  args.push("--get-url", url); // The URL to get

  execFile("yt-dlp", args, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error fetching audio URL for ${url}: ${stderr}`);
      // Provide more context in error message for troubleshooting bot detection
      return res.status(500).json({
        error: "Failed to retrieve audio URL. Make sure the URL is valid, yt-dlp can access it, and it's not restricted by YouTube's bot detection. Check logs for details.",
        details: stderr.trim()
      });
    }
    // yt-dlp might output warnings to stderr even on success, log them but don't error out
    if (stderr) {
        console.warn(`yt-dlp stderr for audio (non-fatal): ${stderr}`);
    }
    res.json({ audio_url: stdout.trim() });
  });
});

app.get("/video", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "Missing YouTube URL parameter." });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: "Invalid URL format." });
  }

  const args = ["-f", "bestvideo+bestaudio"];

  // Add Proxy if PROXY_URL is set
  if (PROXY_URL) {
    args.push("--proxy", PROXY_URL);
  }
  // Add User-Agent to mimic a browser
  args.push("--user-agent", USER_AGENT);
  // Add Cookies for bot detection bypass (ensure youtube_cookies.txt exists)
  args.push("--cookies", "youtube_cookies.txt");
  // Add sleep intervals for human-like request patterns
  args.push("--sleep-interval", "1");
  args.push("--max-sleep-interval", "5");

  args.push("--get-url", url);

  execFile("yt-dlp", args, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error fetching video URL for ${url}: ${stderr}`);
      // Provide more context in error message for troubleshooting bot detection
      return res.status(500).json({
        error: "Failed to retrieve video URL. Make sure the URL is valid, yt-dlp can access it, and it's not restricted by YouTube's bot detection. Check logs for details.",
        details: stderr.trim()
      });
    }
    // yt-dlp might output warnings to stderr even on success
    if (stderr) {
        console.warn(`yt-dlp stderr for video (non-fatal): ${stderr}`);
    }
    res.json({ video_url: stdout.trim() });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});