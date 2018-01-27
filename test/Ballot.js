'use strict';

const assertJump = require('./helpers/assertJump');
const assertRevert = require('./helpers/assertRevert');
const assertNotAFunction = require('./helpers/assertNotAFunction');

var utils = require('./helpers/utils');
var TEMToken = artifacts.require("./TokenEstateMarketplaceToken.sol");

const twoWeeks = utils.convertNbDaysToSeconds(2 * 7);
const uri = utils.getUri();
const hash = utils.getHash();
const proposalsName = utils.getProposalsName();


contract('Ballot', function (accounts) {

  let token;

  beforeEach(async function() {
    token = await TEMToken.new();
  });

  it('should return false as vote is not ongoing', async function() {
    let isVoteOngoing = await token.isVoteOngoing({from: accounts[0]});

    assert.equal(isVoteOngoing, false);
  });

  it('should return true as vote is ongoing', async function() {
    await utils.initVotingObject(token, accounts);
    let isVoteOngoing = await token.isVoteOngoing({from: accounts[0]});

    assert.equal(isVoteOngoing, true);
  });

  it('should return true as vote is still ongoing', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    utils.waitNbDays(13);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    let isVoteOngoing = await token.isVoteOngoing({from: accounts[0]});

    assert.equal(isVoteOngoing, true);
  });

  it('should return false as vote is not ongoing', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    await utils.waitNbDays(14);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    let isVoteOngoing = await token.isVoteOngoing({from: accounts[0]});

    assert.equal(isVoteOngoing, false);
  });

  it('should return false as vote is not ongoing', async function() {
    let isVotingObjectActive = await token.isVotingObjectActive({from: accounts[0]});

    assert.equal(isVotingObjectActive, false);
  });

  it('should return true as vote is ongoing', async function() {
    await utils.initVotingObject(token, accounts);
    let isVotingObjectActive = await token.isVotingObjectActive({from: accounts[0]});

    assert.equal(isVotingObjectActive, true);
  });

  it('should return true as voting pahse is over', async function() {
    let isVotingPhaseOver = await token.isVotingPhaseOver({from: accounts[0]});

    assert.equal(isVotingPhaseOver, true);
  });

  it('should return false as voting pahse is not over', async function() {
    await utils.initVotingObject(token, accounts);
    let isVotingPhaseOver = await token.isVotingPhaseOver({from: accounts[0]});

    assert.equal(isVotingPhaseOver, false);
  });

  it('should return false as voting pahse is still not over', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    utils.waitNbDays(13);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    let isVotingPhaseOver = await token.isVotingPhaseOver({from: accounts[0]});

    assert.equal(isVotingPhaseOver, false);
  });

  it('should return true as voting pahse is over', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    utils.waitNbDays(14);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    let isVotingPhaseOver = await token.isVotingPhaseOver({from: accounts[0]});

    assert.equal(isVotingPhaseOver, true);
  });

  it('should prevent non-owners from calling votingObject()', async function() {
    const other = accounts[1];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    try {
      await token.votingObject(uri, hash, twoWeeks, proposalsName, {from: other});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });
  
  it('should return the correct voting Object URI', async function() {
    await token.votingObject(uri, hash, twoWeeks, proposalsName, {from: accounts[0]});
    let currentVotingObject = await token.currentVotingObject();

    assert.equal(currentVotingObject[0], uri);
  });

  it('should return the correct voting Object hash', async function() {
    await token.votingObject(uri, hash, twoWeeks, proposalsName, {from: accounts[0]});
    let currentVotingObject = await token.currentVotingObject();

    assert.equal(currentVotingObject[1].substring(0,hash.length), hash);
  });

  it('should return the correct voting duration', async function() {
    const threeWeeks = utils.convertNbDaysToSeconds(3 * 7);
    await token.votingObject(uri, hash, threeWeeks, proposalsName, {from: accounts[0]});
    let currentVotingObject = await token.currentVotingObject();

    assert.equal(currentVotingObject[3], threeWeeks);
  });

  it('should return the proposal no for 1st proposal name', async function() {
    var proposalNo = "no";
    var proposalNoToHex = utils.stringToHexBytes(proposalNo);
    await token.votingObject(uri, hash, twoWeeks, [proposalNo, "yes"], {from: accounts[0]});
    let proposal = await token.proposals(0);

    assert.equal(proposal[0].substring(0,proposalNoToHex.length), proposalNoToHex);
  });

  it('should return the proposal yes for 2nd proposal name', async function() {
    var proposalYes = "yes";
    var proposalYesToHex = utils.stringToHexBytes(proposalYes);
    await token.votingObject(uri, hash, twoWeeks, ["no", proposalYes], {from: accounts[0]});
    let proposal = await token.proposals(1);

    assert.equal(proposal[0].substring(0,proposalYesToHex.length), proposalYesToHex);
  });

  it('should return 0 vote for proposal', async function() {
    await utils.initVotingObject(token, accounts);
    let proposal = await token.proposals(0);

    assert.equal(proposal[1], 0);
  });

  it('should return error because uri is empty', async function() {
    try {
      await token.votingObject("", hash, twoWeeks, proposalsName, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  }); 

  it('should return error because voting Object hash is empty', async function() {
    try {
      await token.votingObject(uri, "", twoWeeks, proposalsName, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error because voting voting duration is 0', async function() {
    try {
      await token.votingObject(uri, hash, 0, proposalsName, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error because proposal array is empty', async function() {
    try {
      await token.votingObject(uri, hash, twoWeeks, [], {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error because we coudl not submit a new voting Object when voting is ongoing', async function() {
    await utils.initVotingObject(token, accounts);
    try {
      await token.votingObject(uri, hash, twoWeeks, proposalsName, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  }); 

  it('should return 0 vote for account 0', async function() {
    await utils.initVotingObject(token, accounts);
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 0);
  });

  it('should return 0 vote for account 1', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    let votes = await token.showVotes(accounts[1], {from: accounts[1]});

    assert.equal(votes, 0);
  });

  it('should return 100 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    let votes = await token.showVotes(accounts[0], {from: accounts[1]});

    assert.equal(votes, 100);
  });

  it('should return 10 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    await utils.initVotingObject(token, accounts);
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 10);
  });

  it('should return 10 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 10);
  });

  it('should return 90 votes for account 1', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    await utils.initVotingObject(token, accounts);
    let votes = await token.showVotes(accounts[1], {from: accounts[1]});

    assert.equal(votes, 90);
  });

  it('should return 100 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    await token.transfer(accounts[1], 90, {from: accounts[0]}); 
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 100);
  });

  it('should return 10 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.approve(accounts[2], 100);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 10);
  });

  it('should return 10 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.approve(accounts[2], 100);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    await utils.initVotingObject(token, accounts);
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 10);
  });

  it('should return 90 votes for account 1', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.approve(accounts[2], 100);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    await utils.initVotingObject(token, accounts);
    let votes = await token.showVotes(accounts[1], {from: accounts[1]});

    assert.equal(votes, 90);
  });

  it('should return 100 votes for account 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.approve(accounts[2], 100);
    await utils.initVotingObject(token, accounts);
    await token.transferFrom(accounts[0], accounts[1], 90, {from: accounts[2]}); 
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 100);
  });

  it('should return error when calling initNbVotes() internal function', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    try {
      await token.initNbVotes(accounts[1], 90, {from: accounts[0]}); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertNotAFunction(error);
    }
  });

  it('should return 0 vote for account 0 because he has voted', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    await token.vote(0, {from: accounts[0]});
    let votes = await token.showVotes(accounts[0], {from: accounts[0]});

    assert.equal(votes, 0);
  });

  it('should return 100 votes for proposal 0', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    await token.vote(0, {from: accounts[0]});
    let proposal = await token.proposals(0);

    assert.equal(proposal[1], 100);
  });

  it('should return error because we could not vote when voting is not ongoing', async function() {
    try {
      await token.vote(0, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error because the number of available vote is 0', async function() {
    await utils.initVotingObject(token, accounts);
    try {
      await token.vote(0, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error because the proposal id do not exist', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    try {
      await token.vote(2, {from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return 190 votes for proposal 1', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await token.mint(accounts[1], 90, {from: accounts[0]});
    await token.mint(accounts[2], 70, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    await token.vote(1, {from: accounts[0]});
    await token.vote(1, {from: accounts[1]});
    await token.vote(0, {from: accounts[2]});
    let proposal = await token.proposals(1);

    assert.equal(proposal[1], 190);
  });

  it('should return error as vote is not ongoing', async function() {
    try {
      await token.resetVoting({from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should return error as voting phase is not over', async function() {
    await utils.initVotingObject(token, accounts);
    try {
      await token.resetVoting({from: accounts[0]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should prevent non-owners from calling resetVoting()', async function() {
    const other = accounts[1];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    await token.mint(owner, 100, {from: owner});
    await utils.initVotingObject(token, accounts);
    utils.waitNbDays(14);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(other, 10, {from: owner}); 
    try {
      await token.resetVoting({from: other});
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });  

  it('should reset votingObject', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    utils.waitNbDays(14);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    await token.resetVoting({from: accounts[0]});
    let currentVotingObject = await token.currentVotingObject();

    assert.equal(currentVotingObject[0], '');
  });

  it('should reset proposals', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    utils.waitNbDays(14);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    await token.resetVoting({from: accounts[0]});
    try {
      let proposals = await token.proposals(0);
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should allow new voting object', async function() {
    await token.mint(accounts[0], 100, {from: accounts[0]});
    await utils.initVotingObject(token, accounts);
    utils.waitNbDays(14);
    // Make a transaction to mine a block to change time
    // https://github.com/ethereumjs/testrpc/issues/336
    await token.transfer(accounts[2], 10, {from: accounts[0]}); 
    await token.resetVoting({from: accounts[0]});
    var uri = "https://2nd";
    await token.votingObject(uri, hash, twoWeeks, proposalsName, {from: accounts[0]});
    let currentVotingObject = await token.currentVotingObject();

    assert.equal(currentVotingObject[0], uri);
  });

});
