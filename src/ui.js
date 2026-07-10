// src/ui.js
export class OCMUIEngine {
    constructor({ gridId, lyricsId }) {
        this.gridContainer = document.getElementById(gridId);
        this.lyricsDisplay = document.getElementById(lyricsId);
        this.blockElements = [];
    }

    // สร้างเส้นทางกริดคอร์ดแบบแถวยาวแนวนอนต่อเนื่อง (Scrollable Path)
    renderGrid(songData) {
        this.gridContainer.innerHTML = "";
        this.blockElements = [];
        
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

    updateVisuals(currentBeat, songData) {
        this.blockElements.forEach(el => el && el.classList.remove('active'));
        
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
        if(this.blockElements[0]) {
            this.blockElements[0].scrollIntoView({ behavior: 'smooth', inline: 'start' });
        }
    }
}