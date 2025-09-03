import Tesseract, { createWorker } from 'tesseract.js';
import path from 'node:path'
import { writeFile, mkdtemp } from 'node:fs/promises'
import os from 'node:os'

export type OcrTicket = { number?: string; confidence: number; box?: { x: number; y: number; w: number; h: number } };

// Group words into lines by similar Y position
function groupWordsIntoLines(words: any[]): any[][] {
  const sorted = [...words].sort((a, b) => {
    const ay = ((a.bbox?.y0 ?? 0) + (a.bbox?.y1 ?? 0)) / 2;
    const by = ((b.bbox?.y0 ?? 0) + (b.bbox?.y1 ?? 0)) / 2;
    return ay - by;
  });
  const lines: any[][] = [];
  const threshold = 12; // px
  for (const w of sorted) {
    const ymid = ((w.bbox?.y0 ?? 0) + (w.bbox?.y1 ?? 0)) / 2;
    const last = lines[lines.length - 1];
    if (!last) {
      lines.push([w]);
    } else {
      const lastY = last.reduce((acc, it) => acc + (((it.bbox?.y0 ?? 0) + (it.bbox?.y1 ?? 0)) / 2), 0) / last.length;
      if (Math.abs(ymid - lastY) <= threshold) last.push(w);
      else lines.push([w]);
    }
  }
  // sort each line by X
  lines.forEach(line => line.sort((a, b) => (a.bbox?.x0 ?? 0) - (b.bbox?.x0 ?? 0)));
  return lines;
}

// Median utility for thresholds
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

// Use local Python CLI inside the same container (Bun+Python image)
async function tryPythonCli(filePath: string): Promise<OcrTicket[] | null> {
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const py = process.env.PYTHON_BIN || "/app/venv/bin/python3";
  const script = process.env.PYTHON_OCR_SCRIPT || "/app/python/ocr_cli.py";
  try {
    const proc = Bun.spawn([py, script, absPath], { stdout: "pipe", stderr: "pipe" });
    const [out, err] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    const code = await proc.exited;
    if (code === 0) {
      const json = JSON.parse(out);
      if (json?.success && Array.isArray(json.data)) return json.data as OcrTicket[];
    } else {
      console.error("Local Python OCR failed", { code, err });
    }
  } catch (e) {
    console.error("Local Python OCR exception", e);
  }
  return null;
}

