import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import officeParser from 'officeparser';

/**
 * Extracts raw text content from various file formats.
 * Supported: .txt, .pdf, .docx, .pptx
 */
export const extractTextFromFile = async (filePath: string): Promise<string> => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    // 1. Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    switch (ext) {
      case '.txt':
        return fs.readFileSync(filePath, 'utf8');

      case '.docx':
        const docxResult = await mammoth.extractRawText({ path: filePath });
        return docxResult.value;

      // Use officeparser for both PDF and PPTX as requested
      case '.pdf':
      case '.pptx':
        return new Promise((resolve, reject) => {
          // officeParser.parseOffice handles multiple formats including pdf if configured
          officeParser.parseOffice(filePath, (data: string | Buffer, err: Error) => {
            if (err) {
              console.error(`OfficeParser Error for ${ext}:`, err);
              reject(err);
            } else {
              // Explicitly handle data type
              const text = typeof data === 'string' ? data : data.toString();
              resolve(text);
            }
          });
        });

      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error(`[FileParser] Detailed Error for ${ext}:`, error);
    throw new Error(`Failed to extract text from ${path.basename(filePath)}`);
  }
};