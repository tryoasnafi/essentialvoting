import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { EssentialVoting } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("EssentialVoting", function () {
    let contract: EssentialVoting;
    let voter1: SignerWithAddress;
    let voter2: SignerWithAddress;

    const title = "Pemilihan KOMTING RPL 8B";
    const candidates = ["Ali", "Busni", "Cine"];
    let startTime: number;
    let endTime: number;

    async function deploy() {
        const Contract = await ethers.getContractFactory("EssentialVoting")
        const contract = await Contract.deploy()
        await contract.deployed()
        const [_, voter1, voter2] = await ethers.getSigners();
        return { contract, voter1, voter2 }
    }

    beforeEach(async function () {
        const { contract: c, voter1: v1, voter2: v2 } = await loadFixture(deploy);
        contract = c
        voter1 = v1
        voter2 = v2

        startTime = await time.latest() + 60;
        endTime = await time.latest() + 300;
    })

    describe("Creating an election", function () {
        it("should create an election", async function () {
            await contract.createElection(title, candidates, startTime, endTime, [voter1.address]);

            expect(await contract.getElectionByIndex(0)).to.deep.eq([
                title,
                candidates,
                BigNumber.from(startTime),
                BigNumber.from(endTime),
                [voter1.address]
            ])
        })
        it("should revert if the election has less than 2 candidates", async function () {
            await expect(contract.createElection(title, [candidates[0]], startTime, endTime, [voter1.address]))
                .to.be.revertedWith("must have at least 2 candidates")
        })
        it("should revert if the start time is less than the current time", async function () {
            await expect(contract.createElection(title, candidates, startTime - 60, endTime + 300, [voter1.address])).to.be.revertedWith("start time must be in the future")

        })
        it("should revert if the end time is less than or equal to the start time", async function () {
            startTime += 60;

            await expect(contract.createElection(title, candidates, startTime, startTime, [voter1.address])).to.be.revertedWith("end time must be after start time")
            await expect(contract.createElection(title, candidates, startTime, startTime - 1, [voter1.address])).to.be.revertedWith("end time must be after start time")
        })
    });

    describe("Casting a vote", function () {
        it("should accept the vote", async function () {
            await contract.connect(voter1).createElection(title, candidates, startTime, endTime, [voter1.address]);
            await time.increaseTo(await time.latest() + 61);
            await contract.connect(voter1).castVote(0, 2);
            // expect(await contract.hasVoted(0, voter1.address)).to.eq(true);
        })
        it("should revert if the voter not eligible", async function () {
            await contract.createElection(title, candidates, startTime, endTime, [voter1.address]);
            await time.increaseTo(await time.latest() + 61);
            await expect(contract.connect(voter2).castVote(0, 2)).to.be.revertedWith("voter not eligible")
        })
        it("should revert if voter already voted", async function () {
            await contract.connect(voter1).createElection(title, candidates, startTime, endTime, [voter1.address]);
            await time.increaseTo(await time.latest() + 61);
            await contract.connect(voter1).castVote(0, 2);
            await expect(contract.connect(voter1).castVote(0, 2)).to.be.revertedWith("voter has already voted")
        })
        it("should revert if the vote cast after the end time", async function () {
            await contract.connect(voter1).createElection(title, candidates, startTime, endTime, [voter1.address]);
            await time.increaseTo(await time.latest() + 301);
            await expect(contract.connect(voter1).castVote(0, 2)).to.be.revertedWith("vote cast after the end time")
        })
    });

    describe("Tallying the votes", function () {
        it("should tally the votes", async function () {
            await contract.connect(voter1).createElection(title, candidates, startTime, endTime, [voter1.address]);
            await time.increaseTo(await time.latest() + 61);
            await contract.connect(voter1).castVote(0, 2);
        })
        xit("should revert if the tally before the end time", async function () {
            await contract.connect(voter1).createElection(title, candidates, startTime, endTime, [voter1.address]);
            await time.increaseTo(await time.latest() + 150);
            await contract.connect(voter1).castVote(0, 2);
            await time.increaseTo(await time.latest() + 100);
            await expect(contract.getTally(0, 2)).to.be.revertedWith("tally before the end time")
        })
    })
});