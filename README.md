

# YouTube Video Downloader

A web application to download YouTube videos in various formats including video, audio, and both. Built with Node.js, Express, and Fluent-FFmpeg.

## Features

- Validate YouTube URLs
- Fetch video information
- Download video in highest quality
- Download audio only in MP3 format
- Download both video and audio

## Project Structure

```markdown
.
├── .gitignore
├── 

package.json


├── public
│   ├── css
│   │   └── 

styles.css


│   ├── images
│   ├── 

index.html


│   └── js
│       └── 

main.js


└── 

server.js


```

## Installation

1. Clone the repository:

```sh
git clone https://github.com/yourusername/yt-downloader.git
cd yt-downloader
```

2. Install dependencies:

```sh
npm install
```

3. Start the server:

```sh
npm start
```

4. Open your browser and navigate to `http://localhost:3000`.

## Usage

1. Enter a YouTube URL in the input field.
2. Click the "Check Video" button to validate the URL and fetch video information.
3. Choose the desired download option (Video, Audio, or Both).
4. The download will start, and progress will be displayed.

## API Endpoints

### Validate URL

- **Endpoint:** `/api/validate`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "url": "YouTube URL"
  }
  ```
- **Response:**
  ```json
  {
    "isValid": true
  }
  ```

### Fetch Video Information

- **Endpoint:** `/api/info`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "url": "YouTube URL"
  }
  ```
- **Response:**
  ```json
  {
    "title": "Video Title",
    "duration": "Video Duration",
    "thumbnail": "Thumbnail URL",
    "channelName": "Channel Name",
    "description": "Video Description",
    "thumbnailImgUrl": "Thumbnail Image URL"
  }
  ```

### Download Video

- **Endpoint:** `/api/download`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "url": "YouTube URL",
    "type": "video | audio | both"
  }
  ```
- **Response:** The video or audio file will be downloaded.

## Dependencies

- [Express](https://expressjs.com/)
- [@distube/ytdl-core](https://www.npmjs.com/package/@distube/ytdl-core)
- [@ffmpeg-installer/ffmpeg](https://www.npmjs.com/package/@ffmpeg-installer/ffmpeg)
- [ffmpeg-static](https://www.npmjs.com/package/ffmpeg-static)
- [fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg)
- [cors](https://www.npmjs.com/package/cors)
- [nodemon](https://www.npmjs.com/package/nodemon) (dev dependency)

## License

This project is licensed under the MIT License.
```