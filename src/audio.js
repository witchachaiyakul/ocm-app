// src/audio.js
export class OCMAudioEngine {
    constructor(divId, onBeatUpdateCallback, onStopCallback) {
        this.divId = divId;
        this.onBeatUpdateCallback = onBeatUpdateCallback;
        this.onStopCallback = onStopCallback;
        this.player = null;
        this.bpm = 120;
        this.isPlaying = false;
        this.syncInterval = null;

        // โหลดสคริปต์ YouTube IFrame API อัตโนมัติหากตรวจไม่พบบนหน้าต่าง Window ของระบบเบราว์เซอร์
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }

    // ฟังก์ชันสร้างหรือผูกลิงก์เพลงเข้ากับตัวเล่น YouTube
    loadVideo(youtubeId, bpm) {
        this.bpm = bpm;
        
        const createPlayer = () => {
            this.player = new YT.Player(this.divId, {
                videoId: youtubeId,
                playerVars: {
                    'controls': 0, // ซ่อนคอนโทรลเลอร์เริ่มต้นเพื่อความเที่ยงตรงของงานวิจัย
                    'disablekb': 1,
                    'rel': 0
                },
                events: {
                    'onStateChange': (event) => this.handleStateChange(event)
                }
            });
        };

        if (window.YT && window.YT.Player) {
            if (this.player && typeof this.player.loadVideoById === 'function') {
                this.player.loadVideoById(youtubeId);
            } else {
                createPlayer();
            }
        } else {
            window.onYouTubeIframeAPIReady = createPlayer;
        }
    }

    play() {
        if (this.player && typeof this.player.playVideo === 'function') {
            this.player.playVideo();
        }
    }

    pause() {
        if (this.player && typeof this.player.pauseVideo === 'function') {
            this.player.pauseVideo();
        }
    }

    handleStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.startTracking();
        } else {
            this.isPlaying = false;
            this.stopTracking();
            if (event.data === YT.PlayerState.ENDED) {
                if (this.onStopCallback) this.onStopCallback();
            }
        }
    }

    startTracking() {
        this.syncInterval = setInterval(() => {
            if (!this.player || typeof this.player.getCurrentTime !== 'function') return;

            const currentTime = this.player.getCurrentTime();
            const duration = this.player.getDuration();
            
            // สูตรคำนวณถอดค่าเวลาความยาววินาทีแปลงเป็นจังหวะตกทางดนตรี (Beat)
            let currentBeat = Math.floor(currentTime * (this.bpm / 60));

            if (this.onBeatUpdateCallback) {
                this.onBeatUpdateCallback(currentBeat, currentTime, duration);
            }
        }, 50); // วิเคราะห์ความถี่ยิบทุกๆ 50 มิลลิวินาที 
    }

    stopTracking() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}