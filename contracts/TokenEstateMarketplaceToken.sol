pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import './Ballot.sol';
import './Payout.sol';

/**
 * @title TokenEstateMarketplaceToken
 * @dev ERC20 Token that can be minted. Add voting and payout capacity
 */
contract TokenEstateMarketplaceToken is MintableToken, Ballot, Payout {
	using SafeMath for uint256;

  	string public constant name = "Token Estate Marketplace";
	string public constant symbol = "TEM";
	uint8 public constant decimals = 18;


	string public companyURI = "https://www.tokenestate.io";

	

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
	* @param to The address to transfer to.
	* @param value The amount to be transferred.
	*/
	function transfer(address to, uint256 value) public returns (bool) {
		uint256 balanceFromB4Transfer = balances[msg.sender];
		uint256 balanceToB4Transfer = balances[to];
		bool transferOk = super.transfer(to, value);
		if (transferOk) {
			if (isVoteOngoing()) {
				initNbVotes(msg.sender, balanceFromB4Transfer);
				initNbVotes(to, balanceToB4Transfer);
			}
			if (hasPayout()) {
				initNbSharesForPayoutIfNeeded(msg.sender, balanceFromB4Transfer);
				initNbSharesForPayoutIfNeeded(to, balanceToB4Transfer);
			}
		}
		return transferOk;
	}

    /**
	* @dev Transfer tokens from one address to another
	* @param from address The address which you want to send tokens from
	* @param to address The address which you want to transfer to
	* @param value uint256 the amount of tokens to be transferred
	*/
	function transferFrom(address from, address to, uint256 value) public returns (bool) {
		uint256 balanceFromB4Transfer = balances[from];
		uint256 balanceToB4Transfer = balances[to];
		bool transferOk = super.transferFrom(from, to, value);
		if (transferOk) {
			if (isVoteOngoing()) {
				initNbVotes(from, balanceFromB4Transfer);
				initNbVotes(to, balanceToB4Transfer);
			}
			if (hasPayout()) {
				initNbSharesForPayoutIfNeeded(from, balanceFromB4Transfer);
				initNbSharesForPayoutIfNeeded(to, balanceToB4Transfer);
			}
		}
		return transferOk;
	}


}