// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

import "hardhat/console.sol";

contract EssentialVoting {
    uint256 public counter = 0;

    struct Election {
        string title;
        string[] candidates;
        uint256 startTime;
        uint256 endTime;
    }

    mapping (uint256 => Election) private _elections;
    mapping (uint256 => mapping(uint256 => uint256)) private _tally;
    mapping (uint256 => mapping(address => bool)) public hasVoted;
    mapping (uint256 => mapping(address => bool)) public eligibleVoter;

    function createElection(
        string memory title,
        string[] memory candidates,
        uint256 startTime,
        uint256 endTime,
        address[] memory votersAddress
    ) external {
        require(candidates.length >= 2, "must have at least 2 candidates");
        require(startTime > block.timestamp, "start time must be in the future");
        require(endTime > startTime, "end time must be after start time");
        _elections[counter] = Election(title, candidates, startTime, endTime);
        for (uint256 i = 0; i < votersAddress.length; i++) {
            eligibleVoter[counter][votersAddress[i]] = true;
        }
        counter++;
    }

    function getElectionByIndex(
        uint256 index
    ) external view returns (Election memory election) {
        return _elections[index];
    }

    function castVote(uint256 index, uint256 candidateId) external {
        console.log("address %s is in eligible voters: %s", msg.sender, eligibleVoter[index][msg.sender]);
        console.log("hasVoted: %s", hasVoted[index][msg.sender]);
        require(eligibleVoter[index][msg.sender], "voter not eligible");
        require(!hasVoted[index][msg.sender], "voter has already voted");
        require(block.timestamp < _elections[index].endTime, "vote cast after the end time");
        _tally[index][candidateId]++;
        hasVoted[index][msg.sender] = true;
    }

    function getTally(uint256 index, uint256 candidateId) external view returns (uint256) {
        return _tally[index][candidateId];
    } 
}
