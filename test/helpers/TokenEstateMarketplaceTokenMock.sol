pragma solidity ^0.4.11;


import '../../contracts/TokenEstateMarketplaceToken.sol';


// mock class using TokenEstateMarketplaceToken
contract TokenEstateMarketplaceTokenMock is TokenEstateMarketplaceToken {

  function TokenEstateMarketplaceTokenMock(address initialAccount, uint256 initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
