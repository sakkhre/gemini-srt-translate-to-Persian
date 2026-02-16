
export interface SubtitleItem {
  id: number;
  startTime: string;
  endTime: string;
  originalText: string;
  translatedText: string;
  isTranslating: boolean;
}

export enum TranslationStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
