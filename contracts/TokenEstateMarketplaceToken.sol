pragma solidity ^0.4.11;

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

	struct VotingProposal {
	    string addr;        //Uri of voting object document
	    bytes32 hash;       //Hash of the uri content for checking
	    uint256 startTime;
	    uint256 yay;
	    uint256 nay;
	    mapping(address => Voter) voters;
	}
	VotingProposal public currentVotingProposal;
	
	uint256 public constant votingDuration = 2 weeks; //TODO Proposal struct

	event Voted(address _addr, bool option, uint256 votes);

	
	/**
	* @dev Submit a voting proposal
	* @param _addr Uri of voting object document.
	* @param _hash Hash of the uri content.
	*/
	function votingProposal(string _addr, bytes32 _hash) onlyOwner public {
        require(!isProposalActive()); // Cannot vote in parallel
        require(_hash != bytes32(0)); 
        require(bytes(_addr).length > 0);
        require(mintingFinished);

        currentVotingProposal = VotingProposal(_addr, _hash, now, 0, 0);

    }

	/**
	* @dev Send your vote
	*/
	function vote(bool _vote) public returns (uint256) {
        require(isVoteOngoing());
        Voter storage voter = currentVotingProposal.voters[msg.sender];

        uint256 nbVotes = showVotes(msg.sender); 
        require(nbVotes > 0);

        if(_vote) {
            currentVotingProposal.yay = currentVotingProposal.yay.add(nbVotes);
        }
        else {
            currentVotingProposal.nay = currentVotingProposal.nay.add(nbVotes);
        }

        voter.hasVoted = true;
        Voted(msg.sender, _vote, nbVotes);
        return nbVotes;
    }

    /**
	* @dev Returns true if vote is ongoing, false otherwise
	*/
    function isVoteOngoing() public constant returns (bool)  {
        return isProposalActive()
            && now >= currentVotingProposal.startTime
            && now < currentVotingProposal.startTime.add(votingDuration);
        //its safe to use it for longer periods:
        //https://ethereum.stackexchange.com/questions/6795/is-block-timestamp-safe-for-longer-time-periods
    }

    /**
	* @dev Returns true if a proposal is set, false otherwise
	*/
    function isProposalActive() public constant returns (bool)  {
        return currentVotingProposal.hash != bytes32(0);
    }

    /**
	* @dev Returns false if the voting phase is ongoing, true otherwise
	* TODO: same as !isVoteOngoing() but more costless. Realy usefull?
	*/
    function isVotingPhaseOver() public constant returns (bool)  {
        //its safe to use it for longer periods:
        //https://ethereum.stackexchange.com/questions/6795/is-block-timestamp-safe-for-longer-time-periods
        return now >= currentVotingProposal.startTime.add(votingDuration);
    }

    /**
	* @dev Returns the number of votes available for an account
	* @param _addr The address to enquire.
	*/
    function showVotes(address _addr) public constant returns (uint256) {
        if (isProposalActive()) {
        	Voter memory voter = currentVotingProposal.voters[_addr];
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
	* @dev The voting can be claimed by the owner of this contract
	*/
    function claimVotingProposal() onlyOwner public {
        require(isProposalActive()); 
        require(isVotingPhaseOver());

        delete currentVotingProposal;
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
		Voter storage voter = currentVotingProposal.voters[_addr];
		require(!voter.isNbVotesInitialized);
		voter.isNbVotesInitialized = true;
		voter.nbVotes = _balance;
	}

}