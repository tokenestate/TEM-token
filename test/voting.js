'use strict';

const assertJump = require('./helpers/assertJump');
var utils = require('./helpers/utils');
var TEMToken = artifacts.require("./TokenEstateMarketplaceToken.sol");


contract('TokenEstateMarketplaceToken', function (accounts) {

  let token;

  beforeEach(async function() {
    token = await TEMToken.new();
  });

  it('should return false as vote is not ongoing', async function() {
    let isVoteOngoing = await token.isVoteOngoing({from: accounts[0]});

    assert.equal(isVoteOngoing, false);
  });

  it('should return true as vote is ongoing', async function() {
    await utils.initVotingProposal(token, accounts);
    let isVoteOngoing = await token.isVoteOngoing({from: accounts[0]});

    assert.equal(isVoteOngoing, true);
  });

  it('should return true as vote is still ongoing', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingProposal(token, accounts);
    utils.waitNbDays(13);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    let isVoteOngoing = await token.isVoteOngoing({from: accounts[0]});

    assert.equal(isVoteOngoing, true);
  });

  it('should return false as vote is not ongoing', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingProposal(token, accounts);
    await utils.waitNbDays(14);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    let isVoteOngoing = await token.isVoteOngoing({from: accounts[0]});

    assert.equal(isVoteOngoing, false);
  });

  it('should return false as vote is not ongoing', async function() {
    let isProposalActive = await token.isProposalActive({from: accounts[0]});

    assert.equal(isProposalActive, false);
  });

  it('should return true as vote is ongoing', async function() {
    await utils.initVotingProposal(token, accounts);
    let isProposalActive = await token.isProposalActive({from: accounts[0]});

    assert.equal(isProposalActive, true);
  });

  it('should return true as voting pahse is over', async function() {
    let isVotingPhaseOver = await token.isVotingPhaseOver({from: accounts[0]});

    assert.equal(isVotingPhaseOver, true);
  });

  it('should return false as voting pahse is not over', async function() {
    await utils.initVotingProposal(token, accounts);
    let isVotingPhaseOver = await token.isVotingPhaseOver({from: accounts[0]});

    assert.equal(isVotingPhaseOver, false);
  });

  it('should return false as voting pahse is still not over', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingProposal(token, accounts);
    utils.waitNbDays(13);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    let isVotingPhaseOver = await token.isVotingPhaseOver({from: accounts[0]});

    assert.equal(isVotingPhaseOver, false);
  });

  it('should return true as voting pahse is over', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingProposal(token, accounts);
    utils.waitNbDays(14);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    let isVotingPhaseOver = await token.isVotingPhaseOver({from: accounts[0]});

    assert.equal(isVotingPhaseOver, true);
  });

  it('should return error because minting is not finished', async function() {
    try {
      await token.votingProposal("https://", "0x123", {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });  

  it('should return the correct voting proposal URI', async function() {
    var uri = "https://";
    await token.finishMinting({from: accounts[0]});
    await token.votingProposal(uri, "0x123", {from: accounts[0]});
    let currentVotingProposal = await token.currentVotingProposal();

    assert.equal(currentVotingProposal[0], uri);
  });

  it('should return the correct voting proposal hash', async function() {
    var hash = "0x123";
    await token.finishMinting({from: accounts[0]});
    await token.votingProposal("https://", hash, {from: accounts[0]});
    let currentVotingProposal = await token.currentVotingProposal();

    assert.equal(currentVotingProposal[1].substring(0,5), hash);
  });

  it('should return error because uri is empty', async function() {
    await token.finishMinting({from: accounts[0]});
    try {
      await token.votingProposal("", "0x123", {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  }); 

  it('should return error because voting proposal hash is empty', async function() {
    await token.finishMinting({from: accounts[0]});
    try {
      await token.votingProposal("https://", "", {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should return error because we coudl not submit a new voting proposal when voting is ongoing', async function() {
    await utils.initVotingProposal(token, accounts);
    try {
      await token.votingProposal("https://", "0x123", {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  }); 

  it('should return 0 vote for account 0', async function() {
    await utils.initVotingProposal(token, accounts);
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 0);
  });

  it('should return 0 vote for account 1', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingProposal(token, accounts);
    let votes = await token.showVotes(accounts[1], {from: accounts[1]});

    assert.equal(votes, 0);
  });

  it('should return 100 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingProposal(token, accounts);
    let votes = await token.showVotes(accounts[1], {from: accounts[1]});

    assert.equal(votes, 0);
  });

  it('should return 10 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    await utils.initVotingProposal(token, accounts);
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 10);
  });

  it('should return 90 votes for account 1', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    await utils.initVotingProposal(token, accounts);
    let votes = await token.showVotes(accounts[1], {from: accounts[1]});

    assert.equal(votes, 90);
  });

  it('should return 100 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingProposal(token, accounts);
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 100);
  });

});
