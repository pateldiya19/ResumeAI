import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ParsedResume } from '@/types/resume';

export async function parseResume(fileBuffer: Buffer, fileName: string): Promise<ParsedResume> {
  const extension = fileName.toLowerCase().split('.').pop();
  let rawText = '';

  if (extension === 'pdf') {
    const pdfData = await pdfParse(fileBuffer);
    rawText = pdfData.text;
  } else if (extension === 'docx') {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    rawText = result.value;
  } else {
    throw new Error(`Unsupported file type: ${extension}. Please upload a PDF or DOCX file.`);
  }

  rawText = rawText.replace(/\s+/g, ' ').trim();

  if (rawText.length < 50) {
    throw new Error('Could not extract sufficient text from the file. Please ensure the file is not empty or image-based.');
  }

  return {
    rawText,
    fileName,
    fileType: extension as 'pdf' | 'docx',
  };
}
