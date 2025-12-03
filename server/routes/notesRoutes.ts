import express, { Request, Response } from 'express';
import auth from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Note } from '../models/Schemas';
import { extractTextFromFile } from '../utils/fileParser'; 
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Google AI
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

const router = express.Router();

// Initialize Gemini
// Ensure GEMINI_API_KEY is in your .env file
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ GEMINI_API_KEY is missing from environment variables. AI features will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key_to_prevent_init_crash");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/notes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET all notes
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

//Delete a note 
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ error: "Note not found" });

    // Delete file from filesystem
    if (fs.existsSync(note.filePath)) {
      fs.unlinkSync(note.filePath);
    }

    await Note.deleteOne({ _id: req.params.id });
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// UPLOAD a note
router.post('/upload', auth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { title } = req.body;
    
    const newNote = await Note.create({
      userId: req.user.id,
      title: title || req.file.originalname,
      filePath: req.file.path,
      fileType: path.extname(req.file.originalname).substring(1),
      originalName: req.file.originalname
    });

    res.json(newNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// --- AI FEATURES (GEMINI POWERED) ---

// 1. Summarize Endpoint
router.post('/summarize', auth, async (req: Request, res: Response) => {
  const { noteId } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server configuration error: AI Key missing" });
  }

  try {
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    // Check cache
    if (note.summary) {
        return res.json({ summary: note.summary });
    }

    // 1. Extract Text
    const textContent = await extractTextFromFile(note.filePath);
    
    if (!textContent || textContent.trim().length === 0) {
        return res.status(400).json({ error: "Could not extract text from this file." });
    }

    // 2. Gemini can handle huge context (1M tokens), so we rarely need to truncate!
    // But let's be safe with a reasonable limit (e.g., ~100k chars)
    const promptContext = textContent.substring(0, 100000); 

    // 3. Send to Gemini
    const result = await model.generateContent([
      `You are a helpful research assistant for students. Summarize the following document text concisely in markdown format. Highlight key points with bullet points, and use emojis in a way students will understand it.
      
      Document Text:
      ${promptContext}`
    ]);

    const response = await result.response;
    const summary = response.text();
    
    // Save summary
    note.summary = summary;
    await note.save();

    res.json({ summary });
  } catch (err: any) {
    console.error("Gemini Summarize Error:", err);
    res.status(500).json({ error: "AI processing failed. Check API Key." });
  }
});

// 2. Chat with Document Endpoint
router.post('/chat', auth, async (req: Request, res: Response) => {
  const { noteId, message } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server configuration error: AI Key missing" });
  }

  try {
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const textContent = await extractTextFromFile(note.filePath);
    const promptContext = textContent.substring(0, 100000); 

    // Send to Gemini
    // We use generateContent for single turn. For multi-turn chat history, we'd use startChat,
    // but here we just answer specific questions based on the doc.
    const result = await model.generateContent([
        `You are an intelligent assistant. Answer the user's question strictly based on the document content below. The user is a student. So explain it well and use emojis in a way students can understand. Make the chat lively
        
        Document Content:
        ${promptContext}
        
        User Question:
        ${message}`
    ]);

    const response = await result.response;
    const reply = response.text();

    res.json({ reply });
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    res.status(500).json({ error: "Chat failed. Check API Key." });
  }
});

export default router;