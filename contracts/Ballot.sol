pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import './Whitelist.sol';


/**
 * @title Ballot
 * @dev Voting capacity 
 */
contract Ballot is MintableToken, Whitelist {
	using SafeMath for uint256;

	struct Voter {
        uint256 nbVotes;
        bool isNbVotesInitialized;
        bool hasVoted;
    }

    struct Proposal {
        bytes32 name;   // short name (up to 32 bytes)
        uint256 voteCount; // number of accumulated votes
    }
    mapping(uint256 => Proposal[]) public votingProposals;

	struct VotingObject {
	    string addr;        //Uri of voting object document
	    bytes32 hash;       //Hash of the uri content for checking
	    uint256 startTime;
	    uint256 endTime;
	    mapping(address => Voter) voters;
	}
    VotingObject[] public votingObjects;

	event VotingSubmitted(string addr, bytes32 hash, uint256 startTime, uint256 endTime);
    event Voted(address addr, uint256 proposal, uint256 votes);
    event Log(string log);

	
	/**
	* @dev Submit a voting Object
	* @param _addr Uri of voting object document.
	* @param _hash Hash of the uri content.
	* @param _votingDuration The duration of the vote.
	* @param proposalsName A liste of proposals.
	*/
	function votingObject(string _addr, bytes32 _hash, uint _votingDuration, bytes32[] proposalsName) onlyOwner public {
        require(!isVoteOngoing()); // Cannot vote in parallel
        require(_hash != bytes32(0)); 
        require(bytes(_addr).length > 0);
        require(_votingDuration > 0);
        require(proposalsName.length > 0);

        votingObjects.push(VotingObject({
            addr: _addr,
            hash: _hash,
            startTime: now,
            endTime: now + _votingDuration
        }));

        Proposal[] storage proposals = votingProposals[votingObjects.length-1];
        for (uint256 i = 0; i < proposalsName.length; i++) {
            proposals.push(Proposal({
                name: proposalsName[i],
                voteCount: 0
            }));
        }

        VotingSubmitted(_addr, _hash, now, now + _votingDuration);
    }

	/**
	* @dev Send your vote
	* @param proposalId The proposal id you vote for.
	*/
	function vote(uint proposalId) isWhitelisted(msg.sender) public returns (uint256) {
        require(isVoteOngoing());
        
        uint256 nbVotes = showVotes(msg.sender); 
        require(nbVotes > 0);
        
        Proposal[]  storage proposals = votingProposals[votingObjects.length-1];
        require(proposalId < proposals.length);

        proposals[proposalId].voteCount = proposals[proposalId].voteCount.add(nbVotes);

        Voter storage voter = votingObjects[votingObjects.length-1].voters[msg.sender];
        voter.hasVoted = true;

        Voted(msg.sender, proposalId, nbVotes);
        
        return nbVotes;
    }

    /**
	* @dev Returns true if vote is ongoing, false otherwise
	*/
    function isVoteOngoing() public constant returns (bool)  {
        //its safe to use it for longer periods:
        //https://ethereum.stackexchange.com/questions/6795/is-block-timestamp-safe-for-longer-time-periods
        return !(votingObjects.length == 0
            || now >= votingObjects[votingObjects.length-1].endTime);
    }

    /**
	* @dev Returns the number of votes available for an account
	* @param addr The address to enquire.
	*/
    function showVotes(address addr) public constant returns (uint256) {
        if (isVoteOngoing()) {
        	Voter memory voter = votingObjects[votingObjects.length-1].voters[addr];
        	if (voter.hasVoted) {
        		return 0;
        	}
        	if(voter.isNbVotesInitialized) {        		
            	return voter.nbVotes;
        	}
        }

        return balances[addr];
    }

	/**
	* @dev Initialize the number of votes for an account
	* @param addr The address to initialize.
	* @param balance The number of votes.
	*/
	function initNbVotes(address addr, uint256 balance) internal {
		Voter memory voter = votingObjects[votingObjects.length-1].voters[addr];
		if(!voter.isNbVotesInitialized) {
            Voter storage _voter = votingObjects[votingObjects.length-1].voters[addr];
    		_voter.isNbVotesInitialized = true;
    		_voter.nbVotes = balance;
        }
	}

}