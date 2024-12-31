// DOM Elements
const urlInput = document.getElementById('url');
const fetchInfoBtn = document.getElementById('fetch-info');
const videoInfoSection = document.querySelector('.video-info-section');
const videoTitle = document.querySelector('.video-title');
const downloadProgress = document.querySelector('.download-progress');
const progressBar = document.querySelector('.progress');
const progressStatus = document.querySelector('.progress-status');
const progressPercentage = document.querySelector('.progress-percentage');
const inputRowMessageBox = document.getElementById('input-message-box');

// URL validation icons
const validIcon = document.querySelector('.valid-icon');
const invalidIcon = document.querySelector('.invalid-icon');

// YouTube URL validation regex
const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

let typingTimer; // Kullanıcının yazmayı bitirdiğini algılamak için zamanlayıcı
const typingDelay = 500; // 500ms duraklama süresi

urlInput.addEventListener('input', () => {
    clearTimeout(typingTimer); // Her girişte zamanlayıcıyı sıfırla
    const url = urlInput.value.trim();

    // Kullanıcı yazmayı bitirdikten sonra işlemleri başlat
    typingTimer = setTimeout(() => {
        if (!url) {
            // URL boşsa ikonları sıfırla
            validIcon.style.opacity = '0';
            invalidIcon.style.opacity = '0';
            fetchInfoBtn.disabled = true;
            return;
        }

        // API'ye POST isteği gönder
        fetch('/api/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }), // URL'yi gönder
        })
            .then((response) => response.json()) // JSON olarak yanıtı al
            .then((data) => {
                const isValid = data.isValid; // Yanıttan isValid'i al
                validIcon.style.opacity = isValid ? '1' : '0';
                invalidIcon.style.opacity = isValid ? '0' : '1';
                fetchInfoBtn.disabled = !isValid;
            })
            .catch((error) => {
                console.error('API hatası:', error);
                // Hata durumunda ikonları sıfırla veya başka bir işlem yap
                validIcon.style.opacity = '0';
                invalidIcon.style.opacity = '1';
                fetchInfoBtn.disabled = true;
            });
    }, typingDelay);
});

// Kullanıcı yazmayı bitirmeden çıkarsa zamanlayıcıyı temizle
urlInput.addEventListener('keydown', () => {
    clearTimeout(typingTimer);
    validIcon.style.opacity = '0';
    invalidIcon.style.opacity = '0';
    fetchInfoBtn.disabled = true;
});


// Fetch video information
fetchInfoBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();

    try {
        fetchInfoBtn.disabled = true;
        fetchInfoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

        const response = await fetch('/api/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) throw new Error('Failed to fetch video information');

        const data = await response.json();
        videoTitle.textContent = data.title;
        videoInfoSection.classList.remove('hidden');
        // show requested url and other infos
        inputRowMessageBox.classList.remove('hidden');
        inputRowMessageBox.classList.add('message-box');
        inputRowMessageBox.style.backgroundImage = `url(${data.thumbnailImgUrl})`;
        // Smooth scroll to video info section
        setTimeout(() => {
            videoInfoSection.scrollIntoView({ behavior: 'smooth' });
        }, 2000);

    } catch (error) {
        alert(error.message);
    } finally {
        fetchInfoBtn.disabled = false;
        fetchInfoBtn.innerHTML = '<i class="fas fa-search"></i> Check Video';
    }
});

// Download handlers
async function downloadVideo(type) {
    try {
        downloadProgress.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressStatus.textContent = 'Preparing download...';
        progressPercentage.textContent = '0%';

        const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: urlInput.value.trim(),
                type: type
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Download failed');
        }

        if (!response.body) {
            throw new Error('No response body received');
        }


        
        // file name
        const contentDisposition = response.headers.get('Content-Disposition');
        const fileName = contentDisposition
            ? contentDisposition.match(/filename="(.+?)"/)?.[1]
            : `download.${type === 'audio' ? 'mp3' : 'mp4'}`;

        const reader = response.body.getReader();
        const contentLength = response.headers.get('Content-Length');
        let receivedLength = 0;
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            if (contentLength) {
                const progress = (receivedLength / contentLength) * 100;
                progressBar.style.width = progress + '%';
                progressPercentage.textContent = Math.round(progress) + '%';
                progressStatus.textContent = 'Downloading...';
            }
            else {
                progressStatus.textContent = 'Downloading... Size Unknown';
            }
        }

        if (chunks.length === 0) {
            throw new Error('No data received');
        }

        const blob = new Blob(chunks);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Set file name
        a.download = fileName;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        progressStatus.textContent = 'Download Complete!';
        progressBar.style.width = '100%';
        progressPercentage.textContent = '100%';

        setTimeout(() => {
            downloadProgress.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Download error:', error);
        progressStatus.textContent = 'Download Failed';
        progressBar.style.width = '0%';
        progressPercentage.textContent = '';
        alert(error.message || 'Download failed. Please try again.');

        setTimeout(() => {
            downloadProgress.classList.add('hidden');
        }, 3000);
    }
}

// Add event listeners for download buttons
document.getElementById('download-video').addEventListener('click', () => downloadVideo('video'));
document.getElementById('download-audio').addEventListener('click', () => downloadVideo('audio'));
document.getElementById('download-both').addEventListener('click', () => downloadVideo('both'));