export async function extractTicketsFromImage(filePath: string): Promise<OcrTicket[]> {
  const pythonCli = await tryPythonCli(filePath);
  if (pythonCli && pythonCli.length > 0) return pythonCli;

  // Soft-preprocess via sharp if present, and try rotations
  async function preprocess(sourcePath: string, rotateDeg: number): Promise<string> {
    try {
      const sharp = (await import('sharp')).default;
      const meta = await sharp(sourcePath).metadata();
      const width = meta.width ?? 0;
      const buf = await sharp(sourcePath)
        .rotate(rotateDeg)
        .greyscale()
        .normalize()
        .sharpen()
        .median(1)
        .threshold(165)
        .linear(1.25, -10)
        .resize({ width: Math.max(800, Math.round(width * 1.8)) })
        .png()
        .toBuffer();
      const dir = await mkdtemp(path.join(os.tmpdir(), 'keylotto-'));
      const outPath = path.join(dir, `pre_${rotateDeg}.png`);
      await writeFile(outPath, buf);
      return outPath;
    } catch {
      return sourcePath;
    }
  }

  async function recognize(imgPath: string, psm: number) {
    const worker = await createWorker('eng', 1);
    try {
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
        classify_bln_numeric_mode: '1',
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
        tessedit_pageseg_mode: String(psm),
      } as any);
      return await worker.recognize(imgPath);
    } finally {
      await worker.terminate();
    }
  }

  const candidateImages = [
    await preprocess(filePath, 0),
    await preprocess(filePath, 90),
    await preprocess(filePath, -90),
    await preprocess(filePath, 180),
  ];
  const psms = [6, 7, 11, 13, 4];
  let aggregated: OcrTicket[] = [];

  for (const img of candidateImages) {
    for (const psm of psms) {
      const result = await recognize(img, psm);
      // First pass: contiguous digits from words
      const wordItemsFirst: any[] = (result as any)?.data?.words ?? [];
      const wordLines = groupWordsIntoLines(wordItemsFirst);
      let ticketsWordPass: OcrTicket[] = [];
      for (const line of wordLines) {
        const digitChars: string[] = [];
        const charToWordIndex: number[] = [];
        line.forEach((w, idx) => {
          const digits = String(w.text || '').replace(/\D+/g, '');
          for (let i = 0; i < digits.length; i++) {
            digitChars.push(digits[i]);
            charToWordIndex.push(idx);
          }
        });
        if (digitChars.length < 6) continue;
        const full = digitChars.join('');
        for (let i = 0; i + 6 <= full.length; i++) {
          const candidate = full.slice(i, i + 6);
          if (!/^[0-9]{6}$/.test(candidate)) continue;
          const startWord = charToWordIndex[i];
          const endWord = charToWordIndex[i + 5];
          const used = line.slice(startWord, endWord + 1);
          const x0 = Math.min(...used.map((w: any) => w.bbox?.x0 ?? 0));
          const y0 = Math.min(...used.map((w: any) => w.bbox?.y0 ?? 0));
          const x1 = Math.max(...used.map((w: any) => w.bbox?.x1 ?? 0));
          const y1 = Math.max(...used.map((w: any) => w.bbox?.y1 ?? 0));
          const conf = used.reduce((acc: number, w: any) => acc + (w.confidence ?? 0), 0) / Math.max(1, used.length);
          ticketsWordPass.push({ number: candidate, confidence: conf, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } });
        }
      }
      if (ticketsWordPass.length > 0) { aggregated = aggregated.concat(ticketsWordPass); continue; }

      // Symbol-token pass
      const symbols: any[] = (result as any)?.data?.symbols ?? [];
      const wordItems: any[] = (result as any)?.data?.words ?? [];
      let tokens: { ch: string; bbox: any; conf: number }[] = [];
      if (symbols.length > 0) {
        tokens = symbols
          .map(s => ({ ch: String(s.text || ''), bbox: s.bbox, conf: s.confidence }))
          .filter(s => /^\d$/.test(s.ch));
      } else {
        for (const w of wordItems) {
          const raw = String(w.text || '');
          const digits = raw.replace(/\D+/g, '');
          if (digits.length === 0) continue;
          const bb = w.bbox ?? { x0: 0, y0: 0, x1: 0, y1: 0 };
          const width = Math.max(1, (bb.x1 ?? 0) - (bb.x0 ?? 0));
          const charW = width / digits.length;
          for (let i = 0; i < digits.length; i++) {
            tokens.push({
              ch: digits[i],
              bbox: { x0: (bb.x0 ?? 0) + i * charW, y0: bb.y0 ?? 0, x1: (bb.x0 ?? 0) + (i + 1) * charW, y1: bb.y1 ?? 0 },
              conf: w.confidence ?? 50,
            });
          }
        }
      }

      if (tokens.length === 0) continue;
      const lines = groupWordsIntoLines(tokens as any);
      const tickets: OcrTicket[] = [];
      for (const line of lines) {
        const sorted = [...line].sort((a: any, b: any) => (a.bbox?.x0 ?? 0) - (b.bbox?.x0 ?? 0));
        if (sorted.length < 6) continue;
        const gaps: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1];
          const cur = sorted[i];
          gaps.push((cur.bbox?.x0 ?? 0) - (prev.bbox?.x1 ?? 0));
        }
        const medGap = median(gaps.filter(g => Number.isFinite(g)));
        const gapThreshold = (medGap || 10) * 2.2 + 6;
        let run: any[] = [];
        const flushRun = () => {
          if (run.length >= 6) {
            for (let i = 0; i + 6 <= run.length; i++) {
              const seq = run.slice(i, i + 6);
              const num = seq.map((t: any) => String(t.ch)).join('');
              if (!/^[0-9]{6}$/.test(num)) continue;
              const x0 = Math.min(...seq.map((s: any) => s.bbox?.x0 ?? 0));
              const y0 = Math.min(...seq.map((s: any) => s.bbox?.y0 ?? 0));
              const x1 = Math.max(...seq.map((s: any) => s.bbox?.x1 ?? 0));
              const y1 = Math.max(...seq.map((s: any) => s.bbox?.y1 ?? 0));
              const conf = seq.reduce((a: number, s: any) => a + (s.conf ?? 0), 0) / seq.length;
              tickets.push({ number: num, confidence: conf, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } });
            }
          }
          run = [];
        };
        for (let i = 0; i < sorted.length; i++) {
          const tok = sorted[i];
          if (run.length === 0) { run.push(tok); continue; }
          const prev = run[run.length - 1];
          const gap = (tok.bbox?.x0 ?? 0) - (prev.bbox?.x1 ?? 0);
          if (gap <= gapThreshold) run.push(tok); else { flushRun(); run.push(tok); }
        }
        flushRun();
      }

      aggregated = aggregated.concat(tickets);
    }
  }

  const bestByNum = new Map<string, OcrTicket>();
  for (const t of aggregated) {
    if (!t.number) continue;
    const prev = bestByNum.get(t.number);
    if (!prev || t.confidence > prev.confidence) bestByNum.set(t.number, t);
  }
  return Array.from(bestByNum.values());
}


