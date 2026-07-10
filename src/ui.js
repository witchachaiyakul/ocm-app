// src/ui.js
export class OCMUIEngine {
    constructor({ gridId, lyricsId, beatCountId }) {
        this.gridContainer = document.getElementById(gridId);
        this.lyricsDisplay = document.getElementById(lyricsId);
        this.beatCountDisplay = document.getElementById(beatCountId);
        this.blockElements = [];
        this.countPills = [];
    }

    // สร้างเส้นทางกริดคอร์ดแบบแถวยาวแนวนอนต่อเนื่อง (Scrollable Path)
    renderGrid(songData) {
        this.gridContainer.innerHTML = "";
        this.blockElements = [];
        this.renderBeatCount(songData);
        
        for (let i = 0; i < songData.totalBeats; i++) {
            const block = document.createElement('div');
            block.className = 'beat-block';
            
            const numSpan = document.createElement('span');
            numSpan.className = 'beat-num';
            numSpan.innerText = i + 1;
            block.appendChild(numSpan);

            const chordSpan = document.createElement('span');
            chordSpan.className = 'chord-name';
            chordSpan.innerText = "•"; // จุดศูนย์กลางแสดงว่ายิงจังหวะคงเดิมอยู่
            block.appendChild(chordSpan);
            
            const chordMatch = songData.chordsTimeline.find(item => item.beat === i);
            if (chordMatch) {
                block.classList.add('has-chord');
                chordSpan.innerText = chordMatch.chord;
            }
            
            this.gridContainer.appendChild(block);
            this.blockElements.push(block);
        }
    }

    getMeasureLength(songData) {
        const timeSignature = songData?.timeSignature || '4/4';
        const match = String(timeSignature).match(/^(\d+)/);
        return match ? Number(match[1]) : 4;
    }

    renderBeatCount(songData) {
        if (!this.beatCountDisplay) return;

        const measureLength = this.getMeasureLength(songData);
        this.beatCountDisplay.innerHTML = "";
        this.countPills = [];

        for (let i = 1; i <= measureLength; i++) {
            const pill = document.createElement('span');
            pill.className = 'count-pill';
            pill.innerText = i;
            this.beatCountDisplay.appendChild(pill);
            this.countPills.push(pill);
        }

        this.updateBeatCount(0, songData);
    }

    updateBeatCount(currentBeat, songData) {
        if (!this.countPills.length) return;

        const measureLength = this.getMeasureLength(songData);
        const beatInMeasure = ((currentBeat % measureLength) + measureLength) % measureLength;

        this.countPills.forEach((pill, index) => {
            pill.classList.toggle('active', index === beatInMeasure);
        });
    }

    updateVisuals(currentBeat, songData) {
        this.blockElements.forEach(el => el && el.classList.remove('active'));
        this.updateBeatCount(currentBeat, songData);
        
        if (this.blockElements[currentBeat]) {
            const activeBlock = this.blockElements[currentBeat];
            activeBlock.classList.add('active');
            
            // 🌟 ปรับคุณสมบัติเป็น 'auto' เพื่อล็อกหน้าจอดีดตามคอร์ดดนตรีสดได้ทันทีโดยไม่กระตุกค้าง
            activeBlock.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
        }

        const activeLyrics = songData.lyricsTimeline.find(
            item => currentBeat >= item.startBeat && currentBeat <= item.endBeat
        );
        this.lyricsDisplay.innerText = activeLyrics ? activeLyrics.text : "🎤 (ช่วงดนตรีบรรเลง/Solo)";
    }

    resetDisplays() {
        this.lyricsDisplay.innerText = "จบกระบวนการฝึกซ้อมเรียบร้อยแล้ว!";
        this.blockElements.forEach(el => el && el.classList.remove('active'));
        this.countPills.forEach(pill => pill.classList.remove('active'));
        if (this.countPills[0]) this.countPills[0].classList.add('active');
        if(this.blockElements[0]) {
            this.blockElements[0].scrollIntoView({ behavior: 'smooth', inline: 'start' });
        }
    }
}