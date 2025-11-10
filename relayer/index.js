import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import joinRoute from './routes/join.js';
import feedbackRoute from './routes/feedback.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Validar variables de entorno críticas
if (!process.env.PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY not set in .env file');
  process.exit(1);
}

if (!process.env.RPC_URL) {
  console.error('❌ Error: RPC_URL not set in .env file');
  process.exit(1);
}

if (!process.env.CONTRACT_ADDRESS) {
  console.error('❌ Error: CONTRACT_ADDRESS not set in .env file');
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Relayer is running',
    contract: process.env.CONTRACT_ADDRESS,
    network: process.env.RPC_URL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Ombu Relayer API',
    endpoints: {
      health: '/health',
      join: '/api/join',
      feedback: '/api/feedback'
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
  console.log(`   📡 Network: ${process.env.RPC_URL}`);
  console.log(`   📝 Contract: ${process.env.CONTRACT_ADDRESS}`);
  console.log('   ====================================');
  console.log('');
});
