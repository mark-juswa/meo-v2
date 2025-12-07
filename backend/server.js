import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { EventEmitter } from 'events';

// ROUTES
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import documentRoutes from './routes/documents.js';
import applicationRoutes from './routes/applications.js';
import eventRoutes from './routes/events.js';


EventEmitter.defaultMaxListeners = 20;

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
}));

// STATIC UPLOAD FOLDER - DISABLED (Files now stored in MongoDB)
// app.use(
//     '/uploads',
//     express.static(path.join(process.cwd(), 'uploads'))
// );

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/events', eventRoutes);



// CONNECT DB
connectDB();

// START SERVER
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
