'use strict';

const assertJump = require('./helpers/assertJump');
const assertRevert = require('./helpers/assertRevert');
const assertNotAFunction = require('./helpers/assertNotAFunction');

var utils = require('./helpers/utils');
var TEMToken = artifacts.require("./TokenEstateMarketplaceToken.sol");

const uri = utils.getUri();
const hash = utils.getHash();
const oneYear = utils.convertNbDaysToSeconds(365);
const fiveYearsAndOneDay = utils.convertNbDaysToSeconds(365 * 5 + 1);


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

    assert.equal(payoutObject[3] - payoutObject[2], fiveYearsAndOneDay);
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

  it('should prevent non-owners from calling isPayoutExpired()', async function() {
    const other = accounts[1];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    await utils.initPayoutObject(token, accounts);
    try {
      await token.isPayoutExpired(0, {from: other});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return the payout is not expired', async function() {
    await utils.initPayoutObject(token, accounts);
    let isPayoutExpired = await token.isPayoutExpired(0);

    assert.equal(isPayoutExpired, false);
  });

  it('should return the payout is not expired', async function() {
    await utils.initPayoutObject(token, accounts);
    let isPayoutExpired = await token.isPayoutExpired(0);

    assert.equal(isPayoutExpired, false);
  });

  it('should return the payout is expired', async function() {
    await utils.initPayoutObject(token, accounts);
    utils.waitNbDays(fiveYearsAndOneDay);
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
    utils.waitNbDays(fiveYearsAndOneDay);
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
  
});
