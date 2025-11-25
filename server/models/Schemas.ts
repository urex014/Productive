import mongoose, { Schema, Document, model } from 'mongoose';



export interface IUser extends Document {
  username: string;
  email: string;
  password?: string; 
  image: string;
  expoPushToken?: string;
  reset_token?: string;
  reset_token_expiry?: Date;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;
}

export interface IReminder extends Document {
  userId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  note: string;
  remindAt: Date;
}

export interface IJournal extends Document {
  userId: mongoose.Types.ObjectId;
  title?: string;
  content: string;
}

export interface ITimetable extends Document {
  userId: mongoose.Types.ObjectId;
  day: string;
  time_slot: string;
  task: string;
  duration: number;
}

export interface IChat extends Document {
  type: 'direct' | 'group' | 'ai';
  name?: string;
  image?: string;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: string;
  lastMessageTime?: Date;
}

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId | null; 
  message: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

// --- Schemas ---

const toJSONConfig = {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  }
};

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, default: "" },
  expoPushToken: { type: String },
  reset_token: { type: String },
  reset_token_expiry: { type: Date },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastStudyDate: { type: Date, default: null },
}, { timestamps: true, toJSON: toJSONConfig });

const taskSchema = new Schema<ITask>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  completed: { type: Boolean, default: false }
}, { timestamps: true, toJSON: toJSONConfig });

const reminderSchema = new Schema<IReminder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  note: { type: String, required: true },
  remindAt: { type: Date, required: true }
}, { timestamps: true, toJSON: toJSONConfig });

const journalSchema = new Schema<IJournal>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  content: { type: String, required: true }
}, { timestamps: true, toJSON: toJSONConfig });

const timetableSchema = new Schema<ITimetable>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true },
  time_slot: { type: String, required: true },
  task: { type: String, default: "" },
  duration: { type: Number, default: 60 }
}, { toJSON: toJSONConfig });

const chatSchema = new Schema<IChat>({
  type: { type: String, enum: ['direct', 'group', 'ai'], default: 'direct' },
  name: { type: String },
  image: { type: String },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String },
  lastMessageTime: { type: Date }
}, { timestamps: true, toJSON: toJSONConfig });

const messageSchema = new Schema<IMessage>({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  message: { type: String, required: true },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true, toJSON: toJSONConfig });

// --- Models ---

export const User = model<IUser>('User', userSchema);
export const Task = model<ITask>('Task', taskSchema);
export const Reminder = model<IReminder>('Reminder', reminderSchema);
export const Journal = model<IJournal>('Journal', journalSchema);
export const Timetable = model<ITimetable>('Timetable', timetableSchema);
export const Chat = model<IChat>('Chat', chatSchema);
export const Message = model<IMessage>('Message', messageSchema);