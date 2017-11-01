pragma solidity ^0.4.11;


import '../../contracts/TokenEstatePlatformToken.sol';


// mock class using TokenEstatePlatformToken
contract TokenEstatePlatformTokenMock is TokenEstatePlatformToken {

  function TokenEstatePlatformTokenMock(address initialAccount, uint256 initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
