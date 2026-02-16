
import React, { useState, useCallback, useRef } from 'react';
import { SubtitleItem, TranslationStatus } from './types';
import { parseSRT, stringifySRT } from './utils/srtParser';
import { translateBatch } from './services/geminiService';

const App: React.FC = () => {
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [status, setStatus] = useState<TranslationStatus>(TranslationStatus.IDLE);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseSRT(content);
      setSubtitles(parsed);
      setStatus(TranslationStatus.IDLE);
      setProgress(0);
    };
    reader.readAsText(file);
  };

  const handleTranslateAll = async () => {
    if (subtitles.length === 0) return;
    
    setStatus(TranslationStatus.PROCESSING);
    const batchSize = 10;
    const totalBatches = Math.ceil(subtitles.length / batchSize);
    
    const updatedSubs = [...subtitles];

    try {
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, subtitles.length);
        const batchItems = updatedSubs.slice(start, end);
        const batchTexts = batchItems.map(item => item.originalText);

        // Mark items as translating
        for (let j = start; j < end; j++) {
          updatedSubs[j].isTranslating = true;
        }
        setSubtitles([...updatedSubs]);

        const translations = await translateBatch(batchTexts);

        // Apply translations
        for (let j = 0; j < translations.length; j++) {
          const index = start + j;
          updatedSubs[index].translatedText = translations[j];
          updatedSubs[index].isTranslating = false;
        }

        setProgress(Math.round(((i + 1) / totalBatches) * 100));
        setSubtitles([...updatedSubs]);
      }
      setStatus(TranslationStatus.COMPLETED);
    } catch (error) {
      console.error(error);
      setStatus(TranslationStatus.ERROR);
    }
  };

  const handleExport = () => {
    const srtContent = stringifySRT(subtitles);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace('.srt', '.fa.srt') || 'translated.fa.srt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateTranslation = (id: number, text: string) => {
    setSubtitles(prev => prev.map(item => item.id === id ? { ...item, translatedText: text } : item));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Title Bar (Simulating Windows) */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-xl font-bold">P</div>
          <h1 className="text-sm font-semibold tracking-wide">Persian Subtitle Pro v1.0</h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs opacity-60">
             <span className="hidden md:inline">Windows 11 Compatible</span>
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-slate-900/50 border-b border-slate-800 shrink-0">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          بارگذاری فایل SRT (Ctrl+O)
        </button>
        <input type="file" accept=".srt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        <button 
          onClick={handleTranslateAll}
          disabled={subtitles.length === 0 || status === TranslationStatus.PROCESSING}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
          ترجمه خودکار (محاوره‌ای)
        </button>

        <button 
          onClick={handleExport}
          disabled={subtitles.length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          ذخیره فایل نهایی (Ctrl+S)
        </button>

        <div className="flex-grow"></div>

        {fileName && (
          <div className="text-xs text-slate-400 font-mono">
            {fileName} | {subtitles.length} سطر
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {status === TranslationStatus.PROCESSING && (
        <div className="w-full h-1 bg-slate-800">
          <div 
            className="h-full bg-blue-500 transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-grow flex overflow-hidden">
        {/* Subtitle Grid Header */}
        <div className="flex flex-col w-full h-full overflow-hidden">
          <div className="grid grid-cols-[80px_180px_1fr_1fr] bg-slate-900 border-b border-slate-800 text-xs font-bold uppercase tracking-wider py-2 px-4 sticky top-0 z-10">
            <div className="text-center opacity-50">ردیف</div>
            <div className="opacity-50">زمان‌بندی</div>
            <div className="opacity-50">متن اصلی (English)</div>
            <div className="opacity-50">ترجمه فارسی (محاوره‌ای)</div>
          </div>

          <div className="flex-grow overflow-y-auto">
            {subtitles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="text-lg">فایل زیرنویس خود را برای شروع به اینجا بکشید یا دکمه بارگذاری را بزنید</p>
              </div>
            ) : (
              subtitles.map((item) => (
                <div key={item.id} className={`grid grid-cols-[80px_180px_1fr_1fr] border-b border-slate-900 hover:bg-slate-900/40 transition-colors py-3 px-4 items-start ${item.isTranslating ? 'bg-blue-900/10' : ''}`}>
                  <div className="text-center text-sm font-mono text-slate-500 pt-2">{item.id}</div>
                  <div className="text-[10px] font-mono text-slate-400 pt-2 flex flex-col">
                    <span>{item.startTime}</span>
                    <span className="opacity-30">───</span>
                    <span>{item.endTime}</span>
                  </div>
                  <div className="text-sm px-4 whitespace-pre-wrap leading-relaxed py-2 ltr border-r border-slate-900">
                    {item.originalText}
                  </div>
                  <div className="relative group rtl px-4">
                    <textarea
                      value={item.translatedText}
                      onChange={(e) => updateTranslation(item.id, e.target.value)}
                      placeholder={item.isTranslating ? "در حال ترجمه..." : "هنوز ترجمه نشده..."}
                      rows={2}
                      className={`w-full bg-transparent text-sm leading-relaxed focus:bg-slate-800/50 p-2 rounded resize-none border-none outline-none transition-all ${item.isTranslating ? 'animate-pulse text-blue-400' : 'text-slate-100'}`}
                    />
                    {item.isTranslating && (
                      <div className="absolute left-6 top-4">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="px-4 py-1 bg-slate-900 border-t border-slate-800 text-[10px] flex justify-between text-slate-500 shrink-0">
        <div className="flex gap-4">
          <span>وضعیت: {status === TranslationStatus.PROCESSING ? 'در حال پردازش...' : 'آماده'}</span>
          <span>مدل: Gemini 3 Flash</span>
        </div>
        <div className="flex gap-4 rtl">
          <span>زبان رابط: فارسی</span>
          <span>سازگار با: Windows 10/11</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
