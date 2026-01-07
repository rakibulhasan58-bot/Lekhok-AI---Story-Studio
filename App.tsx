import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, Sparkles, Wand2, FileText, 
  ChevronLeft, ChevronRight, Check, Download,
  X, Image as ImageIcon, Layout, Palette, 
  Volume2, PauseCircle,
  Camera, Brush, Wand, Mic, MicOff, RefreshCw, FileOutput, Printer, Copy, Monitor, Smartphone, Layers, Zap, Sparkle, Quote, Loader2, ShieldAlert, Heart
} from 'lucide-react';
import { Document } from './types';
import { 
  processAIAction, 
  generateSpeech,
  generateComicStoryline
} from './services/geminiService';

const STORAGE_KEY = 'lekhok_ai_pro_adult_v1';

const App: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [copied, setCopied] = useState(false);
  
  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'continue' | 'rewrite' | 'regenerate' | null>(null);
  const [extraPrompt, setExtraPrompt] = useState('');

  const [isVisualStudioOpen, setIsVisualStudioOpen] = useState(false);
  const [comicPanels, setComicPanels] = useState<any[]>([]);

  // Audio/STT
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDocs(parsed.documents || []);
        setActiveId(parsed.activeDocId || null);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (docs.length > 0 || activeId) {
      setSaveStatus('saving');
      const timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ documents: docs, activeDocId: activeId }));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [docs, activeId]);

  const activeDoc = useMemo(() => docs.find(d => d.id === activeId) || null, [docs, activeId]);

  const createNewDoc = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: 'নতুন চটি কাহিনী (Erotic Novel)',
      content: '',
      characters: [],
      lastModified: Date.now()
    };
    setDocs(prev => [newDoc, ...prev]);
    setActiveId(newDoc.id);
  };

  const updateContent = useCallback((content: string) => {
    setDocs(prev => prev.map(d => d.id === activeId ? { ...d, content, lastModified: Date.now() } : d));
  }, [activeId]);

  const handleAI = async () => {
    if (!activeDoc || !currentAction) return;
    setIsGenerating(true);
    setIsPromptModalOpen(false);
    try {
      const result = await processAIAction(activeDoc.content.slice(-3000), currentAction, true, extraPrompt);
      if (currentAction === 'continue') {
        updateContent(activeDoc.content + (activeDoc.content ? '\n\n' : '') + result);
      } else {
        updateContent(activeDoc.content + '\n\n--- ' + currentAction.toUpperCase() + ' VERSION ---\n' + result);
      }
      setExtraPrompt('');
    } catch (e) {
      alert("Intelligence engine error. Please re-try.");
    } finally {
      setIsGenerating(false);
    }
  };

  const openPromptModal = (action: 'continue' | 'rewrite' | 'regenerate') => {
    setCurrentAction(action);
    setIsPromptModalOpen(true);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'bn-BD';
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      if (transcript && activeDoc) updateContent(activeDoc.content + ' ' + transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleVocalize = async () => {
    if (!activeDoc?.content.trim()) return;
    if (isSpeaking) {
      audioSourceRef.current?.stop();
      setIsSpeaking(false);
      return;
    }
    setIsGenerating(true);
    try {
      const buffer = await generateSpeech(activeDoc.content.slice(-1500));
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
      audioSourceRef.current = source;
      setIsSpeaking(true);
    } catch (e) { alert("Audio synthesis failed."); }
    finally { setIsGenerating(false); }
  };

  const exportWord = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.title}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0c] text-white font-inter overflow-hidden relative">
      <aside className={`bg-[#111] border-r border-white/5 transition-all duration-300 flex flex-col z-20 ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-red-500 tracking-tighter">LEKHOK ADULT</h1>
            <p className="text-[8px] font-bold text-slate-500 tracking-widest uppercase">18+ Erotic Novel Studio</p>
          </div>
          <button onClick={createNewDoc} className="p-2.5 bg-red-600 rounded-xl hover:bg-red-700 transition-all"><Plus size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {docs.map(doc => (
            <button key={doc.id} onClick={() => setActiveId(doc.id)} className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 ${activeId === doc.id ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-white/5 border border-transparent'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeId === doc.id ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-500'}`}><FileText size={18}/></div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate bengali-font">{doc.title}</p>
                <p className="text-[9px] text-slate-500 uppercase">{new Date(doc.lastModified).toLocaleDateString()}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-white/5">
          <div className="p-4 bg-red-600/5 rounded-2xl border border-red-600/10 flex items-center gap-3">
             <ShieldAlert size={18} className="text-red-500"/>
             <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Adult Mode Locked</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#0a0a0c]">
        <header className="h-20 bg-[#111]/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 shrink-0 print:hidden">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><ChevronLeft size={20}/></button>
            {activeDoc && (
              <input value={activeDoc.title} onChange={(e) => setDocs(docs.map(d => d.id === activeId ? {...d, title: e.target.value} : d))} className="bg-transparent border-none text-xl font-bold text-white focus:ring-0 bengali-font w-64"/>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleRecording} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-white/5 hover:bg-white/10'}`}>
              {isRecording ? <MicOff size={14}/> : <Mic size={14}/>} {isRecording ? 'Recording' : 'Voice-to-Story'}
            </button>
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5">
              <button onClick={exportWord} className="p-2 hover:text-red-500" title="Export to Word"><FileOutput size={18}/></button>
              <button onClick={() => window.print()} className="p-2 hover:text-red-500" title="Print to PDF"><Printer size={18}/></button>
              <button onClick={() => { navigator.clipboard.writeText(activeDoc?.content || ''); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="p-2 hover:text-red-500" title="Copy Content">{copied ? <Check size={18} className="text-emerald-500"/> : <Copy size={18}/>}</button>
            </div>
          </div>
        </header>

        {activeDoc ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-10 md:p-20 overflow-y-auto no-scrollbar relative group">
              <textarea 
                value={activeDoc.content} 
                onChange={(e) => updateContent(e.target.value)} 
                className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-2xl leading-[1.8] text-slate-300 bengali-font placeholder-slate-700" 
                placeholder="আপনার উত্তপ্ত কাহিনী এখানে শুরু করুন..."
              />
              <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-4 bg-[#111]/90 backdrop-blur-2xl p-2 rounded-[2rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] print:hidden">
                <button onClick={() => openPromptModal('continue')} className="px-8 py-4 bg-red-600 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-red-600/30"><Sparkle size={16}/> Continue novel</button>
                <button onClick={() => openPromptModal('rewrite')} className="px-8 py-4 bg-slate-800 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"><RefreshCw size={16}/> Intensive Rewrite</button>
                <button onClick={() => openPromptModal('regenerate')} className="px-8 py-4 bg-slate-800 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"><Wand size={16}/> New Variant</button>
              </div>
            </div>
            <aside className="w-80 border-l border-white/5 p-6 space-y-6 shrink-0 bg-[#0c0c0e] print:hidden overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Erotic Controls</p>
                <button onClick={handleVocalize} className={`w-full p-5 rounded-2xl flex items-center gap-4 text-xs font-bold transition-all ${isSpeaking ? 'bg-red-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}>
                  {isSpeaking ? <PauseCircle size={18}/> : <Volume2 size={18}/>} {isSpeaking ? 'Pause Audio' : 'Play Narration'}
                </button>
                <button onClick={async () => { 
                  setIsGenerating(true); 
                  setComicPanels([]); 
                  try {
                    const data = await generateComicStoryline(activeDoc.content); 
                    setComicPanels(data.panels || []); 
                    setIsVisualStudioOpen(true); 
                  } catch (e) { alert("Visual script generation failed."); }
                  finally { setIsGenerating(false); }
                }} className="w-full p-5 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center gap-4 text-xs font-bold transition-all">
                  <Palette size={18} className="text-red-500"/> Scene Visual Draft
                </button>
                <button onClick={() => { updateContent(activeDoc.content.split('').reverse().join('')); }} className="w-full p-5 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center gap-4 text-xs font-bold transition-all">
                  <RefreshCw size={18} className="text-blue-500"/> Reverse Text Filter
                </button>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase">Erotic Intensity Score</p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-red-500">100%</p>
                  <p className="text-[10px] font-bold text-slate-400">Pure 18+</p>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 group cursor-pointer" onClick={createNewDoc}>
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-700 shadow-2xl">
              <Heart size={48} className="text-red-600"/>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Begin Erotic Narrative</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">Unlimited free adult Bengali novel studio</p>
          </div>
        )}
      </main>

      {isPromptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#111] rounded-[2.5rem] border border-white/10 p-10 max-w-lg w-full shadow-2xl space-y-8 animate-in zoom-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tighter text-red-500">Plot Direction</h2>
              <button onClick={() => setIsPromptModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed uppercase font-bold tracking-widest">Guide the novel's flow or specific adult details for the next long segment.</p>
            <textarea value={extraPrompt} onChange={(e) => setExtraPrompt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white focus:ring-1 focus:ring-red-600 h-32 resize-none bengali-font" placeholder="E.g. এরপর মিলন আরও তীব্র হবে, বিছানায় উত্তপ্ত কথা কাটাকাটি..."/>
            <button onClick={handleAI} className="w-full py-5 bg-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl">Synthesize Novel</button>
          </div>
        </div>
      )}

      {isVisualStudioOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in">
          <div className="bg-[#0a0a0c] rounded-[3rem] border border-white/5 w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-red-500 tracking-tighter uppercase">Scene Visual Architect</h2>
              <button onClick={() => setIsVisualStudioOpen(false)} className="p-2 text-slate-500 hover:text-white"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {comicPanels.map((p, i) => (
                  <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6 transform hover:translate-y-[-5px] transition-all">
                    <div className="aspect-square bg-slate-900 rounded-2xl flex items-center justify-center text-red-600 font-black text-4xl border border-white/5 shadow-inner">{i+1}</div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-red-400 tracking-widest italic">Visual Narrative</p>
                      <p className="text-sm text-slate-400 leading-relaxed bengali-font">{p.description}</p>
                      <div className="p-5 bg-black/40 rounded-xl border-l-4 border-red-600 shadow-xl">
                        <Quote size={18} className="text-red-600 mb-2 opacity-30"/>
                        <p className="text-base font-bold bengali-font leading-relaxed">{p.dialogue}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl">
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center animate-spin shadow-[0_0_60px_rgba(220,38,38,0.5)]"><Sparkles className="text-white" size={40}/></div>
          <p className="mt-10 text-[10px] font-black uppercase tracking-[0.6em] text-red-500 animate-pulse">Engaging Adult Story Engine...</p>
        </div>
      )}

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
          textarea { height: auto !important; overflow: visible !important; color: black !important; font-size: 16pt !important; background: transparent !important; }
        }
        .bengali-font { font-family: 'Hind Siliguri', sans-serif; }
      `}</style>
    </div>
  );
};

export default App;