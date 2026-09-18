// Robust CSV and pasted text parser for student rosters

export interface Student {
  id: string;
  name: string;
  seatNumber?: number;
}

export const DEMO_STUDENT_NAMES: string[] = [
  '陳冠宇', '林子涵', '黃柏翰', '張雅婷', '李承恩',
  '王品叡', '吳欣怡', '劉韋廷', '蔡孟潔', '楊宗翰',
  '許家豪', '鄭羽彤', '謝承翰', '洪詩涵', '曾彥廷',
  '邱鈺婷', '廖冠廷', '賴亭妤', '徐宏宇', '周芷瑄',
  '葉柏成', '蘇佳琳', '莊秉諺', '江若晴', '呂冠霆',
  '潘思妤', '何冠佑', '沈郁婷', '彭子軒', '蕭雅晴'
];

export function parseStudentText(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  // Remove UTF-8 BOM if present
  let cleanText = rawText.replace(/^\uFEFF/, '');

  // Split by line breaks
  const lines = cleanText
    .split(/\r\n|\n|\r/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  // Determine delimiter of the first line (comma, tab, semicolon)
  const firstLine = lines[0];
  let delimiter: string | RegExp = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  } else if (firstLine.includes('、') && !firstLine.includes(',')) {
    // Chinese enumeration comma
    return cleanText
      .split(/[、\n,]+/)
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(s => s.length > 0);
  }

  // Parse lines into cells
  const parsedRows: string[][] = lines.map(line => {
    // Basic CSV splitting handling quotes
    const cells: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (!insideQuotes && (typeof delimiter === 'string' ? char === delimiter : false)) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells.map(c => c.replace(/^["']|["']$/g, '').trim());
  });

  if (parsedRows.length === 0) return [];

  // Check if first row is a header
  const firstRow = parsedRows[0];
  let nameColIndex = -1;

  const headerKeywords = ['姓名', '學生姓名', '名字', '學生', 'name', 'student', 'student name'];
  for (let col = 0; col < firstRow.length; col++) {
    const val = firstRow[col].toLowerCase().replace(/\s+/g, '');
    if (headerKeywords.some(k => val.includes(k))) {
      nameColIndex = col;
      break;
    }
  }

  const startIndex = nameColIndex !== -1 ? 1 : 0;
  // If no header found, pick the first column with non-empty string content or single column
  const targetCol = nameColIndex !== -1 ? nameColIndex : (firstRow.length > 1 && !isNaN(Number(firstRow[0])) ? 1 : 0);

  const names: string[] = [];
  for (let i = startIndex; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    if (row.length === 0) continue;
    let cellValue = (row[targetCol] || row[0] || '').trim();

    // If cell contains seat number like "01 王大明" or "1. 李小美"
    const cleaned = cellValue.replace(/^(\d+[\s.、號-]+)/, '').trim() || cellValue;
    if (cleaned && cleaned.length > 0) {
      names.push(cleaned);
    }
  }

  return names;
}

export function deduplicateList(names: string[]): string[] {
  return Array.from(new Set(names.map(n => n.trim()))).filter(Boolean);
}
