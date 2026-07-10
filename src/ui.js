// src/ui.js
export class OCMUIEngine {
    constructor({ gridId, chordId, lyricsId }) {
        this.gridContainer = document.getElementById(gridId);
        this.chordDisplay = document.getElementById(chordId);
        this.lyricsDisplay = document.getElementById(lyricsId);
        this.blockElements = [];
    }

    // วาดกล่องตารางกริดตามจำนวนบีต
    renderGrid(songData) {
        this.gridContainer.innerHTML = "";
        this.blockElements = [];
        
        for (let i = 0; i < songData.totalBeats; i++) {
            const block = document.createElement('div');
            block.className = 'grid-block';
            block.innerText = i + 1;
            
            const chordMatch = songData.chordsTimeline.find(item => item.beat === i);
            if (chordMatch) {
                block.classList.add('has-chord');
                block.innerText = chordMatch.chord;
            }
            
            this.gridContainer.appendChild(block);
            this.blockElements.push(block);
        }
    }

    // อัปเดตแถบแสงไฟและคำร้องแบบ Real-time
    updateVisuals(currentBeat, songData) {
        this.blockElements.forEach(el => el.classList.remove('active'));
        
        if (this.blockElements[currentBeat]) {
            this.blockElements[currentBeat].classList.add('active');
            this.blockElements[currentBeat].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        let activeChord = "--";
        for (let i = 0; i < songData.chordsTimeline.length; i++) {
            if (currentBeat >= songData.chordsTimeline[i].beat) {
                activeChord = songData.chordsTimeline[i].chord;
            }
        }
        this.chordDisplay.innerText = activeChord;

        const activeLyrics = songData.lyricsTimeline.find(
            item => currentBeat >= item.startBeat && currentBeat <= item.endBeat
        );
        this.lyricsDisplay.innerText = activeLyrics ? activeLyrics.text : "🎤 (ดนตรีบรรเลง)";
    }

    resetDisplays() {
        this.chordDisplay.innerText = "จบการฝึก";
        this.lyricsDisplay.innerText = "ทบทวนการเคลื่อนไหวร่างกายจากกระจกเงาได้เลยครับ!";
    }
}