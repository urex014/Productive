import express, { Request, Response } from 'express';
import { User, Chat, Message, IChat, IUser } from '../models/Schemas';
import auth from '../middleware/auth';

const router = express.Router();

// Get User Chats
router.get('/chats/user/:userId', async (req: Request, res: Response) => {
  try {
    const chats = await Chat.find({ participants: req.params.userId })
      .populate<{ participants: IUser[] }>('participants', 'username image')
      .sort({ lastMessageTime: -1 });
      
    const formatted = chats.map(c => {
      const participantList = c.participants as unknown as IUser[];
      // Find the OTHER user
      const otherUser = participantList.find((p) => p._id.toString() !== req.params.userId);
      
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
  
  const users = await User.find({
    username: { $regex: query, $options: 'i' },
    _id: { $ne: req.user.id } 
  }).limit(20).select('id username image email');
  
  res.json(users);
});

// Start Chat
router.post('/chats', async (req: Request, res: Response) => {
  const { participants, type, name, image } = req.body;
  
  // Ensure we know who the "current user" is. 
  // participants[0] is usually the creator in your frontend logic, but let's be safe.
  const currentUserId = participants[0]; 

  if (type === 'direct') {
    const existing = await Chat.findOne({
      type: 'direct',
      participants: { $all: participants, $size: 2 }
    }).populate<{ participants: IUser[] }>('participants');
    
    if (existing) {
       const participantList = existing.participants as unknown as IUser[];
       const otherUser = participantList.find((p) => p._id.toString() !== currentUserId.toString());
       
       res.json({
         id: existing._id,
         displayName: otherUser?.username,
         displayImage: otherUser?.image
       });
       return;
    }
  }

  let newChat = await Chat.create({ 
    participants, 
    type, 
    name, 
    image, 
    lastMessageTime: new Date() 
  });
  
  // CRITICAL FIX: Re-fetch and populate to ensure we have full user objects
  newChat = await newChat.populate<{ participants: IUser[] }>('participants');
  
  let displayName = name;
  let displayImage = image;

  if (type === 'direct') {
    const participantList = newChat.participants as unknown as IUser[];
    const otherUser = participantList.find((p) => p._id.toString() !== currentUserId.toString());
    
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
      .populate<{ senderId: IUser | null }>('senderId', 'username');

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