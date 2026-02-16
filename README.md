
# 🎬 Persian Subtitle Pro (Advanced SRT Translator)

Persian Subtitle Pro is a high-performance Windows desktop application designed to translate English movie subtitles into **Colloquial Iranian Persian (Mahavorei)** using the **Gemini 3** AI engine.

---

## 🌟 Key Features
- **Cinematic Translation:** Understands slang, humor, and cultural context.
- **Batch Processing:** Handles long subtitle files efficiently without hitting API limits.
- **API Key Validation:** Real-time validation for your Gemini API key.
- **Stop/Cancel Support:** Stop translation at any point without losing progress.
- **Windows Optimized:** Native-like experience for Windows 10 and 11.
- **Lion & Sun Background:** Patriotic subtle interface.

---

## 💻 System Requirements (Windows 10/11)
- **Node.js:** v18.0.0 or higher.
- **Git:** Required for cloning.
- **Internet:** High-speed connection for AI processing.

---

## 🛠 Installation & Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/persian-subtitle-pro.git
   cd persian-subtitle-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

---

## 📦 Building the Windows EXE (Fixed)

To create a production-ready `.exe` for Windows 10 or 11:

1. **Install Electron and Builder:**
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. **Build the assets:**
   ```bash
   npm run build
   ```

3. **Package for Windows (x64):**
   ```bash
   npx electron-builder --win --x64
   ```
   *The generated installer will be located in the `dist/` directory.*

---

## 📖 Usage Guide
1. **API Key:** Paste your Gemini API key in the top bar and click **Validate**.
2. **Load SRT:** Drag and drop or browse for an English `.srt` file.
3. **Translate:** Click **Translate All**. You will see a progress bar and a token estimate.
4. **Edit:** You can manually tweak any translated line in real-time.
5. **Save:** Export the file as `.fa.srt`.

---

## 🦁 Patriotic Theme
This application features the historical **Lion and Sun** flag as a background element to celebrate Iranian heritage and culture.

---
**Developed for the Iranian movie community.**
