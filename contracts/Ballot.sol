pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/token/MintableToken.sol';


/**
 * @title Ballot
 * @dev Voting capacity 
 */
contract Ballot is MintableToken {
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
    Proposal[] public proposals;

	struct VotingObject {
	    string addr;        //Uri of voting object document
	    bytes32 hash;       //Hash of the uri content for checking
	    uint256 startTime;
	    uint256 votingDuration;
	    mapping(address => Voter) voters;
	}
	VotingObject public currentVotingObject;

	event Voted(address addr, uint256 proposal, uint256 votes);

	
	/**
	* @dev Submit a voting Object
	* @param addr Uri of voting object document.
	* @param hash Hash of the uri content.
	* @param votingDuration The duration of the vote.
	* @param proposalsName A liste of proposals.
	*/
	function votingObject(string addr, bytes32 hash, uint votingDuration, bytes32[] proposalsName) onlyOwner public {
        require(!isVotingObjectActive()); // Cannot vote in parallel
        require(hash != bytes32(0)); 
        require(bytes(addr).length > 0);
        require(votingDuration > 0);
        require(proposalsName.length > 0);
        
        for (uint256 i = 0; i < proposalsName.length; i++) {
            proposals.push(Proposal({
                name: proposalsName[i],
                voteCount: 0
            }));
        }
        currentVotingObject = VotingObject(addr, hash, now, votingDuration);
    }

	/**
	* @dev Send your vote
	* @param proposalId The proposal id you vote for.
	*/
	function vote(uint proposalId) public returns (uint256) {
        require(isVoteOngoing());
        require(proposalId < proposals.length);
        Voter storage voter = currentVotingObject.voters[msg.sender];

        uint256 nbVotes = showVotes(msg.sender); 
        require(nbVotes > 0);

        proposals[proposalId].voteCount = proposals[proposalId].voteCount.add(nbVotes);

        voter.hasVoted = true;
        Voted(msg.sender, proposalId, nbVotes);
        return nbVotes;
    }

    /**
	* @dev Returns true if vote is ongoing, false otherwise
	*/
    function isVoteOngoing() public constant returns (bool)  {
        return isVotingObjectActive()
            && now >= currentVotingObject.startTime
            && now < currentVotingObject.startTime.add(currentVotingObject.votingDuration);
        //its safe to use it for longer periods:
        //https://ethereum.stackexchange.com/questions/6795/is-block-timestamp-safe-for-longer-time-periods
    }

    modifier onlyIfVoteIsOngoing() {
    	require(isVoteOngoing());
    	_;
    }

    /**
	* @dev Returns true if a Object is set, false otherwise
	*/
    function isVotingObjectActive() public constant returns (bool)  {
        return currentVotingObject.hash != bytes32(0);
    }

    /**
	* @dev Returns false if the voting phase is ongoing, true otherwise
	* TODO: same as !isVoteOngoing() but more costless. Realy usefull?
	*/
    function isVotingPhaseOver() public constant returns (bool)  {
        //its safe to use it for longer periods:
        //https://ethereum.stackexchange.com/questions/6795/is-block-timestamp-safe-for-longer-time-periods
        return now >= currentVotingObject.startTime.add(currentVotingObject.votingDuration);
    }

    /**
	* @dev Returns the number of votes available for an account
	* @param addr The address to enquire.
	*/
    function showVotes(address addr) public constant returns (uint256) {
        if (isVotingObjectActive()) {
        	Voter memory voter = currentVotingObject.voters[addr];
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
	* @dev The voting can be reseted by the owner of this contract when the voting phase is over.
	*/
    function resetVoting() onlyOwner public {
        require(isVotingObjectActive()); 
        require(isVotingPhaseOver());
        delete proposals;
        delete currentVotingObject;
    }

	/**
	* @dev Initialize the number of votes for an account
	* @param addr The address to initialize.
	* @param balance The number of votes.
	*/
	function initNbVotes(address addr, uint256 balance) onlyIfVoteIsOngoing private;

}