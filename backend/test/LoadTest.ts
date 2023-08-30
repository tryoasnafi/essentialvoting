import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { ethers } from "hardhat";
import { EssentialVoting } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Load Testing", function () {
    let contract: EssentialVoting;

    async function deploy() {
        const Contract = await ethers.getContractFactory("EssentialVoting")
        const contract = await Contract.deploy()
        await contract.deployed()
        return contract
    }

    beforeEach(async function () {
        contract = await loadFixture(deploy);
    })

    async function voteBlast(totalVotes: number, voters: SignerWithAddress[]) {
        let votes = [];
        for (let i = 0; i < totalVotes; i++) {
            votes.push(contract.connect(voters[i]).castVote(0, 2));
        }
        return Promise.all(votes);
    }

    async function voteTest(total: number) {
        const voters = await ethers.getSigners();
        const voterList = voters.map((voter) => voter.address);
        const title = "Pemilihan KOMTING RPL 8B";
        const candidates = ["Ali", "Busni", "Cine"];
        const startTime = await time.latest() + 60;
        const endTime = await time.latest() + 3000;

        const startCreate = performance.now();
        await contract.connect(voters[0]).createElection(title, candidates, startTime, endTime, voterList);
        const endCreate = performance.now();
        console.log("\n\tTime to create (ms):", endCreate - startCreate);

        await time.increaseTo(await time.latest() + 61);

        const start = performance.now();
        await voteBlast(total, voters);
        const end = performance.now();
        console.log("\tTime to vote (ms):", end - start);
    }

    describe("Accept The Vote", function () {
        it("Load Test 10", async function () {
            await voteTest(10);
        })
        it("Load Test 20", async function () {
            await voteTest(20);
        })
        it("Load Test 50", async function () {
            await voteTest(50);
        })
        it("Load Test 100", async function () {
            await voteTest(100);
        })
        it("Load Test 200", async function () {
            await voteTest(200);
        })
        it("Load Test 500", async function () {
            await voteTest(500);
        })
    });
});