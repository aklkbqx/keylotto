declare module 'pdf-parse' {
  import type { Buffer } from 'node:buffer';
  type PdfData = { numpages: number; numrender: number; info: any; metadata: any; version: string; text: string };
  function pdfParse(dataBuffer: Buffer | Uint8Array): Promise<PdfData>;
  export default pdfParse;
}