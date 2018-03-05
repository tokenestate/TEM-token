'use strict';

const assertRevert = require('./helpers/assertRevert');

var utils = require('./helpers/utils');
var TEMToken = artifacts.require("./TokenEstateMarketplaceToken.sol");

const uri = utils.getUri();


contract('TokenEstateMarketplaceToken', function (accounts) {

  let token;

  beforeEach(async function() {
    token = await TEMToken.new();
  });
  
  it('should prevent non-owners from calling votingObject()', async function() {
    const other = accounts[1];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    try {
      await token.setCompanyURI(uri, {from: other});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error because uri is empty', async function() {
    try {
      await token.setCompanyURI("", {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });
  
  it('should return the correct voting Object URI', async function() {
    await token.setCompanyURI(uri, {from: accounts[0]});
    let companyURI = await token.companyURI();

    assert.equal(companyURI, uri);
  });

  it('should return the correct number of token', async function() {
    const nbTokens = 150000000;
    await token.mint(accounts[1], nbTokens, {from: accounts[0]});
    let balance = await token.balanceOf(accounts[1]);

    assert.equal(balance, nbTokens);
  });

  it('should return error when cap is exceeded', async function() {
    try {
      await token.mint(accounts[1], 150000001, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

});
