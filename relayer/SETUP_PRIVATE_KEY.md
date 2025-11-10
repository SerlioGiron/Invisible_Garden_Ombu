# 🔑 Configuración de la Private Key del Relayer

## ⚠️ IMPORTANTE: Lee esto antes de continuar

La private key es **MUY SENSIBLE**. Sigue estas instrucciones cuidadosamente.

## Pasos para Configurar

### 1. Crear una Wallet Nueva (Recomendado)

**Opción A - Usando MetaMask:**
1. Abre MetaMask
2. Click en el icono de perfil → "Create Account"
3. Nombra la cuenta: "Ombu Relayer"
4. Ve a Account Details → Export Private Key
5. Copia la private key (sin el prefijo "0x")

**Opción B - Crear con Node.js:**
```javascript
// Ejecuta en Node.js
const { Wallet } = require('ethers');
const wallet = Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

### 2. Configurar el archivo .env

Edita `relayer/.env`:
```env
PRIVATE_KEY=tu_private_key_aqui_SIN_0x
```

**Ejemplo:**
```env
# ❌ INCORRECTO (con 0x)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# ✅ CORRECTO (sin 0x)
PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 3. Obtener ETH de Prueba (Arbitrum Sepolia)

La wallet necesita fondos para pagar el gas de las transacciones.

**Faucets disponibles:**
- 🌐 QuickNode: https://faucet.quicknode.com/arbitrum/sepolia
- 🌐 Chainlink: https://faucets.chain.link/arbitrum-sepolia
- 🌐 Alchemy: https://www.alchemy.com/faucets/arbitrum-sepolia

**Pasos:**
1. Visita uno de los faucets
2. Pega la **address de la wallet** (NO la private key)
3. Solicita ETH de prueba
4. Espera ~1 minuto

**Verificar balance:**
```javascript
// Puedes verificarlo en: https://sepolia.arbiscan.io/
// O ejecutar esto:
const { JsonRpcProvider } = require('ethers');
const provider = new JsonRpcProvider('https://arbitrum-sepolia.drpc.org');
provider.getBalance('TU_ADDRESS_AQUI').then(balance => {
  console.log('Balance:', balance.toString());
});
```

### 4. Verificar la Configuración

Tu `relayer/.env` debería verse así:
```env
PORT=3001
PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=https://arbitrum-sepolia.drpc.org
CONTRACT_ADDRESS=0xA3d4213c9f492EC63d61d734e0c7a9C6eFcc79c0
FRONTEND_URL=http://localhost:5173
```

## 🔒 Seguridad

### ✅ HACER:
- Usar una wallet NUEVA y dedicada solo para el relayer
- Mantener el balance bajo (solo lo necesario para ~100 transacciones)
- NUNCA comitear el archivo `.env` a git
- Verificar que `.gitignore` incluye `relayer/.env`
- Usar esta wallet SOLO para el relayer

### ❌ NUNCA HACER:
- Usar tu wallet personal o con fondos reales
- Compartir la private key por chat/email
- Comitear el `.env` a GitHub
- Tomar screenshots de la private key
- Usar la misma wallet para desarrollo y producción

## 🧪 Probar que Funciona

### Paso 1: Iniciar el relayer
```powershell
cd relayer
npm start
```

Deberías ver:
```
🚀 ====================================
   Ombu Relayer Server
   ====================================
   🌐 URL: http://localhost:3001
   📡 Network: https://arbitrum-sepolia.drpc.org
   📝 Contract: 0xA3d4213c9f492EC63d61d734e0c7a9C6eFcc79c0
   ====================================
```

### Paso 2: Test del endpoint
```powershell
curl http://localhost:3001/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "message": "Relayer is running",
  "contract": "0xA3d4213c9f492EC63d61d734e0c7a9C6eFcc79c0",
  "network": "https://arbitrum-sepolia.drpc.org"
}
```

## ❓ Troubleshooting

### Error: "PRIVATE_KEY not set"
- Verifica que el archivo `relayer/.env` existe
- Verifica que la línea no tiene espacios: `PRIVATE_KEY=valor`
- No uses comillas: ❌ `PRIVATE_KEY="valor"` ✅ `PRIVATE_KEY=valor`

### Error: "Insufficient funds"
- La wallet no tiene ETH de Arbitrum Sepolia
- Usa un faucet para obtener fondos de prueba
- Verifica en: https://sepolia.arbiscan.io/address/TU_ADDRESS

### Error: "Invalid private key"
- Asegúrate de NO incluir el prefijo "0x"
- Debe ser exactamente 64 caracteres hexadecimales
- Ejemplo válido: `ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

## 📊 Monitoreo

### Ver transacciones de la wallet:
https://sepolia.arbiscan.io/address/TU_ADDRESS_AQUI

### Logs del relayer:
Cuando alguien usa el relayer verás:
```
📥 POST /api/join
📝 Joining group...
   Identity Commitment: 0x...
   Contract: 0xA3d4213c9f492EC63d61d734e0c7a9C6eFcc79c0
   Relayer balance: 1000000000000000
   Transaction sent: 0xabc123...
✅ Transaction confirmed in block: 12345678
```

## 🚀 Siguiente Paso

Una vez configurado:
1. ✅ Relayer corriendo en Terminal 1
2. 🎨 Inicia el frontend en Terminal 2: `npm run dev`
3. 🌐 Abre http://localhost:5173

---

**¡Tu relayer está listo para usar!** 🎉

Si tienes problemas, revisa:
- Los logs en la terminal del relayer
- Que la wallet tenga fondos
- Que todas las variables estén en el `.env`
