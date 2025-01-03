import express from 'express';
import ytdl from '@distube/ytdl-core';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Custom user agent to avoid restrictionsS
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';


app.post('/api/validate', (req, res) => {
    const { url } = req.body;
    const isValid = ytdl.validateURL(url);
    res.json({ isValid });
});

// Get video info
app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const info = await ytdl.getInfo(url);

        res.json({
            title: info.videoDetails.title,
            duration: info.videoDetails.lengthSeconds,
            thumbnail: info.videoDetails.thumbnails[0].url,
            channelName: info.videoDetails.author.name,
            description: info.videoDetails.description,
            thumbnailImgUrl: info.videoDetails.thumbnails[0].url,
        });
    } catch (error) {
        console.error('Info error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Download video
app.post('/api/download', async (req, res) => {
    try {
        const { url, type } = req.body;

        if (!url || !type) {
            return res.status(400).json({ error: 'URL and type are required' });
        }

        const info = await ytdl.getInfo(url);

        let format;

        switch (type) {
            case 'video':
                const videoFormats = info.formats
                    .filter(format => format.hasVideo)
                    .sort((a, b) => b.height - a.height);
                format = videoFormats[0];
                console.log(format);
                break;

            case 'audio':
                const audioFormats = info.formats
                    .filter(format => format.hasAudio && !format.hasVideo)
                    .sort((a, b) => b.audioBitrate - a.audioBitrate);

                if (audioFormats.length === 0) {
                    format = ytdl.chooseFormat(info.formats, {
                        quality: 'highestaudio',
                        filter: 'audioonly'
                    });
                } else {
                    format = audioFormats[0];
                }
                break;

            case 'both':
                format = ytdl.chooseFormat(info.formats, {
                    quality: 'highest',
                    filter: 'audioandvideo'
                });
                break;

            default:
                return res.status(400).json({ error: 'Invalid download type' });
        }

        if (!format) {
            return res.status(404).json({ error: 'No suitable format found' });
        }

        const cleanTitle = info.videoDetails.title.replace(/[^\w\s-]/g, '');
        const fileExtension = type === 'audio' ? 'mp3' : format.container;
        const filename = `${cleanTitle}.${fileExtension}`;

        res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : format.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        if (format.contentLength) {
            res.setHeader('Content-Length', format.contentLength);
        }

        const stream = ytdl(url, {
            format: format,
        });

        if (type === 'audio') {
            // create a readable stream from the incoming audio stream
            const audioStream = stream;
            const tempInputFile = path.join(__dirname, `video.${format.container}`);
            const tempOutputFile = path.join(__dirname, `audio.mp3`);

            // pipe the incoming audio stream to a temporary file
            const fileStream = fs.createWriteStream(tempInputFile);
            await new Promise((resolve, reject) => {
                audioStream.pipe(fileStream)
                    .on('finish', resolve)
                    .on('data', (chunk) => {
                        console.log('Downloading...');
                    })
                    .on('error', reject);
            });

            fileStream.on('close', () => {
                console.log('Download finished');
            });

            fileStream.on('finish', () => {
                // convert the temporary file to mp3
                console.log('Converting to mp3...');
                ffmpeg(tempInputFile)
                    .inputOptions('-vn') // No video, just audio
                    .audioCodec('libmp3lame')
                    .format('mp3') // Set the output format to mp3
                    .on('end', () => {
                        // send the converted audio to the response
                        const mp3Stream = fs.createReadStream(tempOutputFile);
                        mp3Stream.pipe(res);
                    })
                    .on('progress', (progress) => {
                        console.log(`Converting: ${progress.percent}%`);
                    })
                    .on('error', (err) => {
                        console.error('Conversion error:', err);
                        if (!res.headersSent) {
                            res.status(500).json({ error: err.message || 'Conversion failed' });
                        }
                    })
                    .save(tempOutputFile);
            }
            );
        }
        else {
            // Directly pipe video streams
            stream.pipe(res);
        }

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || 'Download failed' });
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
