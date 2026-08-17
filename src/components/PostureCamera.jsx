import { useRef, useEffect, useState, useCallback } from 'react';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import * as poseDetection from '@tensorflow-models/pose-detection';
import './PostureCamera.css'; // Import file CSS baru

// Fungsi untuk membunyikan suara beep
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 440; // Frekuensi suara
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume 10%
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3); // Bunyi 0.3 detik
  } catch(e) {
    console.error("Audio API tidak didukung browser ini", e);
  }
};

const PostureCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const requestRef = useRef(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isSlouching, setIsSlouching] = useState(false);
  const slouchStartTimeRef = useRef(null); 

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("Sedang memuat model MoveNet...");
        await tf.ready();
        detectorRef.current = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            runtime: 'tfjs',
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          }
        );
        console.log("Model MoveNet berhasil dimuat.");
        setIsModelReady(true);
      } catch (error) {
        console.error("Gagal memuat model:", error);
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsCameraReady(true);
          };
        }
      } catch (error) {
        console.error("Gagal mengakses kamera:", error);
      }
    };
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const detectPosture = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    
    // Pastikan video benar-benar memiliki dimensi
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestRef.current = requestAnimationFrame(detectPosture);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Menyesuaikan ukuran canvas dengan ukuran video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const poses = await detectorRef.current.estimatePoses(video);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (poses && poses.length > 0) {
        const pose = poses[0];
        const relevantPoints = ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear', 'left_shoulder', 'right_shoulder'];

        // Gambar titik koordinat di Canvas
        pose.keypoints.forEach((keypoint) => {
          if (relevantPoints.includes(keypoint.name)) {
            const { x, y, score } = keypoint;
            
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            
            // Modifikasi: Gambar warna merah transparan jika confidence rendah (score < 0.5)
            // Jadi kita tahu rAF berjalan meskipun AI tidak yakin dengan posturnya
            if (score > 0.5) {
                ctx.fillStyle = keypoint.name.includes('shoulder') ? '#4ade80' : '#60a5fa'; // Hijau / Biru
            } else {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Merah muda transparan
            }
            ctx.fill();
          }
        });
        
        const leftShoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
        const rightShoulder = pose.keypoints.find(k => k.name === 'right_shoulder');
        
        // Garis penghubung bahu (Turunkan threshold ke 0.3 agar lebih longgar)
        if (leftShoulder && rightShoulder && leftShoulder.score > 0.3 && rightShoulder.score > 0.3) {
            ctx.beginPath();
            ctx.moveTo(leftShoulder.x, leftShoulder.y);
            ctx.lineTo(rightShoulder.x, rightShoulder.y);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.stroke();
        }

        // --- LOGIKA DETEKSI MEMBUNGKUK ---
        const leftEar = pose.keypoints.find(k => k.name === 'left_ear');
        const rightEar = pose.keypoints.find(k => k.name === 'right_ear');

        // Gunakan threshold 0.3 (atau 30% keyakinan) untuk memproses kalkulasi
        if (leftEar && rightEar && leftShoulder && rightShoulder &&
            leftEar.score > 0.3 && rightEar.score > 0.3 && leftShoulder.score > 0.3 && rightShoulder.score > 0.3) {
          
          const headY = (leftEar.y + rightEar.y) / 2;
          const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
          const verticalDistance = Math.abs(shoulderY - headY);
          const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
          
          if (shoulderWidth > 0) {
            const postureRatio = verticalDistance / shoulderWidth;
            // Kamera laptop dari depan membutuhkan rasio yang lebih kecil.
            // 0.45 adalah angka rata-rata untuk postur menunduk dari depan.
            const isBadPosture = postureRatio < 0.45;
            
            if (isBadPosture) {
              if (slouchStartTimeRef.current === null) {
                slouchStartTimeRef.current = Date.now();
              } else {
                const elapsedTime = Date.now() - slouchStartTimeRef.current;
                // Diubah menjadi 3000 milidetik (3 detik)
                if (elapsedTime > 3000) {
                  setIsSlouching((prev) => !prev ? true : prev);
                }
              }
            } else {
              slouchStartTimeRef.current = null;
              setIsSlouching((prev) => prev ? false : prev);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error saat estimasi postur:", error);
    }

    // Minta frame berikutnya
    requestRef.current = requestAnimationFrame(detectPosture);
  }, []);

  useEffect(() => {
    if (isCameraReady && isModelReady) {
      console.log("Menjalankan siklus deteksi untuk pertama kali...");
      requestRef.current = requestAnimationFrame(detectPosture);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isCameraReady, isModelReady, detectPosture]);

  // Efek khusus untuk menyalakan alarm suara
  useEffect(() => {
    if (isSlouching) {
      playBeep();
      // Bunyikan lagi setiap 3 detik jika tetap membungkuk
      const interval = setInterval(playBeep, 3000);
      return () => clearInterval(interval);
    }
  }, [isSlouching]);


  return (
    <div className={`camera-container ${isSlouching ? 'slouching' : 'good'}`}>
      <div className="status-badge">
        <div className="status-indicator"></div>
        <span>{isSlouching ? 'Membungkuk Terdeteksi' : 'Postur Ideal'}</span>
      </div>

      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          muted
        />
        <canvas
          ref={canvasRef}
          className="canvas-element"
        />
        
        {(!isCameraReady || !isModelReady) && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Memuat AI Engine...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostureCamera;
