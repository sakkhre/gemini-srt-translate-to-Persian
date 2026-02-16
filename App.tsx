
import React, { useState, useEffect, useRef } from 'react';
import { SubtitleItem, TranslationStatus } from './types';
import { parseSRT, stringifySRT } from './utils/srtParser';
import { translateBatch, validateApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [status, setStatus] = useState<TranslationStatus>(TranslationStatus.IDLE);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [isApiValid, setIsApiValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [tokenEstimate, setTokenEstimate] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
    setIsApiValid(null);
  }, [apiKey]);

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
      setTokenEstimate(Math.round(content.length / 4)); // Rough estimate
    };
    reader.readAsText(file);
  };

  const handleValidateKey = async () => {
    setIsValidating(true);
    const valid = await validateApiKey(apiKey);
    setIsApiValid(valid);
    setIsValidating(false);
    if (valid) {
      alert('کلید API با موفقیت تایید شد ✅');
    } else {
      alert('کلید API نامعتبر است ❌');
    }
  };

  const stopTranslation = () => {
    abortControllerRef.current = true;
    setIsStopping(true);
  };

  const handleTranslateAll = async () => {
    if (subtitles.length === 0) return;
    if (!apiKey) {
      alert('لطفاً ابتدا کلید API خود را وارد کنید.');
      return;
    }
    
    setStatus(TranslationStatus.PROCESSING);
    setIsStopping(false);
    abortControllerRef.current = false;
    
    const batchSize = 8;
    const totalItems = subtitles.length;
    const updatedSubs = [...subtitles];

    try {
      for (let i = 0; i < totalItems; i += batchSize) {
        if (abortControllerRef.current) {
          setStatus(TranslationStatus.IDLE);
          setIsStopping(false);
          alert('ترجمه توسط کاربر متوقف شد.');
          return;
        }

        const end = Math.min(i + batchSize, totalItems);
        const batchTexts = updatedSubs.slice(i, end).map(item => item.originalText);

        for (let j = i; j < end; j++) {
          updatedSubs[j].isTranslating = true;
        }
        setSubtitles([...updatedSubs]);

        try {
          const translations = await translateBatch(batchTexts, apiKey);
          for (let j = 0; j < translations.length; j++) {
            const index = i + j;
            if (index < totalItems) {
              updatedSubs[index].translatedText = translations[j];
              updatedSubs[index].isTranslating = false;
            }
          }
        } catch (batchError) {
          console.error(`Error in batch starting at ${i}:`, batchError);
          for (let j = i; j < end; j++) {
            updatedSubs[j].isTranslating = false;
          }
        }

        setProgress(Math.round((end / totalItems) * 100));
        setSubtitles([...updatedSubs]);
      }
      setStatus(TranslationStatus.COMPLETED);
      alert('🎉 ترجمه با موفقیت به پایان رسید!');
    } catch (error) {
      console.error(error);
      setStatus(TranslationStatus.ERROR);
      alert('خطای کلی در ترجمه.');
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
    <div className="flex flex-col h-screen overflow-hidden select-none relative">
      {/* Top Background Mask */}
      <div className="absolute inset-0 bg-slate-950/40 z-[-1]"></div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0 glass z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/20">P</div>
          <h1 className="text-sm font-semibold tracking-wide">Persian Subtitle Pro v1.2</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold">API Key:</span>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Gemini API Key..."
              className="bg-transparent border-none outline-none text-xs w-32 md:w-64 text-blue-400 placeholder:text-slate-600"
            />
            <button 
              onClick={handleValidateKey}
              disabled={isValidating || !apiKey}
              className={`text-[10px] px-2 py-0.5 rounded transition-all ${isApiValid === true ? 'bg-green-600' : isApiValid === false ? 'bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {isValidating ? '...' : isApiValid === true ? 'تایید شد' : isApiValid === false ? 'نامعتبر' : 'اعتبارسنجی'}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-60">
             <span className="hidden md:inline">Win 10/11 x64</span>
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 bg-slate-900/40 border-b border-slate-800 shrink-0 glass z-10">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-xs font-medium transition-all shadow-sm flex items-center gap-2"
        >
          📂 بارگذاری SRT
        </button>
        <input type="file" accept=".srt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        <button 
          onClick={handleTranslateAll}
          disabled={subtitles.length === 0 || status === TranslationStatus.PROCESSING || isApiValid === false}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-50 rounded-md text-xs font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          ✨ ترجمه خودکار
        </button>

        {status === TranslationStatus.PROCESSING && (
          <button 
            onClick={stopTranslation}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-md text-xs font-medium transition-all flex items-center gap-2"
          >
            🛑 توقف
          </button>
        )}

        <button 
          onClick={handleExport}
          disabled={subtitles.length === 0 || status === TranslationStatus.PROCESSING}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 rounded-md text-xs font-medium transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
        >
          💾 ذخیره نهایی
        </button>

        <div className="flex-grow"></div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-[10px] text-slate-400 font-mono">
             {subtitles.length} سطر لود شده
          </div>
          <div className="text-[10px] text-blue-400 font-mono">
             تخمین توکن مصرفی: ~{tokenEstimate}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {status === TranslationStatus.PROCESSING && (
        <div className="w-full h-1 bg-slate-800 relative z-20">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-grow flex overflow-hidden relative z-0">
        <div className="flex flex-col w-full h-full overflow-hidden">
          <div className="grid grid-cols-[80px_180px_1fr_1fr] bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold uppercase tracking-widest py-2 px-4 sticky top-0 z-10 glass">
            <div className="text-center opacity-50">#</div>
            <div className="opacity-50">زمان‌بندی</div>
            <div className="opacity-50">English Source</div>
            <div className="opacity-50">ترجمه محاوره‌ای فارسی</div>
          </div>

          <div className="flex-grow overflow-y-auto">
            {subtitles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 p-8 text-center bg-slate-950/20 backdrop-blur-sm">
                <div className="w-24 h-24 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-800 mb-4">
                   <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                </div>
                <p className="text-lg font-light text-slate-300">یک فایل SRT انتخاب کنید</p>
                <p className="text-xs opacity-40 max-w-xs">ترجمه همزمان و هوشمند با رعایت لحن فیلم و سریال‌های روز دنیا</p>
              </div>
            ) : (
              subtitles.map((item) => (
                <div key={`${item.id}-${item.startTime}`} className={`grid grid-cols-[80px_180px_1fr_1fr] border-b border-slate-900/50 hover:bg-slate-900/30 transition-colors py-3 px-4 items-start ${item.isTranslating ? 'bg-blue-500/10' : ''}`}>
                  <div className="text-center text-sm font-mono text-slate-600 pt-2">{item.id}</div>
                  <div className="text-[10px] font-mono text-slate-500 pt-2 flex flex-col items-center">
                    <span>{item.startTime}</span>
                    <span className="opacity-20 my-0.5">──</span>
                    <span>{item.endTime}</span>
                  </div>
                  <div className="text-sm px-4 whitespace-pre-wrap leading-relaxed py-2 ltr border-r border-slate-800/50 text-slate-300">
                    {item.originalText}
                  </div>
                  <div className="relative group rtl px-4">
                    <textarea
                      value={item.translatedText}
                      onChange={(e) => updateTranslation(item.id, e.target.value)}
                      placeholder={item.isTranslating ? "..." : "---"}
                      rows={2}
                      className={`w-full bg-transparent text-sm leading-relaxed focus:bg-slate-800/40 p-2 rounded resize-none border-none outline-none transition-all ${item.isTranslating ? 'animate-pulse text-blue-400' : 'text-slate-100'}`}
                    />
                    {item.isTranslating && (
                      <div className="absolute left-6 top-4">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
      <footer className="px-4 py-1 bg-slate-900 border-t border-slate-800 text-[9px] flex justify-between text-slate-500 shrink-0 glass z-10">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${status === TranslationStatus.PROCESSING ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
            {status === TranslationStatus.PROCESSING ? 'در حال پردازش...' : 'آماده به کار'}
          </span>
          <span>Engine: Gemini 3 Flash Preview</span>
        </div>
        <div className="flex gap-4 rtl">
          <span className="opacity-40">Designed for Windows x64</span>
          <span>پاینده باد ایران 🦁☀️</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
