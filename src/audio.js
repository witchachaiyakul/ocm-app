// src/audio.js
export class OCMAudioEngine {
    constructor(divId, onBeatUpdateCallback, onStopCallback, onErrorCallback = null) {
        this.divId = divId;
        this.onBeatUpdateCallback = onBeatUpdateCallback;
        this.onStopCallback = onStopCallback;
        this.onErrorCallback = onErrorCallback;
        this.player = null;
        this.bpm = 120;
        this.isPlaying = false;
        this.syncInterval = null;
        this.currentVideoId = null;
        this.fallbackVideoId = "M7lc1UVf-VE";
        this.lastReportedBeat = null;
        this.lastReportedStateKey = null;
        this.lastReportedTime = null;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.precomputedTimeline = [];

        // โหลดสคริปต์ YouTube IFrame API อัตโนมัติหากตรวจไม่พบบนหน้าต่าง Window ของระบบเบราว์เซอร์
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }

    normalizeVideoId(youtubeId) {
        const trimmedId = (youtubeId || "").trim();
        if (!trimmedId) return this.fallbackVideoId;

        const directMatch = trimmedId.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        const extractedId = directMatch ? directMatch[1] : trimmedId;

        return /^[A-Za-z0-9_-]{11}$/.test(extractedId) ? extractedId : this.fallbackVideoId;
    }

    // ฟังก์ชันสร้างหรือผูกลิงก์เพลงเข้ากับตัวเล่น YouTube
    loadVideo(youtubeId, bpm) {
        this.bpm = bpm;
        const targetVideoId = this.normalizeVideoId(youtubeId);
        this.currentVideoId = targetVideoId;
        
        const createPlayer = () => {
            this.player = new YT.Player(this.divId, {
                videoId: targetVideoId,
                playerVars: {
                    'controls': 0, // ซ่อนคอนโทรลเลอร์เริ่มต้นเพื่อความเที่ยงตรงของงานวิจัย
                    'disablekb': 1,
                    'rel': 0,
                    'modestbranding': 1,
                    'origin': window.location.origin
                },
                events: {
                    'onStateChange': (event) => this.handleStateChange(event),
                    'onError': (event) => this.handleError(event)
                }
            });
        };

        if (window.YT && window.YT.Player) {
            if (this.player && typeof this.player.loadVideoById === 'function') {
                this.player.loadVideoById(targetVideoId);
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
            this.updateBeatState();
        }
    }

    getCurrentTime() {
        if (!this.player || typeof this.player.getCurrentTime !== 'function') return 0;
        return this.player.getCurrentTime();
    }

    getDuration() {
        if (!this.player || typeof this.player.getDuration !== 'function') return 0;
        return this.player.getDuration();
    }

    getPlayerState() {
        if (!this.player || typeof this.player.getPlayerState !== 'function') return -1;
        return this.player.getPlayerState();
    }

    seekTo(seconds) {
        if (!this.player || typeof this.player.seekTo !== 'function') return;
        this.player.seekTo(Number(seconds), true);
    }

    setTimeline(songData) {
        this.precomputedTimeline = this.extractTimelineEntries(songData);
    }

    extractTimelineEntries(songData) {
        const candidates = [
            songData?.precomputedTimeline,
            songData?.precomputed,
            songData?.timeline,
            songData?.timelineData
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate) && candidate.length) return candidate;
        }

        return [];
    }

    resolveTimelineState(currentTime, currentBeat) {
        if (!this.precomputedTimeline.length) return null;

        const targetBeat = currentBeat ?? Math.floor(currentTime / (60 / this.bpm));
        const exactBeatMatch = this.precomputedTimeline.find((entry) => {
            const beatValue = entry.beat ?? entry.beatIndex ?? entry.index ?? entry.startBeat;
            return beatValue === targetBeat;
        });

        if (exactBeatMatch) return exactBeatMatch;

        return this.precomputedTimeline.find((entry) => {
            const start = entry.startTime ?? entry.startSec ?? entry.time ?? entry.start ?? 0;
            const end = entry.endTime ?? entry.endSec ?? entry.end ?? entry.duration ?? Infinity;
            return currentTime >= start && currentTime < end;
        }) || null;
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

    handleError(event) {
        this.isPlaying = false;
        this.stopTracking();

        if (this.currentVideoId !== this.fallbackVideoId) {
            console.warn(`YouTube video ${this.currentVideoId} could not be played, retrying with fallback video.`);
            this.currentVideoId = this.fallbackVideoId;
            if (this.player && typeof this.player.loadVideoById === 'function') {
                this.player.loadVideoById(this.fallbackVideoId);
                return;
            }
        }

        if (this.onErrorCallback) {
            this.onErrorCallback(event.data, this.currentVideoId);
        }
    }

    updateBeatState() {
        if (!this.player || typeof this.player.getCurrentTime !== 'function') return;

        const currentTime = this.player.getCurrentTime();
        const duration = this.player.getDuration();
        const beatDuration = 60 / this.bpm;
        const currentBeat = Math.floor(currentTime / beatDuration);
        const timelineState = this.resolveTimelineState(currentTime, currentBeat);
        const stateKey = timelineState ? JSON.stringify({
            beat: currentBeat,
            chord: timelineState.chord ?? timelineState.chordName ?? '',
            lyric: timelineState.lyric ?? timelineState.lyrics ?? timelineState.text ?? ''
        }) : `beat:${currentBeat}`;

        const timeTick = Math.floor(currentTime * 10) / 10;
        const shouldUpdate = this.lastReportedBeat !== currentBeat || this.lastReportedStateKey !== stateKey || this.lastReportedTime !== timeTick;

        if (shouldUpdate) {
            this.lastReportedBeat = currentBeat;
            this.lastReportedStateKey = stateKey;
            this.lastReportedTime = timeTick;
            if (this.onBeatUpdateCallback) {
                this.onBeatUpdateCallback(currentBeat, currentTime, duration, timelineState);
            }
        }
    }

    startTracking() {
        this.stopTracking();
        this.updateBeatState();

        const tick = (timestamp) => {
            if (!this.isPlaying || !this.player || typeof this.player.getCurrentTime !== 'function') {
                return;
            }

            if (!this.lastFrameTime || timestamp - this.lastFrameTime >= 16) {
                this.updateBeatState();
                this.lastFrameTime = timestamp;
            }

            this.animationFrameId = window.requestAnimationFrame(tick);
        };

        this.animationFrameId = window.requestAnimationFrame(tick);
    }

    stopTracking() {
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.lastFrameTime = 0;
    }
}