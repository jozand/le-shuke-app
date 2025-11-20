/* Tipos estrictos sin ANY para pdfmake */

export interface TFontDictionaryItem {
  normal: string;
  bold?: string;
  italics?: string;
  bolditalics?: string;
}

export interface TFontDictionary {
  [fontName: string]: TFontDictionaryItem;
}

export type Content =
  | string
  | number
  | boolean
  | Uint8Array
  | Content[]
  | {
    text?: string;
    image?: string;
    qr?: string;
    fit?: number | number[];
    width?: number;
    alignment?: "left" | "center" | "right" | "justify";
    bold?: boolean;
    fontSize?: number;
    margin?: number | [number, number] | [number, number, number, number];
    table?: Table;
    layout?: string | Layout;
    [key: string]: unknown;
  };

export interface Table {
  headerRows?: number;
  widths?: Array<number | "*" | "auto">;
  body: Content[][];
}

export interface Layout {
  hLineWidth?: (i: number, node: unknown) => number;
  vLineWidth?: (i: number, node: unknown) => number;
  hLineColor?: (i: number, node: unknown) => string;
  vLineColor?: (i: number, node: unknown) => string;
  paddingLeft?: (i: number, node: unknown) => number;
  paddingRight?: (i: number, node: unknown) => number;
}

export interface TDocumentDefinitions {
  content: Content | Content[];
  pageSize?:
  | "A4"
  | "A3"
  | "A5"
  | "LETTER"
  | "LEGAL"
  | { width: number; height: number };
  pageMargins?: number | [number, number] | [number, number, number, number];
  styles?: Record<string, Record<string, unknown>>;
  defaultStyle?: Record<string, unknown>;
}

export interface CreatePdf {
  getBlob(callback: (blob: Blob) => void): void;
  open(): void;
  print(): void;
  download(filename?: string): void;
}

export interface PdfMakeStatic {
  vfs: Record<string, string>;
  fonts?: TFontDictionary;
  createPdf(doc: TDocumentDefinitions): CreatePdf;
}

/* MÓDULOS REALMENTE NECESARIOS PARA NEXT/TURBOPACK */
declare module "pdfmake/build/pdfmake" {
  const pdfMake: PdfMakeStatic;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  export const vfs: Record<string, string>;
}
