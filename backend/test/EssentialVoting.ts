import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

describe("EssentialVoting", function () {
    async function deploy() {
        const Contract = await ethers.getContractFactory("EssentialVoting")
        const contract = await Contract.deploy()
        await contract.deployed()
        const [_, voter1, voter2] = await ethers.getSigners();
        return { contract, voter1, voter2 }
    }

    describe("Creating an election", function() {
        it("should create an election", async function() {
            const { contract, voter1 } = await loadFixture(deploy);
            const title = "Pemilihan KOMTING RPL 8B";
            const candidates = ["Ali", "Busni", "Cine"];
            const startTime = await time.latest() + 60; // 60 seconds
            const endTime = await time.latest() + 300;
            
            await contract.createElection(title, candidates, startTime, endTime, [ voter1.address ]);
            
            expect(await contract.getElectionByIndex(0)).to.deep.eq([
                title,
                candidates,
                BigNumber.from(startTime),
                BigNumber.from(endTime)
            ]) 
        })
        it("should revert if the election has less than 2 candidates", async function() {
            const { contract, voter1 } = await loadFixture(deploy);
            const title = "Pemilihan KOMTING RPL 8B";
            const candidates = ["Ali"];
            const startTime = await time.latest() + 60; // 60 seconds
            const endTime = await time.latest() + 300;

            await expect(contract.createElection(title, candidates, startTime, endTime, [ voter1.address ]))
                    .to.be.revertedWith("must have at least 2 candidates")
        })
        it("should revert if the start time is less than the current time", async function() {
            const { contract, voter1 } = await loadFixture(deploy);
            const title = "Pemilihan KOMTING RPL 8B";
            const candidates = ["Ali", "Busni", "Cine"];
            const startTime = await time.latest() - 60; // 60 seconds
            const endTime = await time.latest() + 300;

            await expect(contract.createElection(title, candidates, startTime, endTime, [ voter1.address ])).to.be.revertedWith("start time must be in the future")
            
        })
        it("should revert if the end time is less than or equal to the start time", async function() {
            const { contract, voter1 } = await loadFixture(deploy);
            const title = "Pemilihan KOMTING RPL 8B";
            const candidates = ["Ali", "Busni", "Cine"];
            const startTime = await time.latest() + 60; // 60 seconds

            await expect(contract.createElection(title, candidates, startTime, startTime, [ voter1.address ])).to.be.revertedWith("end time must be after start time")
            await expect(contract.createElection(title, candidates, startTime, startTime - 1, [ voter1.address ])).to.be.revertedWith("end time must be after start time")
        })
    });

    describe("Casting a vote", function() {
        it("should accept the vote", async function() {
            const { contract } = await loadFixture(deploy);
            const [_, voter1] = await ethers.getSigners();
            const title = "Pemilihan KOMTING RPL 8B";
            const candidates = ["Ali", "Busni", "Cine"];
            const startTime = await time.latest() + 60; // 60 seconds
            const endTime = await time.latest() + 300;
            const votersAddress = [ voter1.address ];
            await contract.connect(voter1).createElection(title, candidates, startTime, endTime, votersAddress);
            await time.increaseTo(await time.latest() + 61);
            await contract.connect(voter1).castVote(0, 2);
            
            expect(await contract.hasVoted(0, voter1.address)).to.eq(true);
            expect(await contract.getTally(0, 2)).to.eq(1);
        })
        it("should revert if the voter not eligible", async function() {
            const { contract, voter1, voter2 } = await loadFixture(deploy);
            const title = "Pemilihan KOMTING RPL 8B";
            const candidates = ["Ali", "Busni", "Cine"];
            const startTime = await time.latest() + 60; // 60 seconds
            const endTime = await time.latest() + 300;

            await contract.createElection(title, candidates, startTime, endTime, [voter1.address]);
            await time.increaseTo(await time.latest() + 61);

            await expect(contract.connect(voter2).castVote(0, 2)).to.be.revertedWith("voter not eligible")
        })
        it("should revert if voter already voted", async function () {
            const { contract } = await loadFixture(deploy);
            const [_, voter1] = await ethers.getSigners();
            const title = "Pemilihan KOMTING RPL 8B";
            const candidates = ["Ali", "Busni", "Cine"];
            const startTime = await time.latest() + 60; // 60 seconds
            const endTime = await time.latest() + 300;
            const votersAddress = [ voter1.address ];
            await contract.connect(voter1).createElection(title, candidates, startTime, endTime, votersAddress);
            await time.increaseTo(await time.latest() + 61);
            await contract.connect(voter1).castVote(0, 2);
            
            await expect(contract.connect(voter1).castVote(0, 2)).to.be.revertedWith("voter has already voted")
        })
        it("should revert if the vote cast after the end time", async function () {
            const { contract } = await loadFixture(deploy);
            const [_, voter1] = await ethers.getSigners();
            const title = "Pemilihan KOMTING RPL 8B";
            const candidates = ["Ali", "Busni", "Cine"];
            const startTime = await time.latest() + 60; // 60 seconds
            const endTime = await time.latest() + 300;
            const votersAddress = [ voter1.address ];
            await contract.connect(voter1).createElection(title, candidates, startTime, endTime, votersAddress);
            await time.increaseTo(await time.latest() + 301);
            
            await expect(contract.connect(voter1).castVote(0, 2)).to.be.revertedWith("vote cast after the end time")
        })
    });
});