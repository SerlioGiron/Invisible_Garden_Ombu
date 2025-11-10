# 🚀 Guía Rápida - Relayer Setup

## ¿Qué es el Relayer?

El **relayer** es un servidor backend que:
- Guarda de forma segura una **private key** de una wallet
- Ejecuta transacciones al smart contract **en nombre de los usuarios**
- Permite que los usuarios interactúen con la blockchain **sin pagar gas**
- Mantiene el anonimato mediante zero-knowledge proofs (Semaphore)

## 📁 Estructura del Proyecto

```
Invisible_Garden_Ombu/
├── src/                          # Frontend (React + Vite)
│   ├── services/
│   │   └── relayerApi.js        # ✨ Cliente para llamar al relayer
│   └── ...
├── relayer/                      # ✨ Servidor backend (Express)
│   ├── index.js                 # Servidor principal
│   ├── routes/
│   │   ├── join.js              # Ruta: unirse al grupo
│   │   └── feedback.js          # Ruta: enviar feedback
│   ├── .env                     # ⚠️ Configuración con PRIVATE_KEY
│   └── package.json
└── .env                          # Configuración del frontend
```

## ⚙️ Configuración Paso a Paso

### 1. Configurar el Relayer

```bash
cd relayer
cp .env.example .env
```

Edita `relayer/.env`:
```env
PORT=3001
PRIVATE_KEY=tu_private_key_aqui_sin_0x
RPC_URL=https://arbitrum-sepolia.drpc.org
CONTRACT_ADDRESS=0xA3d4213c9f492EC63d61d734e0c7a9C6eFcc79c0
FRONTEND_URL=http://localhost:5173
```

⚠️ **MUY IMPORTANTE:**
- La wallet debe tener **ETH de Arbitrum Sepolia** para gas
- Puedes obtener ETH de prueba en: https://faucet.quicknode.com/arbitrum/sepolia
- **NUNCA** comitees el archivo `.env` con tu private key

### 2. Instalar Dependencias

**Opción A - Automática (Recomendado):**
```powershell
# En Windows PowerShell
.\setup.ps1
```

**Opción B - Manual:**
```bash
# Dependencias del frontend
npm install

# Dependencias del relayer
cd relayer
npm install
cd ..
```

### 3. Compilar Contratos (si es necesario)

Si ves errores de "Contract ABI not loaded":
```bash
forge build
```

## 🎯 Cómo Correr Todo

Necesitas **2 terminales** abiertas:

### Terminal 1 - Relayer Backend
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

### Terminal 2 - Frontend
```powershell
npm run dev
```

Abre tu navegador en: http://localhost:5173

## 🧪 Probar el Relayer

### Opción 1: Health Check
```powershell
curl http://localhost:3001/health
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Relayer is running",
  "contract": "0xA3d4213c9f492EC63d61d734e0c7a9C6eFcc79c0",
  "network": "https://arbitrum-sepolia.drpc.org"
}
```

### Opción 2: Test desde el Frontend

En tu código de React, usa:
```javascript
import { checkRelayerHealth, joinGroupViaRelayer } from './services/relayerApi';

// Verificar que el relayer está corriendo
const health = await checkRelayerHealth();
console.log(health);

// Unirse al grupo
const result = await joinGroupViaRelayer(identityCommitment);
console.log(result);
```

## 🔍 Debugging

### El relayer no inicia
- ✅ Verifica que el puerto 3001 no esté ocupado
- ✅ Verifica que tengas el archivo `relayer/.env`
- ✅ Verifica que las variables de entorno estén configuradas

### "Contract ABI not loaded"
```bash
forge build
```

### "Insufficient funds"
- La wallet del relayer necesita ETH de Arbitrum Sepolia
- Usa el faucet: https://faucet.quicknode.com/arbitrum/sepolia

### CORS errors
- Verifica que `FRONTEND_URL` en `relayer/.env` coincida con tu URL del frontend

### "Relayer server is not available"
- Asegúrate de que el relayer esté corriendo en Terminal 1
- Verifica que `VITE_RELAYER_URL` en `.env` sea `http://localhost:3001`

## 📊 Endpoints del Relayer

### GET /health
Verifica el estado del servidor

### POST /api/join
Une un usuario al grupo Semaphore
```json
{
  "identityCommitment": "0x..."
}
```

### POST /api/feedback
Envía feedback anónimo
```json
{
  "feedback": "mensaje",
  "merkleTreeDepth": 20,
  "merkleTreeRoot": "0x...",
  "nullifier": "0x...",
  "points": 100
}
```

## 🔒 Seguridad

✅ **SÍ hacer:**
- Usar una wallet dedicada solo para el relayer
- Mantener el `.env` en el `.gitignore`
- Limitar el balance de la wallet a lo mínimo necesario
- Monitorear los logs del servidor

❌ **NO hacer:**
- Compartir tu private key
- Comitear el archivo `.env`
- Usar tu wallet personal
- Exponer el relayer a internet sin autenticación (en producción)

## 🚀 Desplegar en Producción

Para producción, puedes usar:
- **Render**: https://render.com
- **Railway**: https://railway.app
- **Heroku**: https://heroku.com

Variables de entorno a configurar:
```
PORT
PRIVATE_KEY
RPC_URL
CONTRACT_ADDRESS
FRONTEND_URL
```

## 📝 Notas Adicionales

- El relayer paga el gas de TODAS las transacciones
- Considera implementar **rate limiting** en producción
- Considera agregar **autenticación** para evitar abuso
- Monitorea el balance de la wallet regularmente

## 🆘 ¿Necesitas Ayuda?

1. Revisa los logs en la terminal del relayer
2. Revisa la consola del navegador (F12)
3. Verifica que todas las variables de entorno estén configuradas
4. Asegúrate de que la wallet tenga fondos

---

**¡Listo! Tu relayer debería estar funcionando correctamente.** 🎉
