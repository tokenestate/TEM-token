// Forked from:
// https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/crowdsale/WhitelistedCrowdsale.test.js

'use strict';

const BigNumber = web3.BigNumber
const assertRevert = require('./helpers/assertRevert');
//const expectThrow = require('./helpers/expectThrow');
var StandardTokenMock = artifacts.require('./helpers/TokenEstateMarketplaceTokenMock.sol');

contract('Whitelist', function(accounts) {

  let token;

  beforeEach(async function() {
    token = await StandardTokenMock.new(accounts[0], 100);
  });

  it('should add the address to the whitelist', async function() {
    await token.addToWhitelist(accounts[1], {from: accounts[0]});
    let isWhitelisted = await token.whitelist(accounts[1]);
    assert.isTrue(isWhitelisted);
  });

  it('should add multiple address to the whitelist', async function() {
    await token.addManyToWhitelist([accounts[1], accounts[2]], {from: accounts[0]});
    let isWhitelisted = await token.whitelist(accounts[1]);
    assert.isTrue(isWhitelisted);
    let is2ndWhitelisted = await token.whitelist(accounts[2]);
    assert.isTrue(is2ndWhitelisted);
  });  

  it('should remove the address from the whitelist', async function() {
    await token.addToWhitelist(accounts[1], {from: accounts[0]});
    let isWhitelisted = await token.whitelist(accounts[1]);
    assert.isTrue(isWhitelisted);

    await token.removeFromWhitelist(accounts[1], {from: accounts[0]});
    let is2ndWhitelisted = await token.whitelist(accounts[1]);
    assert.isFalse(is2ndWhitelisted);
  });

  it('should remove the address from the whitelist', async function() {
    await token.removeFromWhitelist(accounts[1], {from: accounts[0]});
    let isWhitelisted = await token.whitelist(accounts[1]);
    assert.isFalse(isWhitelisted);
  });

  it('should prevent non-owners from calling addToWhitelist()', async function() {
    const other = accounts[1];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    try {
      await token.addToWhitelist(accounts[1], {from: other})
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should prevent non-owners from calling addManyToWhitelist()', async function() {
    const other = accounts[1];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    try {
      await token.addManyToWhitelist([accounts[1], accounts[2]], {from: other})
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });  

it('should prevent non-owners from calling removeFromWhitelist()', async function() {
    const other = accounts[1];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    try {
      await token.removeFromWhitelist(accounts[1], {from: other})
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });
  
});
