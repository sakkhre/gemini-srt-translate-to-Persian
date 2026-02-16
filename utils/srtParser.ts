
import { SubtitleItem } from '../types';

export const parseSRT = (content: string): SubtitleItem[] => {
  const items: SubtitleItem[] = [];
  const blocks = content.trim().split(/\n\s*\n/);

  blocks.forEach((block) => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const id = parseInt(lines[0].trim());
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      
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
