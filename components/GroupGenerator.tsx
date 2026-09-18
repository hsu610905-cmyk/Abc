'use client';

import React, { useState } from 'react';
import { 
  Users2, 
  Shuffle, 
  Copy, 
  Check, 
  Download, 
  Crown, 
  Sparkles, 
  Layers, 
  Sliders, 
  Settings2,
  RefreshCw,
  Award
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface GroupGeneratorProps {
  students: string[];
  onOpenListManager?: () => void;
}

interface Group {
  id: number;
  name: string;
  members: string[];
  leader?: string;
  colorTheme: {
    bg: string;
    border: string;
    badge: string;
    text: string;
    accent: string;
  };
}

const COLOR_PALETTES = [
  { bg: 'bg-blue-50/70', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-900', accent: 'bg-blue-600' },
  { bg: 'bg-emerald-50/70', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-900', accent: 'bg-emerald-600' },
  { bg: 'bg-purple-50/70', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', text: 'text-purple-900', accent: 'bg-purple-600' },
  { bg: 'bg-amber-50/70', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-900', accent: 'bg-amber-600' },
  { bg: 'bg-rose-50/70', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', text: 'text-rose-900', accent: 'bg-rose-600' },
  { bg: 'bg-teal-50/70', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', text: 'text-teal-900', accent: 'bg-teal-600' },
  { bg: 'bg-indigo-50/70', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', text: 'text-indigo-900', accent: 'bg-indigo-600' },
  { bg: 'bg-orange-50/70', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-900', accent: 'bg-orange-600' },
  { bg: 'bg-cyan-50/70', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', text: 'text-cyan-900', accent: 'bg-cyan-600' },
  { bg: 'bg-fuchsia-50/70', border: 'border-fuchsia-200', badge: 'bg-fuchsia-100 text-fuchsia-700', text: 'text-fuchsia-900', accent: 'bg-fuchsia-600' },
];

const THEME_NAMES = {
  number: (idx: number) => `第 ${idx + 1} 組`,
  alphabet: (idx: number) => `Group ${String.fromCharCode(65 + (idx % 26))}`,
  animal: (idx: number) => {
    const animals = ['飛鷹隊', '猛虎隊', '靈狐隊', '巨鯨隊', '獵豹隊', '海豚隊', '雄獅隊', '金剛隊', '黑熊隊', '神木隊'];
    return animals[idx % animals.length] || `第 ${idx + 1} 組`;
  },
  planet: (idx: number) => {
    const planets = ['太陽隊', '月球隊', '火星隊', '木星隊', '土星隊', '金星隊', '水星隊', '天王星隊', '海王星隊', '北極星隊'];
    return planets[idx % planets.length] || `第 ${idx + 1} 組`;
  }
};

export default function GroupGenerator({ students, onOpenListManager }: GroupGeneratorProps) {
  // Settings
  const [groupSizeMode, setGroupSizeMode] = useState<'bySize' | 'byCount'>('bySize');
  const [studentsPerGroup, setStudentsPerGroup] = useState<number>(4);
  const [targetGroupCount, setTargetGroupCount] = useState<number>(4);
  const [remainderStrategy, setRemainderStrategy] = useState<'distribute' | 'separate'>('distribute');
  const [nameTheme, setNameTheme] = useState<'number' | 'alphabet' | 'animal' | 'planet'>('number');
  const [assignLeader, setAssignLeader] = useState<boolean>(true);

  // Grouping State
  const [groups, setGroups] = useState<Group[]>([]);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Quick estimation calculation
  const totalStudents = students.length;
  let estimatedGroups = 0;
  let remainder = 0;

  if (totalStudents > 0) {
    if (groupSizeMode === 'bySize') {
      const size = Math.max(1, studentsPerGroup);
      estimatedGroups = Math.floor(totalStudents / size);
      remainder = totalStudents % size;
      if (remainder > 0 && remainderStrategy === 'separate') {
        estimatedGroups += 1;
      }
    } else {
      estimatedGroups = Math.min(totalStudents, Math.max(1, targetGroupCount));
    }
  }

  // Perform grouping logic
  const handleGenerateGroups = () => {
    if (totalStudents === 0) {
      if (onOpenListManager) onOpenListManager();
      return;
    }

    setIsShuffling(true);
    soundManager.playShuffle();

    setTimeout(() => {
      // 1. Shuffle students copy with Fisher-Yates
      const shuffled = [...students];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const generatedGroups: Group[] = [];

      if (groupSizeMode === 'bySize') {
        const size = Math.max(1, studentsPerGroup);
        const baseGroupCount = Math.floor(totalStudents / size);
        const rem = totalStudents % size;

        if (baseGroupCount === 0 || rem === 0 || remainderStrategy === 'separate') {
          // Standard chunking
          let currentChunk: string[] = [];
          for (let i = 0; i < shuffled.length; i++) {
            currentChunk.push(shuffled[i]);
            if (currentChunk.length === size || i === shuffled.length - 1) {
              const gIdx = generatedGroups.length;
              generatedGroups.push({
                id: gIdx + 1,
                name: THEME_NAMES[nameTheme](gIdx),
                members: [...currentChunk],
                colorTheme: COLOR_PALETTES[gIdx % COLOR_PALETTES.length],
              });
              currentChunk = [];
            }
          }
        } else {
          // Distribute remainder evenly across base groups
          const numGroups = baseGroupCount;
          for (let g = 0; g < numGroups; g++) {
            generatedGroups.push({
              id: g + 1,
              name: THEME_NAMES[nameTheme](g),
              members: [],
              colorTheme: COLOR_PALETTES[g % COLOR_PALETTES.length],
            });
          }
          // Distribute students round-robin or chunk
          shuffled.forEach((student, idx) => {
            const groupTarget = idx % numGroups;
            generatedGroups[groupTarget].members.push(student);
          });
        }
      } else {
        // Group by fixed count
        const count = Math.min(totalStudents, Math.max(1, targetGroupCount));
        for (let g = 0; g < count; g++) {
          generatedGroups.push({
            id: g + 1,
            name: THEME_NAMES[nameTheme](g),
            members: [],
            colorTheme: COLOR_PALETTES[g % COLOR_PALETTES.length],
          });
        }
        shuffled.forEach((student, idx) => {
          const groupTarget = idx % count;
          generatedGroups[groupTarget].members.push(student);
        });
      }

      // Assign leaders if enabled
      if (assignLeader) {
        generatedGroups.forEach(group => {
          if (group.members.length > 0) {
            const randomLeader = group.members[Math.floor(Math.random() * group.members.length)];
            group.leader = randomLeader;
          }
        });
      }

      setGroups(generatedGroups);
      setIsShuffling(false);
      soundManager.playFanfare();
    }, 450);
  };

  // Toggle leader manually
  const handleToggleLeader = (groupId: number, studentName: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          leader: g.leader === studentName ? undefined : studentName,
        };
      }
      return g;
    }));
    soundManager.playClick();
  };

  // Copy result
  const handleCopyResults = () => {
    if (groups.length === 0) return;

    let text = `【分組結果】 全班共 ${totalStudents} 人，共分成 ${groups.length} 組\n\n`;
    groups.forEach(g => {
      text += `📍 ${g.name} (${g.members.length} 人):\n`;
      text += g.members.map(m => m === g.leader ? `${m} (⭐組長)` : m).join('、');
      text += '\n\n';
    });

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    soundManager.playClick();
    setTimeout(() => setCopiedText(false), 2200);
  };

  // Download CSV
  const handleDownloadCSV = () => {
    if (groups.length === 0) return;
    let csvContent = '\uFEFF組別,組名,學生姓名,是否為組長\n';
    groups.forEach(g => {
      g.members.forEach(m => {
        csvContent += `"${g.id}","${g.name}","${m}","${m === g.leader ? '是' : '否'}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `班級分組結果_${new Date().toLocaleDateString('zh-TW')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="group-generator-section" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
      {/* Top Header & Settings bar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              自動分組
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                功能 2
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              全班共 {totalStudents} 人 • 設定每組人數或固定組數進行隨機平均分配
            </p>
          </div>
        </div>

        {/* Quick action buttons if groups exist */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-copy-groups"
              onClick={handleCopyResults}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
              title="複製分組文字結果到剪貼簿"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? '已複製！' : '複製文字'}</span>
            </button>

            <button
              type="button"
              id="btn-download-groups-csv"
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
              title="匯出分組名單 CSV 檔案"
            >
              <Download className="w-3.5 h-3.5" />
              <span>匯出 CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <div className="p-6 bg-slate-50/40 border-b border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          {/* Setting 1: Grouping Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              分組方式
            </label>
            <div className="grid grid-cols-2 p-1 bg-white border border-slate-200 rounded-xl text-xs font-medium">
              <button
                type="button"
                id="mode-by-size"
                onClick={() => setGroupSizeMode('bySize')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  groupSizeMode === 'bySize'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                每組幾人
              </button>
              <button
                type="button"
                id="mode-by-count"
                onClick={() => setGroupSizeMode('byCount')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  groupSizeMode === 'byCount'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                固定組數
              </button>
            </div>
          </div>

          {/* Setting 2: Numeric value with stepper */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {groupSizeMode === 'bySize' ? '設定每組人數' : '設定分成幾組'}
            </label>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  if (groupSizeMode === 'bySize') {
                    setStudentsPerGroup(prev => Math.max(2, prev - 1));
                  } else {
                    setTargetGroupCount(prev => Math.max(2, prev - 1));
                  }
                  soundManager.playClick();
                }}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center font-bold text-slate-800 text-sm">
                {groupSizeMode === 'bySize' ? `${studentsPerGroup} 人 / 組` : `共 ${targetGroupCount} 組`}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (groupSizeMode === 'bySize') {
                    setStudentsPerGroup(prev => Math.min(totalStudents || 20, prev + 1));
                  } else {
                    setTargetGroupCount(prev => Math.min(totalStudents || 20, prev + 1));
                  }
                  soundManager.playClick();
                }}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Setting 3: Remainder & Name style */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                組名風格
              </label>
              <select
                id="select-name-theme"
                value={nameTheme}
                onChange={(e) => setNameTheme(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs py-2 px-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="number">第 1, 2, 3 組</option>
                <option value="alphabet">Group A, B, C</option>
                <option value="animal">活力動物隊</option>
                <option value="planet">星系行星隊</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                隨機指定組長
              </label>
              <button
                type="button"
                id="btn-toggle-leader-assign"
                onClick={() => setAssignLeader(!assignLeader)}
                className={`w-full py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  assignLeader
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${assignLeader ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{assignLeader ? '自動選組長' : '不指定組長'}</span>
              </button>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div>
            <button
              type="button"
              id="btn-generate-groups"
              disabled={isShuffling || totalStudents === 0}
              onClick={handleGenerateGroups}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all ${
                totalStudents === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white active:scale-98 shadow-blue-500/20'
              }`}
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{isShuffling ? '正在隨機分組中...' : groups.length > 0 ? '重新隨機分組' : '開始自動分組'}</span>
            </button>
          </div>
        </div>

        {/* Estimation reminder */}
        {totalStudents > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>
              預估將 {totalStudents} 位學生分成 <strong>{estimatedGroups}</strong> 組
              {groupSizeMode === 'bySize' && remainder > 0 && (
                <span className="ml-1 text-slate-500">
                  （各組人數將自動平衡，人數落差最多僅 1 人）
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Visualized Groups Display Area */}
      <div className="flex-1 p-6 bg-slate-50/20">
        {totalStudents === 0 ? (
          <div className="text-center py-16 max-w-sm mx-auto">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">尚未匯入學生名單</h3>
            <p className="text-xs text-slate-500 mb-4">
              請先上傳 CSV 或貼上名單，系統即可依設定人數為全班進行分組。
            </p>
            {onOpenListManager && (
              <button
                type="button"
                onClick={onOpenListManager}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                前往名單管理
              </button>
            )}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Users2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">準備就緒，尚未產生分組</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              點擊上方「開始自動分組」按鈕，系統將以演算法洗牌，並即時以色彩視覺化卡片呈現各小組成員名單。
            </p>
            <button
              type="button"
              onClick={handleGenerateGroups}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto"
            >
              <Shuffle className="w-4 h-4" />
              立即隨機分組
            </button>
          </div>
        ) : (
          <div>
            {/* Visual Bento Grid for Groups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groups.map((group) => {
                const theme = group.colorTheme;
                return (
                  <div
                    key={group.id}
                    className={`rounded-2xl border ${theme.border} ${theme.bg} p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:scale-[1.01]`}
                  >
                    {/* Group Header */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${theme.accent}`} />
                          <h4 className={`font-bold text-base ${theme.text}`}>
                            {group.name}
                          </h4>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                          {group.members.length} 人
                        </span>
                      </div>

                      {/* Group Members Pills */}
                      <div className="space-y-1.5">
                        {group.members.map((member, mIdx) => {
                          const isLeader = group.leader === member;
                          return (
                            <div
                              key={`${member}-${mIdx}`}
                              onClick={() => handleToggleLeader(group.id, member)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                                isLeader
                                  ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-bold shadow-xs'
                                  : 'bg-white/90 border-slate-200/80 text-slate-800 hover:bg-white hover:border-slate-300'
                              }`}
                              title="點擊可設定/取消為組長"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-[10px] text-slate-400 font-mono w-3.5">
                                  {mIdx + 1}
                                </span>
                                <span className="truncate">{member}</span>
                              </div>

                              {isLeader && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-200/70 px-1.5 py-0.5 rounded-md">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                  組長
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer hint */}
                    <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-400">
                      <span>點擊姓名可更換組長</span>
                      <span>第 {group.id} 組</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
