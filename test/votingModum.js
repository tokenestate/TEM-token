var TEMToken = artifacts.require("./TokenEstateMarketplaceToken.sol");
var utils = require('./helpers/utils');


contract('TokenEstateMarketplaceToken', function (accounts) {


    //https://ethereum.stackexchange.com/questions/15567/truffle-smart-contract-testing-does-not-reset-state/15574#15574
    var contract;
    beforeEach(function () {
        return TEMToken.new()
            .then(function(instance) {
                contract = instance;
            });
    });

    it("test voting with phases and voting successful with token transfer in between", function () {
        return TEMToken.deployed().then(function (instance) {
            contract.mint([accounts[0]], [1000], {from: accounts[0]});
        }).then(function () {
            return contract.finishMinting({from: accounts[0]});
        }).then(function () {
            return contract.showVotes.call(accounts[0], {from: accounts[0]})
        }).then(function (retVal) {
            assert.equal(retVal.valueOf(), 1000, "account 0 has 1000 votes");
            return contract.showVotes.call(accounts[1], {from: accounts[0]})
        }).then(function (retVal) {
            assert.equal(retVal.valueOf(), 0, "account 1 have 0 votes");
            return utils.testVotingPhaseStatus(contract, accounts, false, false, true);
        }).then(function (retVal) {
            return contract.votingProposal("https://", "0x123", {from: accounts[0]});
        }).then(function () {
            return contract.transfer(accounts[1], 50, {from: accounts[0]});
        }).then(function (e) {
            return contract.showVotes.call(accounts[1], {from: accounts[0]})
        }).then(function (retVal) {
            assert.equal(retVal.valueOf(), 0, "account 1 have 0 votes");
            return contract.vote(true, {from: accounts[1]})
        }).then(function (retVal) {
            assert.equal(false, "account 1 does not have any voting rights");
        }).catch(function (e) {
            return contract.vote(true, {from: accounts[0]})
        }).then(function (retVal) {
            //https://ethereum.stackexchange.com/questions/16291/truffle-call-that-returns-contract-is-returning-tx
            //https://ethereum.stackexchange.com/questions/16796/truffle-console-how-can-i-get-and-print-the-value-returned-by-a-contract-funct
            //--> need to check for the event
            //http://truffleframework.com/docs/getting_started/contracts#catching-events
            assert.equal(retVal.logs.length, 1, "1 event was fired");
            assert.equal(retVal.logs[0].args.votes.valueOf(), 1000, "1000 votes");
            return contract.showVotes.call(accounts[0], {from: accounts[0]})
        }).then(function (retVal) {
            assert.equal(retVal.valueOf(), 0, "account 0 already voted, so he has 0 votes");
            return contract.claimVotingProposal({from: accounts[0]})
        }).then(function (retVal) {
            assert.equal(false, 0, "voting period not over yet");
        }).catch(function (e) {
            return utils.testVotingPhaseStatus(contract, accounts, true, true, false);
        }).then(function (retVal) {
            utils.waitTwoWeeks();
            return contract.claimVotingProposal({from: accounts[1]})
        }).then(function (retVal) {
            assert.equal(false, 0, "only owner could claim voting proposal");
        }).catch(function (e) {
            return utils.testVotingPhaseStatus(contract, accounts, false, true, true);
        }).then(function (retVal) {
            return contract.claimVotingProposal({from: accounts[0]})
        }).then(function (retVal) {
            //return utils.testTokens(contract, accounts, 9900000 - 5000, 6000, 5950, 50);
        }).then(function (retVal) {
            return utils.testVotingPhaseStatus(contract, accounts, false, false, true);
        }).catch((err) => { throw new Error(err) });
    });

    it("test multiple voting, no increase", function () {
        return TEMToken.deployed().then(function (instance) {
        }).then(function (retVal) {
            return utils.testMint(contract, accounts, 5000, 1001, 1000)
        }).then(function (retVal) {
            return utils.testVote(contract, accounts, 1001, 1000, 0, true, false, 10000);
        }).then(function (retVal) {
            return utils.testVote(contract, accounts, 1001, 1000, 0, false, true, 10000);
        }).then(function (retVal) {
            utils.wait90Days();
            return utils.testVote(contract, accounts, 1001, 1000, 0, true, false, 5000 + 9900000);
        }).then(function (retVal) {
            return contract.votingProposal("https://", "0x123", {from: accounts[0]});
        }).then(function (retVal) {
            assert.equal(false, 0, "all locked tokens used");
        }).catch(function (e) {
            //this is expected
            //return utils.testTokens(contract, accounts, 0, 5000 + 9900000 + 1000 + 1001, 5000 + 9900000, 1001);
        }).catch((err) => { throw new Error(err) });
    });

    it("test multiple voting, increase tokens for account 2", function () {
        return TEMToken.deployed().then(function (instance) {
        }).then(function (retVal) {
            return utils.testMint(contract, accounts, 5000, 1001, 1000)
        }).then(function (retVal) {
            return utils.testVote(contract, accounts, 1001, 1000, 100, true, false, 10000 - 100);
        }).then(function (retVal) {
            return utils.testVote(contract, accounts, 1001, 1100, 200, true, false, 10000 - (100 + 200));
        }).then(function (retVal) {
            utils.wait90Days();
            return utils.testVote(contract, accounts, 1001, 1300, 0, false, true, 4700 + 9900000);
        }).then(function (retVal) {
            return contract.votingProposal("https://", "0x123", {from: accounts[0]});
        }).then(function (retVal) {
            assert.equal(false, 0, "all locked tokens used");
        }).catch(function (e) {
            //this is expected
            //return utils.testTokens(contract, accounts, 0, 4700 + 9900000 + 1300 + 1001, 4700 + 9900000, 1001);
        }).catch((err) => { throw new Error(err) });
    });

    it("test empty voting fails", function () {
        return TEMToken.deployed().then(function (instance) {
        }).then(function (retVal) {
            return utils.testMint(contract, accounts, 5000, 1001, 1000)
        }).then(function (retVal) {
            return contract.proposal("https://", "0x123", {from: accounts[0]});
        }).then(function (retVal) {
            assert.equal(false, 0, "cannot vote for 0 tokens");
        }).catch(function (e) {
            //this is expected
            //return utils.testTokens(contract, accounts, 9900000, 7001, 5000, 1001);
        }).catch((err) => { throw new Error(err) });
    });

    it("test 90 days blocking period", function () {
        return TEMToken.deployed().then(function (instance) {
        }).then(function (retVal) {
            return utils.testMint(contract, accounts, 5000, 1001, 1000)
        }).then(function (retVal) {
            return utils.testVote(contract, accounts, 1001, 1000, 0, false, true, 10000);
        }).then(function (retVal) {
            //voting has been declined, voting again should now fail
            return contract.votingProposal("https://", "0x123", {from: accounts[0]});
        }).then(function (retVal) {
            assert.equal(false, 0, "voting should fail as we did not wait 90 days");
        }).catch(function (e) {
            utils.wait90Days(); //this is not enough
            return contract.votingProposal("https://", "0x123", {from: accounts[0]});
        }).catch((err) => { throw new Error(err) });
    });

    it("test 90 days + 2 weeks blocking period", function () {
        return TEMToken.deployed().then(function (instance) {
        }).then(function (retVal) {
            return utils.testMint(contract, accounts, 5000, 1001, 1000)
        }).then(function (retVal) {
            return utils.testVote(contract, accounts, 1001, 1000, 0, false, true, 10000);
        }).then(function (retVal) {
            //voting has been declined, voting again should now fail
            return contract.votingProposal("https://", "0x123", {from: accounts[0]});
        }).then(function (retVal) {
            assert.equal(false, 0, "voting should fail as we did not wait 90 days");
        }).catch(function (e) {
            utils.waitTwoWeeks(); //this is not enough
            return contract.votingProposal("https://", "0x123", {from: accounts[0]});
        }).then(function (retVal) {
            assert.equal(false, 0, "voting should fail as we did not wait 90 days");
        }).catch(function (e) {
            utils.wait90Days(); //90 days is enough
            return utils.testVote(contract, accounts, 5000, 1001, 1000, 0, true, false, 10000);
        }).catch((err) => { throw new Error(err) });
    });

    it("milestones tests", function () {
        return TEMToken.deployed().then(function (instance) {
        }).then(function (retVal) {
            return utils.testMint(contract, accounts, 0, 1001, 1000);
        }).then(function (retVal) {
            return utils.testVote(contract, accounts, 1001, 1000, 0, true, false, 900000);
        }).catch((err) => { throw new Error(err) });
    });

});
