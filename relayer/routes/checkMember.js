import express from 'express';
import { Contract, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Cargar ABI del contrato
const abiPath = join(__dirname, '../Ombu.json');
let OmbuArtifact;
try {
  OmbuArtifact = JSON.parse(readFileSync(abiPath, 'utf8'));
} catch (error) {
  console.error('❌ Error loading contract ABI:', error.message);
  console.error('   Make sure to compile contracts with: forge build');
}

router.get('/', async (req, res) => {
  try {
    const { identityCommitment, groupId } = req.query;

    // Validación de entrada
    if (!identityCommitment) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'identityCommitment is required'
      });
    }

    if (!groupId) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'groupId is required'
      });
    }

    // Validar que el ABI esté cargado
    if (!OmbuArtifact || !OmbuArtifact.abi) {
      return res.status(500).json({
        error: 'Contract ABI not loaded',
        details: 'Run "forge build" to compile contracts'
      });
    }

    // Configurar provider (no necesitamos signer porque es una llamada de lectura)
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const contract = new Contract(
      process.env.CONTRACT_ADDRESS,
      OmbuArtifact.abi,
      provider
    );

    console.log('🔍 Checking group membership...');
    console.log('   Group ID:', groupId);
    console.log('   Identity Commitment:', identityCommitment);
    console.log('   Contract:', process.env.CONTRACT_ADDRESS);

    // Llamar a la función de vista del contrato
    const isMember = await contract.isGroupMember(groupId, identityCommitment);
    
    console.log('✅ Membership check completed:', isMember);

    return res.status(200).json({
      success: true,
      isMember: isMember,
      groupId: groupId,
      identityCommitment: identityCommitment
    });

  } catch (error) {
    console.error('❌ Error in checkMember route:', error);

    // Manejar errores específicos de ethers
    let errorMessage = error.message;
    if (error.code === 'CALL_EXCEPTION') {
      errorMessage = 'Smart contract call failed. Check if group exists.';
    }

    return res.status(500).json({
      error: 'Query failed',
      message: errorMessage,
      code: error.code
    });
  }
});

export default router;
