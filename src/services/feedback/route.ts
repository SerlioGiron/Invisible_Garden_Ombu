import { Contract, JsonRpcProvider, Wallet } from "ethers"
import OmbuArtifact from "../../../out/Ombu.sol/Ombu.json"
import { OMBU_CONTRACT_ADDRESS } from "../../config/constants"

export async function POST(req: Request) {
    if (typeof process.env.PRIVATE_KEY !== "string") {
        throw new Error("Please, define PRIVATE_KEY in your .env file")
    }

    const privateKey = process.env.PRIVATE_KEY
    const rpcUrl = process.env.RPC_URL || process.env.VITE_PUBLIC_RPC_URL as string
    const contractAddress = OMBU_CONTRACT_ADDRESS as string

    const provider = new JsonRpcProvider(rpcUrl)

    const signer = new Wallet(privateKey, provider)
    const contract = new Contract(contractAddress, OmbuArtifact.abi, signer)

    const { feedback, merkleTreeDepth, merkleTreeRoot, nullifier, points } = await req.json()

    try {
        const transaction = await contract.sendFeedback(merkleTreeDepth, merkleTreeRoot, nullifier, feedback, points)

        await transaction.wait()

        return new Response("Success", { status: 200 })
    } catch (error: any) {
        console.error(error)

        return new Response(`Server error: ${error}`, {
            status: 500
        })
    }
}
