const userVideo = document.getElementById('user-video');
const rtmpForm = document.getElementById('rtmp-form');
const rtmpUrlInput = document.getElementById('rtmp-url');

const state = { media: null };
const socket = io();

rtmpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const rtmpUrl = rtmpUrlInput.value;

    socket.emit('start-stream', rtmpUrl);

    socket.on('connect', () => {
        console.log('Socket Connected', socket.id);
    });

    socket.on('ffmpeg-data', (data) => {
        console.log(`ffmpeg: ${data}`);
    });

    socket.on('ffmpeg-error', (data) => {
        console.error(`ffmpeg: ${data}`);
    });

    socket.on('ffmpeg-exit', (code) => {
        console.log(`ffmpeg exited with code ${code}`);
    });

    const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    state.media = media;
    userVideo.srcObject = media;

    const mediaRecorder = new MediaRecorder(state.media, {
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
        framerate: 25
    });

    mediaRecorder.ondataavailable = ev => {
        console.log('Binary Stream Available', ev.data);
        socket.emit('binarystream', ev.data);
    };

    mediaRecorder.start(25);
});

window.addEventListener('load', async () => {
    const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    state.media = media;
    userVideo.srcObject = media;
});
