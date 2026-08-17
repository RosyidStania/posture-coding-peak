# 🧍 Posture Checker

Aplikasi web pendeteksi dan penganalisis postur tubuh secara *real-time* langsung di browser Anda menggunakan AI.

## 📝 Deskripsi Proyek
Proyek ini adalah sebuah aplikasi web yang dirancang untuk mendeteksi dan menganalisis postur tubuh penggunanya (misalnya mengecek postur duduk saat *coding* atau bekerja) secara *real-time* melalui kamera perangkat menggunakan teknologi kecerdasan buatan (AI). Aplikasi ini berjalan sepenuhnya di sisi klien (browser) untuk menjaga privasi pengguna.

## 🚀 Teknologi & Library Utama
*   **[React (v19)](https://react.dev/):** Digunakan sebagai *library* utama untuk membangun antarmuka pengguna (UI) aplikasi webnya.
*   **[Vite (v8)](https://vitejs.dev/):** Digunakan sebagai *build tool* dan *development server* yang membuat proses *development* menjadi sangat cepat.
*   **[TensorFlow.js](https://www.tensorflow.org/js):** *Library machine learning* dari Google yang memungkinkan model AI dijalankan langsung di dalam browser pengguna dengan bantuan akselerasi kartu grafis (WebGL).
*   **[Pose Detection](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection):** Model AI *pre-trained* (siap pakai) dari TensorFlow yang berfungsi spesifik untuk mendeteksi titik-titik persendian dan bagian tubuh manusia secara *real-time* dari tangkapan kamera.
*   **[Oxlint](https://oxc-project.github.io/docs/guide/usage/linter.html):** *Linter* super cepat (berbasis Rust) yang digunakan untuk mengecek dan menjaga kualitas kode JavaScript/TypeScript.

## 🛠️ Cara Menjalankan Proyek (Local Development)

1. Pastikan Anda sudah menginstal **Node.js**.
2. Buka terminal di direktori proyek ini, lalu jalankan instalasi dependensi:
   ```bash
   npm install
   ```
3. Jalankan *development server*:
   ```bash
   npm run dev
   ```
4. Buka tautan yang muncul di terminal (biasanya `http://localhost:5173`) pada browser Anda.
