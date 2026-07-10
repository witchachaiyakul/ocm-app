// src/mirror.js
export class OCMVisualEngine {
    constructor(videoId, canvasId) {
        this.video = document.getElementById(videoId);
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.stream = null;
        this.isTracking = false;
        
        // จำลองย่านประเมินกิจกรรมขยับร่างกาย (Activity Levels)
        this.activities = { zone1: 0, zone2: 0, zone3: 0 };
    }

    async init() {
        if (!this.video || !this.canvas) throw new Error("ไม่พบโครงสร้าง UI ของกล้องหรือแคนวาสใส");

        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: "user" },
            audio: false // ล็อกสิทธิ์เสียงเป็นเท็จป้องกันเครื่องหอนสะท้อนลูปดนตรี
        });
        
        this.video.srcObject = this.stream;

        this.video.onloadedmetadata = () => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.startVisualLoop();
        };
    }

    startVisualLoop() {
        this.isTracking = true;
        const renderFrame = () => {
            if (!this.isTracking) return;
            
            // วาดภาพเคลื่อนไหวสดจากกล้องลงบนผิวหน้าของ Canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // วาดเส้นตารางจำลองโฮโลแกรมแบ่งเครื่องดนตรี 3 ส่วน (Vision Zones)
            this.drawInstrumentZones();

            requestAnimationFrame(renderFrame);
        };
        renderFrame();
    }

    drawInstrumentZones() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const zoneWidth = width / 3;

        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 6]); // ออกแบบเป็นลักษณะเส้นประโต้ตอบแบบอินเตอร์แอคทีฟ

        // โซนซ้าย: ตรวจจับจังหวะการตีกลุ่มกลอง/เครื่องกระทบ
        this.ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
        this.ctx.strokeRect(0, 0, zoneWidth, height);

        // โซนกลาง: ตรวจจับการทอดนิ้วมือเครื่องลิ่มนิ้ว Orff
        this.ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        this.ctx.strokeRect(zoneWidth, 0, zoneWidth, height);

        // โซนขวา: ตรวจจับภาษาท่าทางและการขับร้อง
        this.ctx.strokeStyle = "rgba(52, 211, 153, 0.6)";
        this.ctx.strokeRect(zoneWidth * 2, 0, zoneWidth, height);

        // ล้างรูปแบบเส้นประออกเพื่อพิมพ์หัวข้อ
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 14px Arial";
        this.ctx.fillText("ZONE 1 (Percussion)", 15, 30);
        this.ctx.fillText("ZONE 2 (Melody)", zoneWidth + 15, 30);
        this.ctx.fillText("ZONE 3 (Vocal/Performance)", (zoneWidth * 2) + 15, 30);
    }

    getZoneActivities() {
        return this.activities;
    }

    stop() {
        this.isTracking = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}