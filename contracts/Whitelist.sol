pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title Whitelist
 * @dev List of whitelisted users 
 */
contract Whitelist is Ownable {

	mapping(address => bool) public whitelist;

    event LogAddToWhilelist(address indexed sender, address indexed beneficiary);
    event LogRemoveFromWhilelist(address indexed sender, address indexed beneficiary);

    /**
    * @dev Reverts if beneficiary is not whitelisted. Can be used when extending this contract.
    */
    modifier isWhitelisted(address _beneficiary) {
        require(whitelist[_beneficiary]);
        _;
    }

    /**
    * @dev Adds single address to whitelist.
    * @param _beneficiary Address to be added to the whitelist
    */
    function addToWhitelist(address _beneficiary) external onlyOwner {
        require (_beneficiary != 0x0);
        whitelist[_beneficiary] = true;
        LogAddToWhilelist(msg.sender, _beneficiary);
    }

    /**
    * @dev Adds list of addresses to whitelist. Not overloaded due to limitations with truffle testing. 
    * @param _beneficiaries Addresses to be added to the whitelist
    */
    function addManyToWhitelist(address[] _beneficiaries) external onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            this.addToWhitelist(_beneficiaries[i]);
        }
    }

    /**
    * @dev Removes single address from whitelist. 
    * @param _beneficiary Address to be removed to the whitelist
    */
    function removeFromWhitelist(address _beneficiary) external onlyOwner {
        whitelist[_beneficiary] = false;
        LogRemoveFromWhilelist(msg.sender, _beneficiary);
    }

}
