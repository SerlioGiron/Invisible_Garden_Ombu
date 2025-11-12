import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import joinRoute from './routes/join.js';
import feedbackRoute from './routes/feedback.js';
import checkMemberRoute from './routes/checkMember.js';
import getGroupsRoute from './routes/getGroups.js';
import membersRoute from './routes/members.js';
import adminRoute from './routes/admin.js';
import { OMBU_CONTRACT_ADDRESS } from '../src/config/constants.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Validate critical environment variables
if (!process.env.PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY not set in .env file');
  process.exit(1);
}

if (!process.env.RPC_URL) {
  console.error('❌ Error: RPC_URL not set in .env file');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/join', joinRoute);
app.use('/api/feedback', feedbackRoute);
app.use('/api/check-member', checkMemberRoute);
app.use('/api/groups', getGroupsRoute);
app.use('/api/members', membersRoute);
app.use('/api/admin', adminRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Relayer is running',
    contract: OMBU_CONTRACT_ADDRESS,
    network: process.env.RPC_URL || process.env.VITE_PUBLIC_RPC_URL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Ombu Relayer API',
    endpoints: {
      health: '/health',
      join: '/api/join',
      feedback: '/api/feedback',
      checkMember: '/api/check-member',
      groups: '/api/groups',
      members: '/api/members/:groupId'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ====================================');
  console.log(`   Ombu Relayer Server`);
  console.log('   ====================================');
  console.log(`   🌐 URL: http://localhost:${PORT}`);
  console.log(`   📡 Network: ${process.env.RPC_URL || process.env.VITE_PUBLIC_RPC_URL}`);
  console.log(`   📝 Contract: ${OMBU_CONTRACT_ADDRESS}`);
  console.log('   ====================================');
  console.log('');
});
