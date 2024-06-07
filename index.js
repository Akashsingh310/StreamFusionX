import http from 'http';
import path from 'path';
import { spawn } from 'child_process';
import express from 'express';
import { Server as SocketIO } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

let ffmpegProcess;

app.use(express.static(path.resolve('./public')));

io.on('connection', (socket) => {
    console.log('Socket Connected', socket.id);
    
    socket.on('start-stream', (rtmpUrl) => {
        if (ffmpegProcess) {
            ffmpegProcess.kill('SIGINT');
        }

        const options = [
            '-i',
            '-',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-r', `${25}`,
            '-g', `${25 * 2}`,
            '-keyint_min', 25,
            '-crf', '25',
            '-pix_fmt', 'yuv420p',
            '-sc_threshold', '0',
            '-profile:v', 'main',
            '-level', '3.1',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-ar', 128000 / 4,
            '-f', 'flv',
            rtmpUrl,
        ];

        ffmpegProcess = spawn('ffmpeg', options);

        ffmpegProcess.stdout.on('data', (data) => {
            socket.emit('ffmpeg-data', data.toString());
        });

        ffmpegProcess.stderr.on('data', (data) => {
            socket.emit('ffmpeg-error', data.toString());
        });

        ffmpegProcess.on('close', (code) => {
            socket.emit('ffmpeg-exit', code);
            console.log(`ffmpeg process exited with code ${code}`);
        });

        socket.on('binarystream', (stream) => {
            console.log('Binary Stream Incoming...');
            ffmpegProcess.stdin.write(stream, (err) => {
                if (err) console.log('Error writing stream', err);
            });
        });
    });
});

server.listen(3000, () => console.log(`HTTP Server is running on PORT 3000`));
