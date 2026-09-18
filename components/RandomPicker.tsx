'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Dices, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  History, 
  Sparkles, 
  CheckCircle2, 
  Layers,
  AlertTriangle,
  Award,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '@/lib/sound';

interface RandomPickerProps {
  students: string[];
  onOpenListManager?: () => void;
}

interface DrawnRecord {
  name: string;
  timestamp: string;
  order: number;
}

export default function RandomPicker({ students, onOpenListManager }: RandomPickerProps) {
  // Settings
  const [allowDuplicate, setAllowDuplicate] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [rollSpeed, setRollSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');

  // Drawing state
  const [drawnHistory, setDrawnHistory] = useState<DrawnRecord[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [copiedHistory, setCopiedHistory] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derive remaining candidates pool
  const remainingPool = React.useMemo(() => {
    if (allowDuplicate) {
      return students;
    }
    const drawnNames = new Set(drawnHistory.map(d => d.name));
    return students.filter(s => !drawnNames.has(s));
  }, [students, allowDuplicate, drawnHistory]);

  // Sync sound manager enabled state
  useEffect(() => {
    soundManager.enabled = soundEnabled;
  }, [soundEnabled]);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const handleStartDraw = () => {
    if (isRolling) return;
    if (students.length === 0) {
      if (onOpenListManager) onOpenListManager();
      return;
    }

    // Determine target pool
    let activeCandidates = allowDuplicate ? students : remainingPool;

    // If pool is empty in non-duplicate mode, suggest reset
    if (activeCandidates.length === 0) {
      soundManager.playTick(0.5);
      return;
    }

    setIsRolling(true);
    setWinner(null);

    // Pick winning candidate randomly upfront
    const randomIndex = Math.floor(Math.random() * activeCandidates.length);
    const chosenStudent = activeCandidates[randomIndex];

    // Determine animation duration and steps based on speed setting
    const durations = {
      fast: { totalTime: 1400, initialInterval: 50, maxInterval: 220 },
      normal: { totalTime: 2600, initialInterval: 60, maxInterval: 340 },
      slow: { totalTime: 4200, initialInterval: 70, maxInterval: 450 },
    };

    const config = durations[rollSpeed];
    const startTime = Date.now();
    let currentInterval = config.initialInterval;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / config.totalTime, 1);

      // Random name flicker from full students list
      const randomCandidate = students[Math.floor(Math.random() * students.length)];
      setCurrentDisplayName(randomCandidate);

      // Play tick sound with rising pitch towards conclusion
      const pitch = 0.8 + progress * 0.6;
      soundManager.playTick(pitch);

      if (progress < 1) {
        // Exponential easing to slow down interval
        currentInterval = config.initialInterval + Math.pow(progress, 2.5) * (config.maxInterval - config.initialInterval);
        rollTimerRef.current = setTimeout(tick, currentInterval);
      } else {
        // Conclude roll on chosen winner
        setCurrentDisplayName(chosenStudent);
        setWinner(chosenStudent);
        setIsRolling(false);

        // Sound effect
        soundManager.playFanfare();

        // Confetti celebration blast
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
          });
        } catch {
          // ignore
        }

        // Record history
        const record: DrawnRecord = {
          name: chosenStudent,
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          order: drawnHistory.length + 1,
        };
        setDrawnHistory(prev => [record, ...prev]);
      }
    };

    rollTimerRef.current = setTimeout(tick, currentInterval);
  };

  const handleResetPool = () => {
    setDrawnHistory([]);
    setWinner(null);
    setCurrentDisplayName('');
    soundManager.playClick();
  };

  const handleCopyHistory = () => {
    const text = drawnHistory
      .slice()
      .reverse()
      .map((item, idx) => `第 ${idx + 1} 位：${item.name} (${item.timestamp})`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedHistory(true);
    setTimeout(() => setCopiedHistory(false), 2000);
  };

  const isPoolEmpty = !allowDuplicate && remainingPool.length === 0 && students.length > 0;

  return (
    <div 
      ref={containerRef}
      id="random-picker-section" 
      className={`relative flex flex-col rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen bg-slate-900 border-none' : 'min-h-[560px]'
      }`}
    >
      {/* Top Toolbar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
        isFullscreen ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50/70 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Dices className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isFullscreen ? 'text-white' : 'text-slate-800'}`}>
              隨機抽籤
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isFullscreen ? 'bg-slate-700 text-amber-300' : 'bg-amber-100 text-amber-800'
              }`}>
                功能 1
              </span>
            </h2>
            <p className={`text-xs ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
              {allowDuplicate ? '模式：允許重複抽取' : `不重複抽取（剩餘 ${remainingPool.length} / ${students.length} 人）`}
            </p>
          </div>
        </div>

        {/* Action Controls & Settings */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mode switch */}
          <div className={`flex items-center text-xs p-1 rounded-xl border ${
            isFullscreen ? 'bg-slate-900/60 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <button
              type="button"
              id="mode-no-repeat"
              onClick={() => {
                setAllowDuplicate(false);
                soundManager.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                !allowDuplicate 
                  ? (isFullscreen ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-amber-500 text-white font-semibold')
                  : 'hover:text-slate-900'
              }`}
            >
              不重複抽籤
            </button>
            <button
              type="button"
              id="mode-allow-repeat"
              onClick={() => {
                setAllowDuplicate(true);
                soundManager.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                allowDuplicate 
                  ? (isFullscreen ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-amber-500 text-white font-semibold')
                  : 'hover:text-slate-900'
              }`}
            >
              允許重複
            </button>
          </div>

          {/* Speed selector */}
          <div className={`hidden sm:flex items-center text-xs p-1 rounded-xl border ${
            isFullscreen ? 'bg-slate-900/60 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <span className="px-2 text-slate-400 font-medium">速度</span>
            {(['fast', 'normal', 'slow'] as const).map(speed => (
              <button
                key={speed}
                type="button"
                onClick={() => {
                  setRollSpeed(speed);
                  soundManager.playClick();
                }}
                className={`px-2 py-0.5 rounded-lg text-xs transition-all ${
                  rollSpeed === speed 
                    ? (isFullscreen ? 'bg-slate-700 text-white font-bold' : 'bg-slate-800 text-white font-semibold')
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {speed === 'fast' ? '快' : speed === 'normal' ? '標準' : '刺激慢'}
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            id="btn-toggle-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              isFullscreen 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={soundEnabled ? '關閉音效' : '開啟音效'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* History drawer trigger */}
          <button
            type="button"
            id="btn-open-history"
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
              isFullscreen 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">抽籤記錄</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
              {drawnHistory.length}
            </span>
          </button>

          {/* Fullscreen toggle for classroom projector */}
          <button
            type="button"
            id="btn-toggle-fullscreen"
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-colors ${
              isFullscreen 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={isFullscreen ? '結束投影全螢幕' : '投影全螢幕展示'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Classroom Stage Area */}
      <div className={`flex-1 flex flex-col items-center justify-center p-6 sm:p-10 ${
        isFullscreen ? 'bg-slate-900 text-white' : 'bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60'
      }`}>
        {students.length === 0 ? (
          <div className="text-center max-w-md py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isFullscreen ? 'text-white' : 'text-slate-800'}`}>
              尚未載入學生名單
            </h3>
            <p className={`text-sm mb-6 ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
              請先上傳 CSV 檔案或貼上學生名冊，即可開始課堂隨機抽籤。
            </p>
            {onOpenListManager && (
              <button
                type="button"
                onClick={onOpenListManager}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
              >
                前往設定名單
              </button>
            )}
          </div>
        ) : isPoolEmpty ? (
          /* Pool depleted notification */
          <div className="text-center max-w-md py-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center animate-bounce">
              <Award className="w-10 h-10" />
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${isFullscreen ? 'text-white' : 'text-slate-800'}`}>
              全班所有同學都已抽過一次！
            </h3>
            <p className={`text-sm mb-6 ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
              已達成了完整的一輪抽籤，您可以一鍵重置抽籤池開始新一輪，或切換為允許重複模式。
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                id="btn-reset-pool-empty"
                onClick={handleResetPool}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                重新開始下一輪抽籤
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center">
            {/* The Big Stage Display Card */}
            <div className={`relative w-full aspect-[16/9] max-h-[360px] rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all ${
              isFullscreen
                ? 'bg-slate-800/90 border-2 border-slate-700 shadow-2xl'
                : 'bg-white border-2 border-slate-200/80 shadow-xl'
            } ${isRolling ? 'ring-4 ring-amber-400/50 scale-[1.02]' : ''} ${
              winner ? 'border-amber-400 ring-4 ring-amber-300/40' : ''
            }`}>
              {/* Background ambient lighting */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-blue-500/5 to-purple-500/5 rounded-3xl pointer-events-none" />

              {/* Status Header inside stage */}
              <div className="absolute top-5 flex items-center gap-2">
                {isRolling && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white animate-pulse shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" /> 抽籤抽取中...
                  </span>
                )}
                {winner && !isRolling && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 恭喜抽中同學！
                  </span>
                )}
                {!winner && !isRolling && (
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    isFullscreen ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    準備就緒，點擊下方按鈕開始
                  </span>
                )}
              </div>

              {/* Central Name Display */}
              <div className="my-auto w-full px-4 flex flex-col items-center justify-center">
                {currentDisplayName ? (
                  <div className={`font-black tracking-tight select-none transition-all ${
                    isFullscreen ? 'text-7xl lg:text-8xl' : 'text-5xl sm:text-6xl md:text-7xl'
                  } ${
                    isRolling
                      ? (isFullscreen ? 'text-amber-300 scale-95 blur-[0.3px]' : 'text-amber-600 scale-95 blur-[0.3px]')
                      : (isFullscreen ? 'text-yellow-300 scale-105 drop-shadow-md' : 'text-slate-900 scale-105 drop-shadow-sm')
                  }`}>
                    {currentDisplayName}
                  </div>
                ) : (
                  <div className={`flex flex-col items-center ${
                    isFullscreen ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    <Dices className="w-16 h-16 mb-2 opacity-40 animate-pulse" />
                    <p className="text-base font-semibold">隨機抽出幸運學生</p>
                  </div>
                )}

                {/* Candidate position or seat number info */}
                {winner && !isRolling && (
                  <div className={`mt-3 text-sm font-medium ${
                    isFullscreen ? 'text-amber-200' : 'text-amber-700'
                  }`}>
                    第 {drawnHistory.length} 位抽中 • 課堂回答 / 演示
                  </div>
                )}
              </div>

              {/* Remaining pool counter footer inside stage */}
              <div className={`absolute bottom-4 text-xs font-medium ${
                isFullscreen ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {!allowDuplicate ? (
                  <span>待抽名單：剩餘 <strong className="text-amber-500 font-bold">{remainingPool.length}</strong> 人 / 全班 {students.length} 人</span>
                ) : (
                  <span>全班名單庫：共 <strong className="text-amber-500 font-bold">{students.length}</strong> 人（隨機無限制重複）</span>
                )}
              </div>
            </div>

            {/* Big Action Buttons */}
            <div className="mt-8 flex items-center justify-center gap-4 w-full">
              <button
                type="button"
                id="btn-start-random-draw"
                disabled={isRolling}
                onClick={handleStartDraw}
                className={`relative px-10 py-4 rounded-2xl text-lg sm:text-xl font-bold shadow-lg transition-all flex items-center gap-3 ${
                  isRolling
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-xl hover:scale-105 active:scale-95'
                }`}
              >
                <Dices className={`w-6 h-6 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isRolling ? '抽籤中...' : winner ? '再抽下一位！' : '開始隨機抽籤'}</span>
              </button>

              {!allowDuplicate && drawnHistory.length > 0 && (
                <button
                  type="button"
                  id="btn-reset-pool"
                  disabled={isRolling}
                  onClick={handleResetPool}
                  className={`p-4 rounded-2xl border transition-all text-xs font-semibold flex items-center gap-1.5 ${
                    isFullscreen
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="重設抽籤紀錄與候選池"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="hidden sm:inline">重新洗牌</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* History Drawer / Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-30 flex justify-end">
          <div className="w-full max-w-sm h-full bg-white text-slate-800 shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800">抽籤歷史紀錄</h3>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {drawnHistory.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                關閉
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {drawnHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  尚未有抽籤紀錄
                </div>
              ) : (
                drawnHistory.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                        {drawnHistory.length - idx}
                      </span>
                      <span className="font-bold text-slate-800">{item.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{item.timestamp}</span>
                  </div>
                ))
              )}
            </div>

            {drawnHistory.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyHistory}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedHistory ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHistory ? '已複製！' : '複製紀錄'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('確定清空抽籤記錄？')) {
                      handleResetPool();
                    }
                  }}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors"
                >
                  清空
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
