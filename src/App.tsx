/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  ShieldCheck, 
  Delete, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Grid2X2, 
  FileText, 
  Settings, 
  UserPlus, 
  MoreVertical, 
  Type, 
  PenTool, 
  PlusSquare, 
  Share2, 
  Download, 
  Save,
  X,
  Key,
  Verified,
  Quote,
  Image as ImageIcon,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type View = 'list' | 'editor' | 'pin-setup' | 'pin-verify';
type ModalType = 'draw' | 'insert' | 'share' | 'download' | 'add-friend' | null;

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  updatedDate?: string;
  isLocked: boolean;
  image?: string;
  category?: string;
}

// --- Mock Data ---

const MOCK_NOTES: Note[] = [];

// --- Components ---

const PinPad = ({ onComplete, onChange, title, subtitle, autoComplete = true }: { 
  onComplete: (pin: string) => void, 
  onChange?: (pin: string) => void,
  title: string, 
  subtitle: string,
  autoComplete?: boolean
}) => {
  const [pin, setPin] = useState('');

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (onChange) onChange(newPin);
      if (autoComplete && newPin.length === 4) {
        setTimeout(() => onComplete(newPin), 300);
      }
    }
  };

  const handleBackspace = () => {
    const newPin = pin.slice(0, -1);
    setPin(newPin);
    if (onChange) onChange(newPin);
  };

  useEffect(() => {
    setPin('');
    if (onChange) onChange('');
  }, [title, subtitle]); // Reset when screen context changes

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto h-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-surface-container-low shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <ShieldCheck className="text-primary w-8 h-8 relative z-10" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight mb-1">{title}</h2>
        <p className="text-on-surface-variant font-medium text-xs leading-relaxed max-w-[240px] mx-auto whitespace-pre-line">
          {subtitle}
        </p>
      </div>

      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              pin.length > i ? "bg-primary ring-4 ring-primary/10 scale-110" : "bg-surface-container-high"
            )} 
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-y-2 gap-x-6 w-full max-w-xs mb-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button 
            key={num}
            onClick={() => handlePress(num)}
            className="w-full aspect-square flex items-center justify-center text-xl font-bold font-headline rounded-full hover:bg-surface-container-high active:scale-90 transition-all"
          >
            {num}
          </button>
        ))}
        <div />
        <button 
          onClick={() => handlePress('0')}
          className="w-full aspect-square flex items-center justify-center text-xl font-bold font-headline rounded-full hover:bg-surface-container-high active:scale-90 transition-all"
        >
          0
        </button>
        <button 
          onClick={handleBackspace}
          className="w-full aspect-square flex items-center justify-center rounded-full hover:bg-surface-container-high active:scale-90 transition-all text-on-surface-variant"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<View>('list');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<string[]>([]);
  const [storedPin, setStoredPin] = useState('1234'); // Default PIN
  const [pinError, setPinError] = useState(false);
  const [isCurrentNoteLocked, setIsCurrentNoteLocked] = useState(false);
  const [pendingPin, setPendingPin] = useState('');
  
  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [activeTool, setActiveTool] = useState<string>('text');
  const [drawColor, setDrawColor] = useState('black');

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (activeModal === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = drawColor;
      }
    }
  }, [activeModal, drawColor]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const saveDrawing = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setDrawings([...drawings, dataUrl]);
      setEditContent(prev => prev + `\n\n[그림 삽입됨]\n`);
      setToast('그림이 노트에 추가되었습니다.');
      setActiveModal(null);
    }
  };

  const handleDownload = (type: string) => {
    const content = `${editTitle}\n\n${editContent}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editTitle || 'note'}.${type === 'txt' ? 'txt' : 'pdf'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast(`${type.toUpperCase()} 다운로드가 시작되었습니다.`);
    setActiveModal(null);
  };

  const handleInsert = (item: string) => {
    const insertion = {
      image: '\n\n[이미지: https://picsum.photos/seed/inserted/800/600]\n',
      doc: '\n\n[문서 첨부됨: report_v1.pdf]\n',
      quote: '\n\n> "여기에 인용구를 입력하세요."\n',
      other: '\n\n[기타 항목 추가됨]\n'
    }[item as keyof typeof insertion] || '';
    
    setEditContent(prev => prev + insertion);
    setToast(`${item} 항목이 삽입되었습니다.`);
    setActiveModal(null);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setIsCurrentNoteLocked(selectedNote.isLocked);
    } else {
      setEditTitle('');
      setEditContent('');
      setIsCurrentNoteLocked(false);
    }
  }, [selectedNote]);

  const handleNoteClick = (note: Note) => {
    if (note.isLocked) {
      setSelectedNote(note);
      setView('pin-verify');
    } else {
      setSelectedNote(note);
      setView('editor');
    }
  };

  const handlePinComplete = useCallback((pin: string) => {
    if (view === 'pin-verify') {
      if (pin === storedPin) {
        setView('editor');
        setToast('암호가 해제되었습니다.');
        setPinError(false);
      } else {
        setToast('비밀번호가 일치하지 않습니다.');
        setPinError(true);
        // Reset error state after a short delay to trigger the PinPad reset
        setTimeout(() => setPinError(false), 500);
      }
    } else if (view === 'pin-setup') {
      setStoredPin(pin);
      setIsCurrentNoteLocked(true);
      if (selectedNote) {
        setNotes(prevNotes => prevNotes.map(n => n.id === selectedNote.id ? { ...n, isLocked: true } : n));
        setToast('비밀번호가 설정되었습니다.');
        setView('editor');
      } else {
        // New note: Save it automatically and stay in editor as the selected note
        const newNote: Note = {
          id: Math.random().toString(36).substr(2, 9),
          title: editTitle || '제목 없는 노트',
          content: editContent,
          date: new Date().toLocaleDateString(),
          isLocked: true,
        };
        setNotes(prevNotes => [newNote, ...prevNotes]);
        setSelectedNote(newNote);
        setToast('비밀번호가 설정되고 노트가 저장되었습니다.');
        setView('editor');
      }
      setPendingPin('');
    }
  }, [view, storedPin, selectedNote, notes, editTitle, editContent]);

  const handleSave = () => {
    if (selectedNote) {
      setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, title: editTitle, content: editContent, isLocked: isCurrentNoteLocked, updatedDate: new Date().toLocaleDateString() } : n));
    } else {
      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: editTitle || '제목 없는 노트',
        content: editContent,
        date: new Date().toLocaleDateString(),
        isLocked: isCurrentNoteLocked,
      };
      setNotes([newNote, ...notes]);
    }
    setView('list');
  };

  const handleToolbarAction = (action: string) => {
    setActiveTool(action);
    if (action !== 'text') {
      setActiveModal(action as ModalType);
    }
  };

  const renderModal = () => {
    if (!activeModal) return null;

    const showToast = (msg: string) => {
      setToast(msg);
      setActiveModal(null);
    };

    const modalContent = {
      draw: {
        title: '그리기 도구',
        icon: <PenTool className="w-6 h-6" />,
        content: (
          <div className="space-y-4">
            <div className="flex justify-around p-4 bg-surface-container-high rounded-xl">
              {[
                { name: 'black', class: 'bg-black' },
                { name: 'red', class: 'bg-red-500' },
                { name: 'blue', class: 'bg-blue-500' },
                { name: 'green', class: 'bg-green-500' }
              ].map(color => (
                <div 
                  key={color.name} 
                  onClick={() => setDrawColor(color.name)}
                  className={cn(
                    "w-10 h-10 rounded-full cursor-pointer border-4 transition-all shadow-sm", 
                    color.class,
                    drawColor === color.name ? "border-primary scale-110" : "border-white"
                  )} 
                />
              ))}
            </div>
            <div className="relative bg-white rounded-xl overflow-hidden border border-outline-variant shadow-inner">
              <canvas 
                ref={canvasRef}
                width={400}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 cursor-crosshair touch-none"
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button 
                  onClick={() => {
                    const ctx = canvasRef.current?.getContext('2d');
                    ctx?.clearRect(0, 0, 400, 200);
                  }}
                  className="px-3 py-1 bg-surface-container-high text-[10px] font-bold rounded-md"
                >
                  지우기
                </button>
                <button 
                  onClick={saveDrawing}
                  className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-md"
                >
                  완료
                </button>
              </div>
            </div>
          </div>
        )
      },
      insert: {
        title: '항목 삽입',
        icon: <PlusSquare className="w-6 h-6" />,
        content: (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleInsert('image')}
              className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-xl hover:bg-primary/5 transition-colors active:scale-95"
            >
              <ImageIcon className="w-6 h-6 text-primary" />
              <span className="text-xs font-bold">이미지</span>
            </button>
            <button 
              onClick={() => handleInsert('doc')}
              className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-xl hover:bg-primary/5 transition-colors active:scale-95"
            >
              <FileText className="w-6 h-6 text-primary" />
              <span className="text-xs font-bold">문서</span>
            </button>
            <button 
              onClick={() => handleInsert('quote')}
              className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-xl hover:bg-primary/5 transition-colors active:scale-95"
            >
              <Quote className="w-6 h-6 text-primary" />
              <span className="text-xs font-bold">인용구</span>
            </button>
            <button 
              onClick={() => handleInsert('other')}
              className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-xl hover:bg-primary/5 transition-colors active:scale-95"
            >
              <Plus className="w-6 h-6 text-primary" />
              <span className="text-xs font-bold">기타</span>
            </button>
          </div>
        )
      },
      share: {
        title: '노트 공유',
        icon: <Share2 className="w-6 h-6" />,
        content: (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant text-center mb-4">이 노트를 안전하게 공유합니다.</p>
            <button 
              onClick={() => showToast('카카오톡으로 공유되었습니다.')}
              className="w-full py-3 bg-[#FEE500] text-[#3c1e1e] rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              카카오톡으로 공유
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/note/${selectedNote?.id || 'new'}`);
                showToast('공유 링크가 복사되었습니다.');
              }}
              className="w-full py-3 bg-surface-container-high text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              링크 복사하기
            </button>
          </div>
        )
      },
      download: {
        title: '다운로드',
        icon: <Download className="w-6 h-6" />,
        content: (
          <div className="space-y-3">
            <button 
              onClick={() => handleDownload('pdf')}
              className="w-full py-3 bg-surface-container-high text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              PDF로 저장
            </button>
            <button 
              onClick={() => handleDownload('png')}
              className="w-full py-3 bg-surface-container-high text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              이미지로 저장
            </button>
            <button 
              onClick={() => handleDownload('txt')}
              className="w-full py-3 bg-surface-container-high text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              텍스트 파일(.txt)
            </button>
          </div>
        )
      },
      'add-friend': {
        title: '친구 추가',
        icon: <UserPlus className="w-6 h-6" />,
        content: (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
              <input 
                type="text" 
                placeholder="친구의 ID 또는 이메일" 
                className="w-full pl-10 pr-4 py-3 bg-surface-container-high rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && showToast('친구를 찾을 수 없습니다.')}
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">내 초대 코드</p>
                <p className="text-[10px] text-primary/60">VAULT-7782-991</p>
              </div>
              <button 
                onClick={() => showToast('초대 코드가 복사되었습니다.')}
                className="ml-auto text-[10px] font-bold text-primary bg-white px-2 py-1 rounded-md shadow-sm active:scale-95 transition-transform"
              >
                복사
              </button>
            </div>
          </div>
        )
      }
    }[activeModal];

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={() => setActiveModal(null)}
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-surface rounded-t-[32px] p-6 pb-10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-6" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {modalContent.icon}
            </div>
            <h3 className="text-lg font-bold tracking-tight">{modalContent.title}</h3>
            <button 
              onClick={() => setActiveModal(null)}
              className="ml-auto p-2 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
          {modalContent.content}
        </motion.div>
      </motion.div>
    );
  };

  const renderView = () => {
    switch (view) {
      case 'list':
        return (
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 py-2">
              <div className="flex items-center gap-4">
                <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                  <ArrowLeft className="w-5 h-5 text-primary" />
                </button>
                <h1 className="text-base font-extrabold tracking-tighter text-primary">볼티드 갤러리</h1>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                  <Lock className="w-4 h-4 text-primary" />
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all cursor-pointer">
                  <img src="https://picsum.photos/seed/user/100/100" alt="Profile" className="w-full h-full object-cover" />
                </div>
              </div>
            </header>

            <main className="px-5 pb-24 pt-1 max-w-5xl mx-auto w-full">
              <section className="mb-8">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-on-surface-variant/50" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="노트 이름" 
                    className="w-full h-12 pl-12 pr-5 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-on-surface-variant/50 font-medium text-sm"
                  />
                </div>
              </section>

              <div className="flex items-baseline justify-between mb-6 px-1">
                <h2 className="text-2xl font-bold tracking-tight text-primary">노트 목록</h2>
                <span className="text-xs font-medium text-on-surface-variant/60">최근 항목</span>
              </div>

              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-surface-container-low flex items-center justify-center mb-4 opacity-50">
                    <FileText className="w-10 h-10 text-on-surface-variant" />
                  </div>
                  <p className="text-on-surface-variant font-bold text-lg">아직 노트가 없습니다</p>
                  <p className="text-on-surface-variant/60 text-xs mt-1">새로운 노트를 작성해 보세요!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notes.map((note, idx) => (
                    <motion.div 
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleNoteClick(note)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl bg-surface-container-lowest border border-outline-variant p-1 transition-all hover:shadow-lg cursor-pointer",
                        idx === 0 && "md:col-span-2"
                      )}
                    >
                      <div className="flex flex-col h-full">
                        {note.image ? (
                          <div className={cn("relative overflow-hidden rounded-xl", idx === 0 ? "h-48" : "h-32")}>
                            <img src={note.image} alt={note.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            {note.isLocked && (
                              <div className="absolute top-3 right-3 bg-secondary-container/80 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-white fill-current" />
                                <span className="text-[8px] font-bold text-white uppercase tracking-tighter">암호화됨</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-32 bg-surface-container-high rounded-xl flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                            <PenTool className="w-10 h-10 text-on-surface-variant/20" />
                          </div>
                        )}
                        <div className="p-4 flex flex-col justify-between flex-grow">
                          <div>
                            <h3 className={cn("font-bold text-primary mb-1", idx === 0 ? "text-xl" : "text-base")}>{note.title}</h3>
                            <p className="text-on-surface-variant text-xs line-clamp-2 mb-3">{note.content}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-on-surface-variant/60 bg-surface-container-low px-2 py-0.5 rounded-md">{note.date}</span>
                            <button className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-primary">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </main>

            <div className="fixed bottom-24 right-6 z-40">
              <button 
                onClick={() => { setSelectedNote(null); setView('editor'); }}
                className="vault-gradient text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-transform"
              >
                <Plus className="w-7 h-7" />
              </button>
            </div>

            <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-surface/80 backdrop-blur-xl border-t border-outline-variant flex justify-around items-center px-4 pb-6 pt-3">
              <button className="flex flex-col items-center justify-center bg-surface-container-low text-primary rounded-xl p-2.5 active:scale-90 transition-transform">
                <Grid2X2 className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-widest mt-1">홈</span>
              </button>
              <button className="flex flex-col items-center justify-center text-on-surface-variant/40 p-2.5 hover:text-primary transition-colors">
                <Lock className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-widest mt-1">보관함</span>
              </button>
              <button className="flex flex-col items-center justify-center text-on-surface-variant/40 p-2.5 hover:text-primary transition-colors">
                <FileText className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-widest mt-1">초안</span>
              </button>
              <button className="flex flex-col items-center justify-center text-on-surface-variant/40 p-2.5 hover:text-primary transition-colors">
                <Settings className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-widest mt-1">프로필</span>
              </button>
            </nav>
          </div>
        );

      case 'editor':
        return (
          <div className="min-h-screen flex flex-col bg-surface">
            <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 py-2">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('list')} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                  <ArrowLeft className={cn("w-5 h-5", selectedNote ? "text-primary" : "text-on-surface-variant")} />
                </button>
                <div className="flex flex-col">
                  <h1 className="font-bold tracking-tight text-base text-primary">
                    {selectedNote ? selectedNote.title : '작성 중'}
                  </h1>
                  {selectedNote && (
                    <div className="flex items-center gap-2 text-[9px] text-on-surface-variant/60 font-medium">
                      <span>{selectedNote.date} 작성</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span>{selectedNote.updatedDate || selectedNote.date} 수정함</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setActiveModal('add-friend')}
                  className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-primary"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setView('pin-setup')}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isCurrentNoteLocked ? "bg-primary/10 text-primary" : "hover:bg-surface-container-high text-on-surface-variant"
                  )}
                >
                  <Lock className={cn("w-4 h-4", isCurrentNoteLocked && "fill-current")} />
                </button>
                <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-primary">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </header>

            <main className="flex-1 px-5 pt-3 pb-24 max-w-4xl mx-auto w-full overflow-y-auto">
              <div className="w-full h-full flex flex-col items-center">
                <div className="w-full max-w-4xl min-h-[400px] bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col relative group">
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 rounded-full bg-secondary-container/10 border border-secondary-container/20">
                    <Lock className="w-2.5 h-2.5 text-secondary" />
                    <span className="text-[8px] font-bold text-secondary uppercase tracking-tighter">암호화된 보관함</span>
                  </div>
                  <div className="canvas-grid flex-1 p-8 lg:p-12">
                    <input 
                      type="text" 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="제목을 입력하세요." 
                      className="w-full bg-transparent border-none font-bold text-2xl mb-4 focus:ring-0 placeholder:text-on-surface-variant/20"
                    />
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="여기에 내용을 기록하세요."
                      className="w-full h-full bg-transparent border-none resize-none font-body text-base leading-relaxed text-on-surface-variant placeholder:text-on-surface-variant/20 focus:ring-0 min-h-[300px]"
                    />
                    {drawings.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {drawings.map((src, i) => (
                          <div key={i} className="relative group/draw">
                            <img src={src} alt="Drawing" className="max-w-[150px] rounded-lg border border-outline-variant shadow-sm" />
                            <button 
                              onClick={() => setDrawings(drawings.filter((_, idx) => idx !== i))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/draw:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>

            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl z-50">
              <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-0.5">
                  <button 
                    onClick={() => handleToolbarAction('text')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg transition-all group",
                      activeTool === 'text' ? "text-primary bg-primary/5" : "text-on-surface-variant/40 hover:text-primary"
                    )}
                  >
                    <Type className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest mt-0.5 font-bold">텍스트</span>
                  </button>
                  <button 
                    onClick={() => handleToolbarAction('draw')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg transition-all group",
                      activeTool === 'draw' ? "text-primary bg-primary/5" : "text-on-surface-variant/40 hover:text-primary"
                    )}
                  >
                    <PenTool className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest mt-0.5 font-bold">그리기</span>
                  </button>
                  <button 
                    onClick={() => handleToolbarAction('insert')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg transition-all group",
                      activeTool === 'insert' ? "text-primary bg-primary/5" : "text-on-surface-variant/40 hover:text-primary"
                    )}
                  >
                    <PlusSquare className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest mt-0.5 font-bold">삽입</span>
                  </button>
                </div>
                <div className="flex items-center gap-0.5">
                  <button 
                    onClick={() => handleToolbarAction('share')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg transition-all group",
                      activeTool === 'share' ? "text-primary bg-primary/5" : "text-on-surface-variant/40 hover:text-primary"
                    )}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest mt-0.5 font-bold">공유</span>
                  </button>
                  <button 
                    onClick={() => handleToolbarAction('download')}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg transition-all group",
                      activeTool === 'download' ? "text-primary bg-primary/5" : "text-on-surface-variant/40 hover:text-primary"
                    )}
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest mt-0.5 font-bold">다운로드</span>
                  </button>
                </div>
                <button 
                  onClick={handleSave}
                  className="ml-3 px-5 py-2.5 vault-gradient text-white rounded-lg flex items-center gap-2 hover:shadow-lg active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span className="font-bold text-xs tracking-wide">저장</span>
                </button>
              </div>
            </nav>
          </div>
        );

      case 'pin-setup':
        return (
          <div className="min-h-screen flex flex-col bg-surface">
            <header className="w-full flex items-center justify-between px-6 py-2">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('editor')} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                  <ArrowLeft className="w-5 h-5 text-primary" />
                </button>
                <h1 className="font-bold tracking-tight text-base text-primary">노트 비밀번호 설정</h1>
              </div>
              <Lock className="w-4 h-4 text-secondary" />
            </header>
            <main className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
              <PinPad 
                title="비밀번호 입력" 
                subtitle="이 노트에 사용될 4자리 비밀번호를 입력하세요." 
                autoComplete={false}
                onChange={setPendingPin}
                onComplete={handlePinComplete} 
              />
              <div className="fixed bottom-0 left-0 w-full p-4 flex gap-3 bg-white/80 backdrop-blur-xl rounded-t-3xl shadow-2xl max-w-md mx-auto left-1/2 -translate-x-1/2">
                <button 
                  onClick={() => setView('editor')}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-all active:scale-95 text-sm"
                >
                  취소
                </button>
                <button 
                  onClick={() => pendingPin.length === 4 && handlePinComplete(pendingPin)}
                  className={cn(
                    "flex-1 py-3 px-6 rounded-xl font-bold text-white transition-all text-sm",
                    pendingPin.length === 4 ? "vault-gradient shadow-lg active:scale-95" : "bg-surface-container-highest text-on-surface-variant/30 cursor-not-allowed"
                  )}
                >
                  저장
                </button>
              </div>
            </main>
          </div>
        );

      case 'pin-verify':
        return (
          <div className="min-h-screen flex flex-col bg-surface">
            <header className="w-full flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('list')} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                  <ArrowLeft className="w-6 h-6 text-primary" />
                </button>
                <h1 className="font-bold tracking-tight text-lg text-primary">비밀번호 확인</h1>
              </div>
              <Lock className="w-5 h-5 text-primary fill-current" />
            </header>
            <main className="flex-1 flex flex-col items-center justify-center px-8 pb-12 max-w-md mx-auto w-full">
              <PinPad 
                title={pinError ? "비밀번호 오류" : "잠긴 노트입니다"} 
                subtitle={pinError ? "다시 입력해 주세요." : "이 노트는 보호되고 있습니다.\n비밀번호를 입력하세요."} 
                onComplete={handlePinComplete} 
              />
              <div className="w-full space-y-6 text-center mt-4">
                <button className="text-secondary font-semibold text-sm hover:underline decoration-2 underline-offset-4">
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            </main>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-surface min-h-screen shadow-2xl relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {renderModal()}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] bg-primary text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background Decorative Elements */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-secondary-container/20 filter blur-[100px]" />
        <div className="absolute bottom-[10%] right-[5%] w-72 h-72 rounded-full bg-primary-container/20 filter blur-[100px]" />
      </div>
    </div>
  );
}
