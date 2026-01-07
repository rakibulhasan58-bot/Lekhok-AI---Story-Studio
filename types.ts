
export type Language = 'bn' | 'en' | 'ur' | 'hi';

export interface Scene {
  title: string;
  summary: string;
}

export interface Act {
  title: string;
  scenes: Scene[];
}

export interface PlotStructure {
  acts: Act[];
}

export interface Character {
  id: string;
  name: string;
  description: string;
  portraitUrl: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  characters: Character[];
  plot?: PlotStructure;
  lastModified: number;
}

export interface AppState {
  documents: Document[];
  activeDocId: string | null;
  isAdultMode: boolean;
  isGenerating: boolean;
}
