import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import cron from 'node-cron';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { Expo } from 'expo-server-sdk';
import dotenv from 'dotenv';

// Import Routes
import userRoutes from './routes/userRoutes';
import featureRoutes from './routes/featureRoutes';
import chatRoutes from './routes/chatRoutes';
import noteRoutes from './routes/notesRoutes';

// Import Models
import { Message, Chat, User, Reminder, IUser } from './models/Schemas';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const expo = new Expo();

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "60mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use('/api', userRoutes);
app.use('/api', featureRoutes);
app.use('/api', chatRoutes);  
app.use('/api/notes', noteRoutes);

// --- SOCKET.IO & PUSH LOGIC ---

// io.on('connection', (socket: Socket) => {
//   console.log('User Connected:', socket.id);

//   socket.on('joinRoom', (chatId: string) => {
//     socket.join(chatId);
//     console.log(`Socket ${socket.id} joined room: ${chatId}`);
//   });

//   socket.on('sendMessage', async ({ chatId, senderId, message }: { chatId: string, senderId: string, message: string }) => {
//     try {
//       const newMessage = await Message.create({ chatId, senderId, message });
//       const chat = await Chat.findByIdAndUpdate(chatId, { 
//         lastMessage: message, 
//         lastMessageTime: new Date() 
//       }, { new: true }).populate<{ participants: IUser[] }>('participants');

//       const sender = await User.findById(senderId);

//       if (!chat || !sender) return;

//       const msgPayload = {
//         id: newMessage._id,
//         chatId,
//         senderId,
//         message,
//         createdAt: newMessage.createdAt,
//         senderName: sender.username,
//         senderImage: sender.image
//       };
      
//       io.to(chatId).emit('receiveMessage', msgPayload);

//       const recipients = chat.participants.filter((p: any) => p._id.toString() !== senderId);
//       const notifications: any[] = [];

//       for (let user of recipients) {
//         if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
//           notifications.push({
//             to: user.expoPushToken,
//             sound: 'default',
//             title: `${sender.username} sent you a message`,
//             body: message,
//             data: { chatId, senderId, type: 'chat_message' },
//           });
//         }
//       }

//       if (notifications.length > 0) {
//         let chunks = expo.chunkPushNotifications(notifications);
//         for (let chunk of chunks) {
//           try {
//             await expo.sendPushNotificationsAsync(chunk);
//           } catch (error) {
//             console.error('Error sending push chunk', error);
//           }
//         }
//       }

//       if (chat.type === 'ai') {
//         setTimeout(async () => {
//           const aiReplyText = `AI: I received "${message}"`;
//           const aiMsg = await Message.create({ chatId, senderId: null, message: aiReplyText });
//           io.to(chatId).emit('receiveMessage', {
//             id: aiMsg._id,
//             chatId,
//             senderId: null,
//             message: aiReplyText,
//             createdAt: aiMsg.createdAt,
//             senderName: "AI Assistant"
//           });
//         }, 1000);
//       }

//     } catch (err) {
//       console.error("Socket Error:", err);
//     }
//   });

//   socket.on('leaveRoom', (chatId: string) => {
//     socket.leave(chatId);
//   });

//   socket.on('disconnect', () => {
//     console.log('User Disconnected');
//   });
// });

// --- CRON JOBS (REMINDERS) ---
cron.schedule("* * * * *", async () => {
  const now = new Date();
  
  try {
    // 1. Find reminders where remindAt time has passed (or is now)
    // We populate userId to get the expoPushToken directly
    const dueReminders = await Reminder.find({ remindAt: { $lte: now } }).populate('userId');
    
    if (dueReminders.length > 0) {
      console.log(`[CRON] Processing ${dueReminders.length} due reminders...`);
      
      const notifications: any[] = [];
      const remindersToDelete: any[] = [];

      for (const rem of dueReminders) {
        const user = rem.userId as any; // Type assertion for populated user
        
        if (user && user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
          notifications.push({
            to: user.expoPushToken,
            sound: 'default',
            title: '⏳ Task Reminder',
            body: rem.note,
            data: { taskId: rem.taskId, type: 'reminder' },
          });
        }
        
        // Mark for deletion (since we are notifying now)
        remindersToDelete.push(rem._id);
      }

      // 2. Send Push Notifications
      if (notifications.length > 0) {
        let chunks = expo.chunkPushNotifications(notifications);
        for (let chunk of chunks) {
          try {
            await expo.sendPushNotificationsAsync(chunk);
            console.log(`[CRON] Sent ${chunk.length} notifications`);
          } catch (error) {
            console.error('[CRON] Error sending push chunk', error);
          }
        }
      }

      // 3. Delete processed reminders
      if (remindersToDelete.length > 0) {
        await Reminder.deleteMany({ _id: { $in: remindersToDelete } });
        console.log(`[CRON] Cleaned up ${remindersToDelete.length} reminders.`);
      }
    }
  } catch (err) {
    console.error("[CRON] Job Error:", err);
  }
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/productivityApp';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));