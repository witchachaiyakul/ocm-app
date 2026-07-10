// src/audio.js
import * as Tone from "https://esm.sh/tone";

export class OCMAudioEngine {
    constructor(onBeatCallback, onStopCallback) {
        this.onBeatCallback = onBeatCallback;
        this.onStopCallback = onStopCallback;
        this.clickSound = new Tone.Synth().toDestination();
        this.loop = null;
    }

    async start(bpm, totalBeats) {
        await Tone.start();
        Tone.Transport.cancel();
        Tone.Transport.bpm.value = bpm;

        this.loop = new Tone.Loop((time) => {
            let currentBeat = Math.floor(Tone.Transport.seconds * (bpm / 60));

            if (currentBeat >= totalBeats) {
                this.stop();
                return;
            }

            if (currentBeat % 4 === 0) {
                this.clickSound.triggerAttackRelease("E5", "8n", time);
            } else {
                this.clickSound.triggerAttackRelease("C5", "8n", time);
            }

            if (this.onBeatCallback) this.onBeatCallback(currentBeat);
        }, "4n").start(0);

        Tone.Transport.start();
    }

    stop() {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        if (this.onStopCallback) this.onStopCallback();
    }
}