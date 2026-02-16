
import { SubtitleItem } from '../types';

export const parseSRT = (content: string): SubtitleItem[] => {
  const items: SubtitleItem[] = [];
  // بهبود جداکننده بلوک‌ها برای پشتیبانی از انواع پایان خط (Windows/Unix) و فضاهای خالی
  const blocks = content.trim().split(/\r?\n\s*\r?\n/);

  blocks.forEach((block) => {
    const lines = block.split(/\r?\n/);
    if (lines.length >= 3) {
      const idStr = lines[0].trim();
      const id = parseInt(idStr);
      
      if (isNaN(id)) return;

      const timeLine = lines[1].trim();
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      
      if (timeMatch) {
        const originalText = lines.slice(2).join('\n').trim();
        items.push({
          id,
          startTime: timeMatch[1],
          endTime: timeMatch[2],
          originalText,
          translatedText: '',
          isTranslating: false
        });
      }
    }
  });

  return items;
};

export const stringifySRT = (items: SubtitleItem[]): string => {
  return items.map(item => {
    return `${item.id}\n${item.startTime} --> ${item.endTime}\n${item.translatedText || item.originalText}\n`;
  }).join('\n');
};
