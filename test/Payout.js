'use strict';

const assertJump = require('./helpers/assertJump');
const assertRevert = require('./helpers/assertRevert');
const assertNotAFunction = require('./helpers/assertNotAFunction');

var utils = require('./helpers/utils');
var TEMToken = artifacts.require("./TokenEstateMarketplaceToken.sol");

const uri = utils.getUri();
const hash = utils.getHash();
const oneYear = utils.convertNbDaysToSeconds(365);
const fiveYearsAndTwoDays = utils.convertNbDaysToSeconds(365 * 5 + 2);


contract('Payout', function (accounts) {

  let token;

  beforeEach(async function() {
    token = await TEMToken.new();
  });
  
  it('should return the correct payout Object URI', async function() {
    await utils.initPayoutObject(token, accounts);
    let payoutObject = await token.payoutObjects(0);

    assert.equal(payoutObject[0], uri);
  });

  it('should return the correct payout voting Object hash', async function() {
    await utils.initPayoutObject(token, accounts);
    let payoutObject = await token.payoutObjects(0);

    assert.equal(payoutObject[1].substring(0,hash.length), hash);
  });

  it('should return the correct payout duration', async function() {
    await utils.initPayoutObject(token, accounts);
    let payoutObject = await token.payoutObjects(0);

    assert.equal(payoutObject[3] - payoutObject[2], fiveYearsAndTwoDays);
  });

  it('should return the correct total Wei allocated', async function() {
    const nbTokens = 100;
    const totalWei = 100;
    await token.mint(accounts[0], nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    let payoutObject = await token.payoutObjects(0);

    assert.equal(payoutObject[4], totalWei);
  });

  it('should return the correct number of Wei per token', async function() {
    const nbTokens = 100;
    const totalWei = 100;
    await token.mint(accounts[0], nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    let payoutObject = await token.payoutObjects(0);

    assert.equal(payoutObject[5], totalWei / nbTokens);
  });

  it('should return the correct total Wei payed', async function() {
    await utils.initPayoutObject(token, accounts);
    let payoutObject = await token.payoutObjects(0);

    assert.equal(payoutObject[6], 0);
  });

  it('should prevent non-owners from calling payoutObject()', async function() {
    const other = accounts[1];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    await token.mint(accounts[0], 100, {from: accounts[0]});
    try {
      await token.payoutObject(uri, hash, {value: 100, from: other})
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error because uri is empty', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    try {
      await token.payoutObject("", hash, {value: 100, from: accounts[0]})
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  }); 

  it('should return error because hash is empty', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    try {
      await token.payoutObject(uri, "", {value: 100, from: accounts[0]})
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error because payment amount is zero', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    try {
      await token.payoutObject(uri, hash, {value: 0, from: accounts[0]})
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error when you call nbWeiPerToken() private function', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    try {
      await token.nbWeiPerToken(100, {from: accounts[0]}); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertNotAFunction(error);
    }
  });

  it('should return the correct rounding', async function() {
    const nbTokens = 100;
    const totalWei = 110;
    const _rounding = totalWei % nbTokens;
    await token.mint(accounts[0], nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    let rounding = await token.rounding();

    assert.equal(rounding, _rounding);
  });

  it('should return the correct new rounding with an existing old one', async function() {
    const nbTokens = 100;
    const totalWei = 110;
    const _rounding = totalWei % nbTokens;
    
    const newTokens = 20;
    const newRounding = (totalWei + _rounding) % (nbTokens + newTokens);
    
    await token.mint(accounts[0], nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});

    await token.mint(accounts[0], newTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    
    let rounding = await token.rounding();

    assert.equal(rounding, newRounding);
  });

  it('should return the correct total Wei allocated', async function() {
    const nbTokens = 100;
    const totalWei = 110;
    const rounding = totalWei % nbTokens;
    await token.mint(accounts[0], nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    let payoutObject = await token.payoutObjects(0);

    assert.equal(payoutObject[4], totalWei - rounding);
  });

  it('should return the correct total Wei allocated with an existing rounding', async function() {
    const nbTokens = 100;
    const totalWei = 110;
    const rounding = totalWei % nbTokens;
    
    const newTokens = 20;
    const newRounding = (totalWei + rounding) % (nbTokens + newTokens);
    
    await token.mint(accounts[0], nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});

    await token.mint(accounts[0], newTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    
    let payoutObject = await token.payoutObjects(1);

    assert.equal(payoutObject[4], totalWei + rounding - newRounding);
  });  

  it('should return the payout is not expired', async function() {
    await utils.initPayoutObject(token, accounts);
    let isPayoutExpired = await token.isPayoutExpired(0);

    assert.equal(isPayoutExpired, false);
  });

  it('should return the payout is expired', async function() {
    await utils.initPayoutObject(token, accounts);
    utils.waitNbDays(fiveYearsAndTwoDays);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[1], 1, {from: accounts[9]}); 
    let isPayoutExpired = await token.isPayoutExpired(0);

    assert.equal(isPayoutExpired, true);
  });

  it('should return error when you do payment with fallback function', async function() {
    try {
      await token.send(100); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error when calling initNbSharesForPayoutIfNeeded() internal function', async function() {
    await utils.initPayoutObject(token, accounts);
    try {
      await token.initNbSharesForPayoutIfNeeded(accounts[0], 10, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertNotAFunction(error);
    }
  });

  it('should return error when calling initNbSharesForPayout() internal function', async function() {
    await utils.initPayoutObject(token, accounts);
    try {
      await token.initNbSharesForPayout(accounts[0], 10, 0, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertNotAFunction(error);
    }
  });

  it('should return true as a payout is defined', async function() {
    await utils.initPayoutObject(token, accounts);
    let hasPayout = await token.hasPayout();

    assert.equal(hasPayout, true);
  });

  it('should return false as no payout is defined', async function() {
    let hasPayout = await token.hasPayout();

    assert.equal(hasPayout, false);
  });

  it('should return 100 shares for account 1', async function() {
    await token.mint(accounts[1], 100, {from: accounts[0]});
    await utils.initPayoutObject(token, accounts);
    let nbShares = await token.showNbShares(accounts[1], 0, {from: accounts[0]});

    assert.equal(nbShares, 100);
  });

  it('should return 100 shares for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initPayoutObject(token, accounts);
    await token.approve(accounts[2], 100);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    let nbShares = await token.showNbShares(accounts[0], 0, {from: accounts[0]});

    assert.equal(nbShares, 100);
  });

  it('should return 0 share for account 0', async function() {
    await utils.initPayoutObject(token, accounts);
    let nbShares = await token.showNbShares(accounts[0], 0, {from: accounts[0]});

    assert.equal(nbShares, 0);
  });

  it('should return 0 share for account 1', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initPayoutObject(token, accounts);
    let nbShares = await token.showNbShares(accounts[1], 0, {from: accounts[1]});

    assert.equal(nbShares, 0);
  });

  it('should return 100 shares for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initPayoutObject(token, accounts);
    let nbShares = await token.showNbShares(accounts[0], 0, {from: accounts[1]});

    assert.equal(nbShares, 100);
  });

  it('should return 10 shares for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    await utils.initPayoutObject(token, accounts);
    let nbShares = await token.showNbShares(accounts[0], 0, {from: accounts[0]});

    assert.equal(nbShares, 10);
  });

  it('should return 0 share for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    await utils.initPayoutObject(token, accounts);
    utils.waitNbDays(fiveYearsAndTwoDays);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[1], 1, {from: accounts[9]});
    let nbShares = await token.showNbShares(accounts[0], 0, {from: accounts[0]});

    assert.equal(nbShares, 0);
  });

  it('should return 90 shares for account 1', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    await utils.initPayoutObject(token, accounts);
    let nbShares = await token.showNbShares(accounts[1], 0, {from: accounts[1]});

    assert.equal(nbShares, 90);
  });

  it('should return 100 shares for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initPayoutObject(token, accounts);
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    let nbShares = await token.showNbShares(accounts[0], 0, {from: accounts[0]});

    assert.equal(nbShares, 100);
  });

  it('should return 10 shares for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.approve(accounts[2], 100);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    await utils.initPayoutObject(token, accounts);
    let nbShares = await token.showNbShares(accounts[0], 0, {from: accounts[0]});

    assert.equal(nbShares, 10);
  });

  it('should return 90 shares for account 1', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.approve(accounts[2], 100);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    await utils.initPayoutObject(token, accounts);
    let nbShares = await token.showNbShares(accounts[1], 0, {from: accounts[1]});

    assert.equal(nbShares, 90);
  });

  it('should return 100 shares for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.approve(accounts[2], 100);
    await utils.initPayoutObject(token, accounts);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    let nbShares = await token.showNbShares(accounts[0], 0, {from: accounts[0]});

    assert.equal(nbShares, 100);
  });

  it('should return 10 shares for account 0 and second payout', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.approve(accounts[2], 100);
    await utils.initPayoutObject(token, accounts);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    await utils.initPayoutObject(token, accounts);
    let nbShares = await token.showNbShares(accounts[0], 1, {from: accounts[0]});

    assert.equal(nbShares, 10);
  });

  it('should return 100 shares for account 0 and second payout', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.approve(accounts[2], 100);
    await utils.initPayoutObject(token, accounts);
    await utils.initPayoutObject(token, accounts);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    let nbShares = await token.showNbShares(accounts[0], 1, {from: accounts[0]});

    assert.equal(nbShares, 100);
  });

  it('should return error when claiming payout without payout available', async function() {
    try {
      await token.claimPayout(0, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error when claiming payout for an expired payout', async function() {
    await utils.initPayoutObject(token, accounts);
    utils.waitNbDays(fiveYearsAndTwoDays);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[1], 1, {from: accounts[9]}); 
    try {
      await token.claimPayout(0, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error when claiming payout with 0 share', async function() {
    await utils.initPayoutObject(token, accounts);
    try {
      await token.claimPayout(0, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error when claiming two times same payout', async function() {
    const nbTokens = 100;
    const totalWei = 100;
    await token.mint(accounts[0], nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    await token.claimPayout(0, {from: accounts[0]});
    try {
      let payoutAmount = await token.claimPayout(0, {from: accounts[0]});
    } catch(error) {
      assertRevert(error);
    }
  });  

  it('should return the correct payout amount', async function() {
    const nbTokens = 100;
    const totalWei = 10  * 1e18;
    let payee = accounts[1];
    let initialBalance = web3.eth.getBalance(payee);
    await token.mint(payee, nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    
    await token.claimPayout(0, {from: payee});
    let balance = web3.eth.getBalance(payee);
    assert(Math.abs(balance - initialBalance - totalWei) < 1e16);
  });

  it('should return the correct payout amount for one of multiple accounts', async function() {
    const nbTokens = 100;
    const totalWei = 10  * 1e18;
    let payee = accounts[1];
    let initialBalance = web3.eth.getBalance(payee);
    await token.mint(payee, nbTokens/2, {from: accounts[0]});
    await token.mint(accounts[2], nbTokens/2, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    
    await token.claimPayout(0, {from: payee});
    let balance = web3.eth.getBalance(payee);
    assert(Math.abs(balance - initialBalance - totalWei/2) < 1e16);
  });

  it('should return the correct payout amount for 2nd payout', async function() {
    const nbTokens = 100;
    const totalWei1stPayout = 10;
    const totalWei2ndPayout = 10  * 1e18;
    let payee = accounts[1];
    let initialBalance = web3.eth.getBalance(payee);
    await token.mint(payee, nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei1stPayout, from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei2ndPayout, from: accounts[0]});
    
    await token.claimPayout(1, {from: payee});
    let balance = web3.eth.getBalance(payee);
    assert(Math.abs(balance - initialBalance - totalWei2ndPayout) < 1e16);
  });  

  it('should return 0 shares for account 1 because tokens have been allocated after initPayoutObject()', async function() {
    await utils.initPayoutObject(token, accounts);
    await token.mint(accounts[1], 100, {from: accounts[0]});
    let nbShares = await token.showNbShares(accounts[1], 0, {from: accounts[0]});

    assert.equal(nbShares, 0);
  });

  it('should prevent non-owners from calling withdrawExpiredPayout()', async function() {
    const other = accounts[1];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    try {
      await token.withdrawExpiredPayout(0, {from: other})
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error when withdraw expired payout without payout available', async function() {
    try {
      await token.withdrawExpiredPayout(0, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error when withdraw expired payout for a not expired payout', async function() {
    await utils.initPayoutObject(token, accounts);
    try {
      await token.withdrawExpiredPayout(0, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error when amount to withdraw = 0', async function() {
    const nbTokens = 100;
    const totalWei = 100;
    await token.mint(accounts[0], nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    await token.claimPayout(0, {from: accounts[0]});
    try {
      await token.withdrawExpiredPayout(0, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return the correct withdraw amount', async function() {
    const nbTokens = 100;
    const totalWei = 10  * 1e18;
    let payee = accounts[0];
    await token.mint(payee, nbTokens, {from: accounts[0]});
    await token.payoutObject(uri, hash, {value: totalWei, from: accounts[0]});
    utils.waitNbDays(fiveYearsAndTwoDays);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    let initialBalance = web3.eth.getBalance(payee);
    await token.withdrawExpiredPayout(0, {from: payee});
    let balance = web3.eth.getBalance(payee);
    assert(Math.abs(balance - initialBalance - totalWei) < 1e16);
  });
  
  
});
