pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

/**
 * @title TokenEstateMarketplaceToken
 * @dev ERC20 Token that can be minted. Add voting and ...
 */
contract TokenEstateMarketplaceToken is MintableToken {
	using SafeMath for uint256;

  	string public constant name = "Token Estate Marketplace";
	string public constant symbol = "TEM";
	uint8 public constant decimals = 18;

	uint256 public lockedTokens = 25 * 1000 * 1000;

	string public companyURI = "https://www.tokenestate.io";

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

	event Voted(address _addr, uint256 proposal, uint256 votes);

	
	/**
	* @dev Submit a voting Object
	* @param _addr Uri of voting object document.
	* @param _hash Hash of the uri content.
	*/
	function votingObject(string _addr, bytes32 _hash, uint votingDuration, bytes32[] proposalsName) onlyOwner public {
        require(!isVotingObjectActive()); // Cannot vote in parallel
        require(_hash != bytes32(0)); 
        require(bytes(_addr).length > 0);
        require(votingDuration > 0);
        require(proposalsName.length > 0);
        require(mintingFinished);
        
        for (uint256 i = 0; i < proposalsName.length; i++) {
            proposals.push(Proposal({
                name: proposalsName[i],
                voteCount: 0
            }));
        }
        currentVotingObject = VotingObject(_addr, _hash, now, votingDuration);
    }

	/**
	* @dev Send your vote
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
	* @param _addr The address to enquire.
	*/
    function showVotes(address _addr) public constant returns (uint256) {
        if (isVotingObjectActive()) {
        	Voter memory voter = currentVotingObject.voters[_addr];
        	if (voter.hasVoted) {
        		return 0;
        	}
        	if(voter.isNbVotesInitialized) {        		
            	return voter.nbVotes;
        	}
        }
        return balances[_addr];
    }

    /**
	* @dev The voting can be reseted by the owner of this contract
	*/
    function resetVoting() onlyOwner public {
        require(isVotingObjectActive()); 
        require(isVotingPhaseOver());
        delete proposals;
        delete currentVotingObject;
    }

    /**
	* @dev Set the public company URI
	* @param _companyURI The URI address of the company.
	*/
    function setCompanyURI(string _companyURI) onlyOwner public {
    	require(bytes(_companyURI).length > 0); 
    	companyURI = _companyURI;
    }

    /**
	* @dev Transfer token for a specified address
	* @param _to The address to transfer to.
	* @param _value The amount to be transferred.
	*/
	function transfer(address _to, uint256 _value) public returns (bool) {
		uint256 balanceFromB4Transfer = balances[msg.sender];
		uint256 balanceToB4Transfer = balances[_to];
		bool transferOk = super.transfer(_to, _value);
		if (transferOk && isVoteOngoing()) {
			initNbVotes(msg.sender, balanceFromB4Transfer);
			initNbVotes(_to, balanceToB4Transfer);
		}
		return transferOk;
	}

    /**
	* @dev Transfer tokens from one address to another
	* @param _from address The address which you want to send tokens from
	* @param _to address The address which you want to transfer to
	* @param _value uint256 the amount of tokens to be transferred
	*/
	function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
		uint256 balanceFromB4Transfer = balances[_from];
		uint256 balanceToB4Transfer = balances[_to];
		bool transferOk = super.transferFrom(_from, _to, _value);
		if (transferOk && isVoteOngoing()) {
			initNbVotes(_from, balanceFromB4Transfer);
			initNbVotes(_to, balanceToB4Transfer);
		}
		return transferOk;
	}

	/**
	* @dev Initialize the number of votes for an account
	* @param _addr The address to initialize.
	* @param _balance The number of votes.
	*/
	function initNbVotes(address _addr, uint256 _balance) private {
		require(isVoteOngoing());
		Voter storage voter = currentVotingObject.voters[_addr];
		require(!voter.isNbVotesInitialized);
		voter.isNbVotesInitialized = true;
		voter.nbVotes = _balance;
	}

}