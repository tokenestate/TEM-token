pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import './Ballot.sol';
import './Payout.sol';
import './Whitelist.sol';

/**
 * @title TokenEstateMarketplaceToken
 * @dev ERC20 Token that can be minted. Add a total supply limit (hard cap), voting and payout capacity
 */
contract TokenEstateMarketplaceToken is MintableToken, Whitelist, Ballot, Payout {
	using SafeMath for uint256;

  	string public constant name = "Token Estate Marketplace";
	string public constant symbol = "TEM";
	uint8 public constant decimals = 4;


	string public companyURI = "https://www.tokenestate.io";

	uint256 public cap = 150000000;

	

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
			saveBalanceB4Transfer(msg.sender, balanceFromB4Transfer, to, balanceToB4Transfer);
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
			saveBalanceB4Transfer(from, balanceFromB4Transfer, to, balanceToB4Transfer);
		}
		return transferOk;
	}

	/**
	* @dev Save balance before a transfer
	* @param from address The address which you want to send tokens from
	* @param balanceFromB4Transfer uint256 the amount of tokens of address from before transfer
	* @param to address The address which you want to transfer to
	* @param balanceToB4Transfer uint256 the amount of tokens of address to before transfer
	*/
	function saveBalanceB4Transfer(address from, uint256 balanceFromB4Transfer, address to, uint256 balanceToB4Transfer) private {
		if (isVoteOngoing()) {
			initNbVotes(from, balanceFromB4Transfer);
			initNbVotes(to, balanceToB4Transfer);
		}
		if (hasPayout()) {
			initNbSharesForPayoutIfNeeded(from, balanceFromB4Transfer);
			initNbSharesForPayoutIfNeeded(to, balanceToB4Transfer);
		}
	}

	/**
	* @dev Function to mint tokens
	* @param to The address that will receive the minted tokens.
	* @param amount The amount of tokens to mint.
	* @return A boolean that indicates if the operation was successful.
	*/
	function mint(address to, uint256 amount) onlyOwner canMint isWhitelisted(to) public returns (bool) {
		require(totalSupply_.add(amount) <= cap);
		uint256 balanceToB4Mint = balances[to];
		bool mintOk = super.mint(to, amount);
		if (mintOk) {
			if (isVoteOngoing()) {
				initNbVotes(to, balanceToB4Mint);
			}
			if (hasPayout()) {
				initNbSharesForPayoutIfNeeded(to, balanceToB4Mint);
			}
		}
		return mintOk;
	}

}