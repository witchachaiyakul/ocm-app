// src/mirror.js

export class OCMVisualEngine {
    constructor(videoId, canvasId) {
        this.video = document.getElementById(videoId);
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.stream = null;
        this.isTracking = false;
        
        // จำลองค่ากิจกรรมการขยับตัว (Activity Levels) ตามแนวคิดของ AuraBand
        this.activities = { zone1: 0, zone2: 0, zone3: 0 };
    }

    // ฟังก์ชันเริ่มต้นกล้องและเซ็ตอัปแคนวาสแบบเรียลไทม์
    async init() {
        if (!this.video || !this.canvas) throw new Error("ไม่พบโครงสร้าง UI ของกล้องหรือแคนวาส");

        // ขอสิทธิ์เปิดกล้อง (ตั้งค่าปิดเสียงเพื่อป้องกันเสียงหอนสะท้อนลูป)
        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: "user" },
            audio: false
        });
        
        this.video.srcObject = this.stream;

        // รอจนกล้องโหลดมิติภาพเสร็จ แล้วตั้งขนาดกระดาษแคนวาสให้เท่ากันพอดีเป๊ะ
        this.video.onloadedmetadata = () => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.startVisualLoop();
        };
    }

    // ระบบวาดเฟรมภาพเคลื่อนไหวความถี่สูง (Animation Frame Loop)
    startVisualLoop() {
        this.isTracking = true;
        const renderFrame = () => {
            if (!this.isTracking) return;
            
            // 1. วาดสตรีมวิดีโอสดลงบนแผ่นแคนวาสเฟรมต่อเฟรม
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // 2. ดึงไอเดียวาดโครงสร้างแบ่ง 3 โซน (Vision Zones) จาก AuraBand
            this.drawInstrumentZones();

            requestAnimationFrame(renderFrame);
        };
        renderFrame();
    }

    // ฟังก์ชันวาดเส้นกราฟิกจำลองและวิเคราะห์ตำแหน่งร่างกายเด็ก
    drawInstrumentZones() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const zoneWidth = width / 3;

        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 6]); // สั่งทำเส้นประแบบอินเตอร์แอคทีฟ

        // --- โซนที่ 1: ฝั่งซ้าย (ตัวอย่าง: โซนจับจังหวะกลอง/เคาะมือ) ---
        this.ctx.strokeStyle = "rgba(251, 191, 36, 0.6)"; // สีเหลือง Amber
        this.ctx.strokeRect(0, 0, zoneWidth, height);

        // --- โซนที่ 2: ฝั่งกลาง (ตัวอย่าง: โซนเครื่องลิ่มนิ้ว/คีย์บอร์ด) ---
        this.ctx.strokeStyle = "rgba(56, 189, 248, 0.6)"; // สีฟ้า Sky
        this.ctx.strokeRect(zoneWidth, 0, zoneWidth, height);

        // --- โซนที่ 3: ฝั่งขวา (ตัวอย่าง: โซนการเคลื่อนไหวของนักร้อง) ---
        this.ctx.strokeStyle = "rgba(52, 211, 153, 0.6)"; // สีเขียว Emerald
        this.ctx.strokeRect(zoneWidth * 2, 0, zoneWidth, height);

        // รีเซ็ตเส้นประกลับเป็นเส้นตรงปกติสำหรับวาดข้อความ
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 14px Arial";
        this.ctx.fillText("ZONE 1", 20, 30);
        this.ctx.fillText("ZONE 2", zoneWidth + 20, 30);
        this.ctx.fillText("ZONE 3", (zoneWidth * 2) + 20, 30);
    }

    // ฟังก์ชันสำหรับส่งค่าความเคลื่อนไหวออกไปให้ Engine ตัวอื่นใช้คำนวณคะแนน
    getZoneActivities() {
        return this.activities;
    }

    // ปิดการทำงานเพื่อคืนทรัพยากรให้ระบบเครื่อง
    stop() {
        this.isTracking = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}