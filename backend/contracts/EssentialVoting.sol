// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract EssentialVoting {
    uint256 public counter = 0;

    struct Election {
        string title;
        string[] candidates;
        uint256 startTime;
        uint256 endTime;
        address[] votersAddress;
    }

    mapping(uint256 => Election) private _elections;
    mapping(uint256 => mapping(uint256 => uint256)) private _tally;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public eligibleVoter;

    event NewElection(
        string title,
        string[] candidates,
        uint256 startTime,
        uint256 endTime,
        uint256 timestamp
    );

    event CastVote(
        address voter,
        uint256 electionIndex,
        uint256 candidateId,
        uint256 timestamp
    );

    function createElection(
        string memory title,
        string[] memory candidates,
        uint256 startTime,
        uint256 endTime,
        address[] memory votersAddress
    ) external {
        require(candidates.length >= 2, "must have at least 2 candidates");
        require(
            startTime >= block.timestamp,
            "start time must be in the future"
        );
        require(endTime > startTime, "end time must be after start time");
        _elections[counter] = Election(
            title,
            candidates,
            startTime,
            endTime,
            votersAddress
        );
        for (uint256 i = 0; i < votersAddress.length; i++) {
            eligibleVoter[counter][votersAddress[i]] = true;
            _elections[counter].votersAddress[i] = votersAddress[i];
        }
        counter++;

        emit NewElection(title, candidates, startTime, endTime, block.timestamp);
    }

    function getElectionByIndex(
        uint256 index
    ) external view returns (Election memory election) {
        return _elections[index];
    }

    function castVote(uint256 index, uint256 candidateId) external {
        require(eligibleVoter[index][msg.sender], "voter not eligible");
        require(!hasVoted[index][msg.sender], "voter has already voted");
        // console.log(_elections[index].startTime, _elections[index].endTime, block.timestamp);
        require(
            (block.timestamp >= _elections[index].startTime) && (block.timestamp <= _elections[index].endTime),
            "vote cast not during election time"
        );
        _tally[index][candidateId]++;
        hasVoted[index][msg.sender] = true;

        emit CastVote(msg.sender, index, candidateId, block.timestamp);
    }

    function getTally(
        uint256 index,
        uint256 candidateId
    ) external view returns (uint256) {
        // console.log(_elections[index].startTime, _elections[index].endTime, block.timestamp);
        // tally only available after the end time of election
        // require(
        //     block.timestamp >= _elections[index].endTime,
        //     "the tally before the end time"
        // );
        return _tally[index][candidateId];
    }
}
