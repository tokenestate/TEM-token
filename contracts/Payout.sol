pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/token/MintableToken.sol';


/**
 * @title Payout
 * @dev Payout capacity: eth sent to this contract (by Tokenestate) will be distributed to their token holders 
 */
contract Payout is MintableToken {

	using SafeMath for uint256;

	// Not every year equals 365 days, because of leap year, and not even every day has 24 hours, because of leap seconds
	// We don't need strong precision here because we want the token holders should claim his
	// payout during min 5 years.
	uint256 distributionTimeout = 5 years + 2 days;

	//Payout not accounted yet to make system rounding error proof
	uint256 public rounding = 0;

	struct Beneficiary {
        uint256 nbTokens;
        bool isNbSharesInitialized;
        bool hasClaimed;
    }

	struct PayoutObject {
		string addr;        //Uri of payout document
	    bytes32 hash;       //Hash of the uri content for checking
	    uint256 startTime;
	    uint256 endTime;
	    uint256 totalWei;
	    uint256 nbWeiPerToken;
	    uint256 totalWeiPayed;
	    mapping(address => Beneficiary) beneficiaries;
	}
	PayoutObject[] public payoutObjects;


	/**
	* @dev Submit a payout Object
	* @param _addr Uri of payout document.
	* @param _hash Hash of the uri content.
	*/
	function payoutObject(string _addr, bytes32 _hash) onlyOwner public payable {
        //require(!shouldRemovePayoutObject(0)); // Remove expired payout first
        require(_hash != bytes32(0)); 
        require(bytes(_addr).length > 0);
        require(msg.value > 0);
        
        uint256 _totalWei = msg.value;
        uint256 _nbWeiPerToken = nbWeiPerToken(_totalWei);
        _totalWei = _nbWeiPerToken.mul(totalSupply); // After rounding

        payoutObjects.push(PayoutObject({
        	addr: _addr,
        	hash: _hash,
        	startTime: now,
        	endTime: now.add(distributionTimeout),
        	totalWei: _totalWei,
        	nbWeiPerToken: _nbWeiPerToken,
        	totalWeiPayed: 0
        }));
    }

    /**
	* @dev Returns the number of Wei available per token and update rounding accordingly
	* @param valueWei Number of Wei available for all tokens.
	*/
	// TODO: separate concerns and improve method name
    function nbWeiPerToken(uint256 valueWei) internal returns (uint256) {
        uint256 totalWei = valueWei.add(rounding); // add old rounding
        rounding = totalWei % totalSupply; // ensure no rounding error
        return totalWei.sub(rounding).div(totalSupply); // weiPerToken
    }

    /**
	* @dev Returns true if the payout has expired
	* @param payoutId Id of payout to check.
	*/
    function isPayoutExpired(uint8 payoutId) onlyOwner public view returns (bool) {
    	return payoutObjects[payoutId].endTime < now;
    }

	/**
	* @dev No payment to the contract should be possible with fallback method
	*/
	function() public payable {
        revert();
    }

	/**
	* @dev Initialize the number of shares for payout for a beneficiary if needed
	* @param addr The address to initialize.
	* @param balance The number of shares.
	*/
	function initNbSharesForPayoutIfNeeded(address addr, uint256 balance) internal {
		for (uint8 payoutId = 0; payoutId < payoutObjects.length; payoutId++) {
			Beneficiary memory beneficiary = payoutObjects[payoutId].beneficiaries[addr];
			if(!beneficiary.isNbSharesInitialized) {
				initNbSharesForPayout(addr, balance, payoutId);
			}
		}
	}    

    /**
	* @dev Initialize the number of shares for payout for a beneficiary
	* @param addr The address to initialize.
	* @param balance The number of shares.
	* @param payoutId Id of payout to update.
	*/
	function initNbSharesForPayout(address addr, uint256 balance, uint8 payoutId) internal {
		Beneficiary storage beneficiary = payoutObjects[payoutId].beneficiaries[addr];
		beneficiary.isNbSharesInitialized = true;
		beneficiary.nbTokens = balance;
	}

	/**
	* @dev Returns false if no payout Object, true otherwise
	*/
	function hasPayout() public view returns (bool) {
		return payoutObjects.length > 0;
	}

	/**
	* @dev Returns the number of shares available for an account
	* @param addr The address to enquire.
	* @param payoutId Id of payout to update.
	*/
    function showNbShares(address addr, uint8 payoutId) public constant returns (uint256) {
        PayoutObject memory payout = payoutObjects[payoutId];
        if (now < payout.endTime) {
        	Beneficiary memory beneficiary = payoutObjects[payoutId].beneficiaries[addr];
        	if (beneficiary.hasClaimed) {
        		return 0;
        	}
        	if(beneficiary.isNbSharesInitialized) {        		
            	return beneficiary.nbTokens;
        	}
        	return balances[addr];
        }
        return 0;
    }


}