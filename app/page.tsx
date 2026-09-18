'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dices, 
  Users2, 
  FileSpreadsheet, 
  Sparkles, 
  GraduationCap, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  CheckCircle,
  Layers
} from 'lucide-react';
import RandomPicker from '@/components/RandomPicker';
import GroupGenerator from '@/components/GroupGenerator';
import StudentListManager from '@/components/StudentListManager';
import { DEMO_STUDENT_NAMES } from '@/lib/csv-parser';
import { soundManager } from '@/lib/sound';

export default function Home() {
  const [students, setStudents] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('classroom_student_roster');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    return DEMO_STUDENT_NAMES;
  });
  const [activeFeature, setActiveFeature] = useState<'picker' | 'grouper' | 'list'>('picker');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Save to localStorage when students change
  const handleUpdateStudents = (newStudents: string[]) => {
    setStudents(newStudents);
    try {
      localStorage.setItem('classroom_student_roster', JSON.stringify(newStudents));
    } catch {
      // ignore
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
    if (next) soundManager.playClick();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
                班級抽籤與分組小幫手
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                教師專用 • 課堂隨機點名抽籤 • 智慧視覺化小組分配
              </p>
            </div>
          </div>

          {/* Feature Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              id="nav-feature-picker"
              onClick={() => {
                setActiveFeature('picker');
                soundManager.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeFeature === 'picker'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Dices className="w-4 h-4 text-amber-500" />
              <span>隨機抽籤</span>
            </button>

            <button
              type="button"
              id="nav-feature-grouper"
              onClick={() => {
                setActiveFeature('grouper');
                soundManager.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeFeature === 'grouper'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users2 className="w-4 h-4 text-blue-500" />
              <span>自動分組</span>
            </button>

            <button
              type="button"
              id="nav-feature-list"
              onClick={() => {
                setActiveFeature('list');
                soundManager.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeFeature === 'list'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>名單來源</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-bold">
                {students.length}
              </span>
            </button>
          </nav>

          {/* Header Utilities */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="header-sound-toggle"
              onClick={handleToggleSound}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
              title={soundEnabled ? '音效已開啟' : '音效已靜音'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Quick status bar if students are zero or few */}
        {students.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>目前名單尚無學生，請先上傳 CSV 檔案、貼上名冊，或一鍵載入示範名單開始體驗！</span>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateStudents([...DEMO_STUDENT_NAMES])}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              載入 30 人示範名單
            </button>
          </div>
        )}

        {/* Feature 1: Random Picker */}
        {activeFeature === 'picker' && (
          <div className="space-y-6">
            <RandomPicker
              students={students}
              onOpenListManager={() => setActiveFeature('list')}
            />
          </div>
        )}

        {/* Feature 2: Group Generator */}
        {activeFeature === 'grouper' && (
          <div className="space-y-6">
            <GroupGenerator
              students={students}
              onOpenListManager={() => setActiveFeature('list')}
            />
          </div>
        )}

        {/* List Manager View */}
        {activeFeature === 'list' && (
          <div className="space-y-6">
            <StudentListManager
              students={students}
              onUpdateStudents={handleUpdateStudents}
            />
          </div>
        )}

        {/* Teacher's Guide Footer / Helper Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">名單彈性支援</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                支援 CSV 檔案拖曳上傳與純文字每行一人貼上，自動排除重複與空白行。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">生動動畫與立體音效</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                抽籤滾動節奏漸緩，抽中時伴有禮炮和弦與彩帶效果，支援投影機全螢幕模式。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">視覺化智慧分組</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                可自由設定每組人數或固定組數，剩餘人數自動平衡，並可隨機指派組長。
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
        <p>為教師與課堂互動精心設計 • 資料皆安全儲存於您的瀏覽器本機端</p>
      </footer>
    </div>
  );
}
