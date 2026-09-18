'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  ClipboardPaste, 
  UserPlus, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle,
  X,
  Users
} from 'lucide-react';
import { parseStudentText, DEMO_STUDENT_NAMES, deduplicateList } from '@/lib/csv-parser';
import { soundManager } from '@/lib/sound';

interface StudentListManagerProps {
  students: string[];
  onUpdateStudents: (newStudents: string[]) => void;
  onCloseModal?: () => void;
}

export default function StudentListManager({
  students,
  onUpdateStudents,
  onCloseModal,
}: StudentListManagerProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manage'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [singleNameInput, setSingleNameInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseStudentText(text);
        if (parsed.length > 0) {
          const dedupled = deduplicateList(parsed);
          onUpdateStudents(dedupled);
          soundManager.playFanfare();
          showToast(`成功匯入 ${dedupled.length} 位學生姓名！`);
          setActiveTab('manage');
        } else {
          showToast('無法在該檔案中辨識出學生姓名，請確認格式');
        }
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteImport = () => {
    if (!pasteContent.trim()) {
      showToast('請先貼上學生姓名內容');
      return;
    }
    const parsed = parseStudentText(pasteContent);
    if (parsed.length === 0) {
      showToast('未辨識出有效姓名，請確認文字內容');
      return;
    }
    const dedupled = deduplicateList(parsed);
    onUpdateStudents(dedupled);
    soundManager.playClick();
    showToast(`成功匯入 ${dedupled.length} 位學生名單！`);
    setPasteContent('');
    setActiveTab('manage');
  };

  const handleLoadDemo = () => {
    onUpdateStudents([...DEMO_STUDENT_NAMES]);
    soundManager.playClick();
    showToast(`已載入示範班級（${DEMO_STUDENT_NAMES.length} 位同學）！`);
    setActiveTab('manage');
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = singleNameInput.trim();
    if (!trimmed) return;
    if (students.includes(trimmed)) {
      showToast('名單中已存在相同姓名！');
      return;
    }
    onUpdateStudents([...students, trimmed]);
    setSingleNameInput('');
    soundManager.playClick();
    showToast(`已新增學生：${trimmed}`);
  };

  const handleRemoveStudent = (indexToRemove: number) => {
    const updated = students.filter((_, idx) => idx !== indexToRemove);
    onUpdateStudents(updated);
    soundManager.playClick();
  };

  const handleClearAll = () => {
    if (confirm('確定要清空整份學生名單嗎？此動作無法復原。')) {
      onUpdateStudents([]);
      showToast('已清空名單');
    }
  };

  const filteredStudents = students.filter(s => 
    s.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div id="student-list-manager" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              名單管理
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                目前 {students.length} 人
              </span>
            </h2>
            <p className="text-xs text-slate-500">上傳 CSV 檔案或直接貼上學生姓名名冊</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-load-demo-names"
            onClick={handleLoadDemo}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-xs"
            title="一鍵載入 30 位示範學生名單試用"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>載入示範名單 (30人)</span>
          </button>
          {onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="bg-blue-600 text-white text-xs px-4 py-2 flex items-center justify-between transition-all">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" /> {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-blue-100 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-3 gap-2">
        <button
          type="button"
          id="tab-upload-csv"
          onClick={() => setActiveTab('upload')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'upload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          上傳 CSV 檔案
        </button>

        <button
          type="button"
          id="tab-paste-text"
          onClick={() => setActiveTab('paste')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'paste'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          直接貼上名單
        </button>

        <button
          type="button"
          id="tab-manage-roster"
          onClick={() => setActiveTab('manage')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'manage'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          現有名單清單 ({students.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              id="csv-dropzone"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .txt, text/plain, text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-base font-semibold text-slate-800">
                點擊選擇檔案，或直接將 CSV / TXT 拖曳至此處
              </p>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                支援各校務系統或 Excel 匯出的 CSV 檔案。自動辨識包含「姓名」、「學生姓名」等欄位，無論是否有標題列皆可智慧解析。
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                <FileSpreadsheet className="w-4 h-4" />
                範例格式：座號,姓名 或 單純每列一人名
              </div>
            </div>
          </div>
        )}

        {activeTab === 'paste' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="paste-textarea" className="block text-xs font-semibold text-slate-700 mb-1.5">
                請貼上學生名冊（每行一位，或以頓號、逗號分隔）：
              </label>
              <textarea
                id="paste-textarea"
                rows={6}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="例如：&#10;陳冠宇&#10;林子涵&#10;黃柏翰&#10;張雅婷&#10;李承恩"
                className="w-full text-sm p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-800 placeholder:text-slate-400 outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                已輸入字元：{pasteContent.length} 字
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-clear-paste-text"
                  onClick={() => setPasteContent('')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  清空輸入
                </button>
                <button
                  type="button"
                  id="btn-confirm-paste-import"
                  onClick={handlePasteImport}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  確認匯入名單
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-4">
            {/* Add single name & Quick search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <form onSubmit={handleAddSingleStudent} className="flex-1 flex gap-2">
                <input
                  type="text"
                  id="input-add-single-student"
                  value={singleNameInput}
                  onChange={(e) => setSingleNameInput(e.target.value)}
                  placeholder="輸入學生姓名..."
                  className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  id="btn-add-student-submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  新增
                </button>
              </form>

              <div className="w-full sm:w-56">
                <input
                  type="text"
                  id="input-search-student-roster"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋姓名..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* List Table / Chips */}
            {students.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">目前名單為空</p>
                <p className="text-xs text-slate-500 mt-1">
                  請點擊上方標籤「上傳 CSV」或「直接貼上名單」，或點擊右上角載入示範名單。
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold border border-blue-200 transition-colors"
                >
                  載入 30 位示範名單
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    顯示 {filteredStudents.length} / {students.length} 位學生
                  </span>
                  <button
                    type="button"
                    id="btn-clear-all-students"
                    onClick={handleClearAll}
                    className="text-red-500 hover:text-red-700 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    清空整份名單
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-2.5 bg-slate-50/40 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {filteredStudents.map((name) => {
                    const originalIndex = students.indexOf(name);
                    return (
                      <div
                        key={`${name}-${originalIndex}`}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 shadow-2xs group hover:border-blue-300"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[10px] text-slate-400 font-mono w-4">
                            {originalIndex + 1}
                          </span>
                          <span className="font-medium truncate">{name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(originalIndex)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded"
                          title={`移除 ${name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
