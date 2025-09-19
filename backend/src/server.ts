import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { adminAuth } from './firebase-admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: '🎥 Streaming Overlay System Backend',
    status: 'Running',
    port: PORT,
    firebase: 'Ready'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    firebase: 'Connected'
  });
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const decodedToken = await adminAuth.verifyIdToken(token);
    res.json({ 
      success: true, 
      uid: decodedToken.uid,
      email: decodedToken.email 
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔥 Firebase Admin initialized`);
});
