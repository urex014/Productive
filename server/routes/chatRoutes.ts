import express, { Request, Response } from 'express';
import { User, Chat, Message, IChat, IUser } from '../models/Schemas';
import auth from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// Helper interface for a populated chat
interface PopulatedChat extends Omit<IChat, 'participants'> {
  participants: IUser[];
  _id: mongoose.Types.ObjectId;
}

// Get User Chats
router.get('/chats/user/:userId', async (req: Request, res: Response) => {
  try {
    // Use lean() to get plain JS objects, easier to cast
    const chats = await Chat.find({ participants: req.params.userId })
      .populate('participants', 'username image')
      .sort({ lastMessageTime: -1 })
      .lean();
      
    const formatted = (chats as unknown as PopulatedChat[]).map(c => {
      // Find the OTHER user
      const otherUser = c.participants.find((p) => p._id.toString() !== req.params.userId);
      
      return {
        id: c._id,
        type: c.type,
        displayName: c.type === 'direct' && otherUser ? otherUser.username : c.name,
        displayImage: c.type === 'direct' && otherUser ? otherUser.image : c.image,
        lastMessage: c.lastMessage
      };
    });
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Search Users
router.get('/chats/search/users', auth, async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
      res.json([]);
      return;
  }
  
  // Access user id safely
  const currentUserId = (req as any).user.id;

  const users = await User.find({
    username: { $regex: query, $options: 'i' },
    _id: { $ne: currentUserId } 
  }).limit(20).select('id username image email');
  
  res.json(users);
});

// Start Chat
router.post('/chats', async (req: Request, res: Response) => {
  const { participants, type, name, image } = req.body;
  
  // Assuming the first participant is the creator/current user
  const currentUserId = participants[0]; 

  if (type === 'direct') {
    const existing = await Chat.findOne({
      type: 'direct',
      participants: { $all: participants, $size: 2 }
    }).populate('participants');
    
    if (existing) {
       const existingPopulated = existing as unknown as PopulatedChat;
       const otherUser = existingPopulated.participants.find((p) => p._id.toString() !== currentUserId.toString());
       
       res.json({
         id: existing._id,
         displayName: otherUser?.username,
         displayImage: otherUser?.image
       });
       return;
    }
  }

  const newChatDoc = await Chat.create({ 
    participants, 
    type, 
    name, 
    image, 
    lastMessageTime: new Date() 
  });
  
  // Populate the newly created document
  await newChatDoc.populate('participants');
  
  // Cast to our helper interface
  const newChat = newChatDoc as unknown as PopulatedChat;
  
  let displayName = name;
  let displayImage = image;

  if (type === 'direct') {
    const otherUser = newChat.participants.find((p) => p._id.toString() !== currentUserId.toString());
    
    if (otherUser) {
        displayName = otherUser.username;
        displayImage = otherUser.image;
    }
  }

  res.json({
    id: newChat._id,
    displayName,
    displayImage
  });
});

// Get Messages
router.get('/chats/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username');

    const formatted = messages.map(m => {
        const sender = m.senderId as unknown as IUser | null;
        
        return {
            id: m._id,
            message: m.message,
            senderId: sender ? sender._id : null,
            senderName: sender ? sender.username : "AI",
            createdAt: m.createdAt
        };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Delete Message
router.delete('/messages/:messageId', async (req: Request, res: Response) => {
  await Message.findByIdAndDelete(req.params.messageId);
  res.json({ success: true });
});

export default router;