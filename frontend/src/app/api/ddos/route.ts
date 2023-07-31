import { PROVIDER, generateWallets, getContract } from "@/lib/contract"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
    const TEST_TOTAL = 160;
    const contract = getContract(await PROVIDER.getSigner());
    const data = await contract.getElectionByIndex(0);
    console.log(data);
    
    const title = "Pemilihan KOMTING RPL 8B";
    const candidates = ["Ali", "Busni", "Cine"];
    const randomWalletVoter = generateWallets(TEST_TOTAL);
    const addresses = randomWalletVoter.map((w) => w.address);
    const currentTime = performance.timeOrigin + performance.now();
    for (let i = 0; i < TEST_TOTAL; i++) {
        const now = Math.floor(Date.now() / 1000) + ((i + 1) * 1000);
        await contract.createElection(
            title,
            candidates,
            now,
            now + (60 * 1000),
            addresses
        );
    }
    const finishTime = performance.timeOrigin + performance.now();
    return NextResponse.json(finishTime - currentTime);
}