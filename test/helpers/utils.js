const nbSecondsInADay = 24 * 60 * 60;
const twoWeeks = 2 * 7 * nbSecondsInADay;
const uri = "https://";
const hash = "0x123";
const proposalsName = ['no', 'yes'];

var Utils = {
    testMint(contract, accounts, account0, account1, account2) {
        return contract.mint(accounts[0], account0, {from: accounts[0]
        }).then(function (retVal) {
            assert.equal(retVal.logs.length, 2, "1 minting events were fired and 1 transfer event");
            assert.equal(retVal.logs[1].args.value.valueOf(), account0, "number of votes for account 0");
            return contract.mint(accounts[1], account1, {from: accounts[0]});
        }).then(function (retVal) {
            assert.equal(retVal.logs.length, 2, "1 minting events were fired and 1 transfer event");
            assert.equal(retVal.logs[1].args.value.valueOf(), account1, "number of votes for account 1");
            return contract.mint(accounts[2], account2, {from: accounts[0]});
        }).then(function (retVal) {
            assert.equal(retVal.logs.length, 2, "1 minting events were fired and 1 transfer event");
            assert.equal(retVal.logs[1].args.value.valueOf(), account2, "number of votes for account 2");
            return contract.finishMinting({from: accounts[0]});
        }).then(function (e) {
            return contract.showVotes.call(accounts[0], {from: accounts[0]})
        }).then(function (retVal) {
            assert.equal(account0, retVal.valueOf(), "account0 minted wrong/vote");
            return contract.balanceOf.call(accounts[0], {from: accounts[1]})
        }).then(function (retVal) {
            assert.equal(account0, retVal.valueOf(), "account0 minted wrong/balance");
            return contract.showVotes.call(accounts[1], {from: accounts[2]})
        }).then(function (retVal) {
            assert.equal(account1, retVal.valueOf(), "account1 minted wrong/vote");
            return contract.balanceOf.call(accounts[1], {from: accounts[0]})
        }).then(function (retVal) {
            assert.equal(account1, retVal.valueOf(), "account1 minted wrong/balance");
            return contract.showVotes.call(accounts[2], {from: accounts[0]})
        }).then(function (retVal) {
            assert.equal(account2, retVal.valueOf(), "account2 minted wrong/vote");
            return contract.balanceOf.call(accounts[2], {from: accounts[1]})
        }).then(function (retVal) {
            assert.equal(account2, retVal.valueOf(), "account2 minted wrong/balance");
        }).catch((err) => { throw new Error(err) });
    },

    claimAndTestBonus(contract, account, expectedBonus) {
        var before;
        return contract.showBonus.call(account, {
            from: account
        }).then(function (retVal) {
            assert.equal(retVal.valueOf(), expectedBonus, "expceted bonus");
            before = web3.toBigNumber(web3.eth.getBalance(account));
            return contract.claimBonus({from: account});
        }).then(function (retVal) {
            const txFee = web3.toBigNumber(web3.eth.getTransactionReceipt(retVal.tx).gasUsed).times(
                web3.toBigNumber(web3.eth.getTransaction(retVal.tx).gasPrice));
            const after = web3.toBigNumber(web3.eth.getBalance(account));
            assert.equal(after.minus(before.minus(txFee)).toNumber(), expectedBonus, "bonus must match");
        }).catch((err) => { throw new Error(err) });
    },

    testVote(contract, accounts, voteAccount1, voteAccount2, increaseAccount2, vote1, vote2, resultAccount0) {
        return contract.votingObject(uri, hash, twoWeeks, proposalsName, {
            from: accounts[0]
        }).then(function (retVal) {
            return contract.vote(vote1, {from: accounts[1]})
        }).then(function (retVal) {
            assert.equal(retVal.logs.length, 1, "1 event was fired from 1");
            assert.equal(retVal.logs[0].args.votes.valueOf(), voteAccount1, voteAccount1 + " votes from 1");
            if (increaseAccount2 > 0) {
                return contract.transfer(accounts[2], increaseAccount2, {from: accounts[0]})
            } else {
                return contract.balanceOf.call(accounts[2], {from: accounts[1]});
            }
        }).then(function (retVal) {
            if (increaseAccount2 > 0) {
                assert.equal(retVal.logs.length, 1, "1 transfer event fired");
                assert.equal(retVal.logs[0].args.value.valueOf(), increaseAccount2, increaseAccount2 + " from account0 to account2 before votes");
            }
            return contract.vote(vote2, {from: accounts[2]})
        }).then(function (retVal) {
            assert.equal(retVal.logs.length, 1, "1 event was fired from 2");
            assert.equal(retVal.logs[0].args.votes.valueOf(), voteAccount2, voteAccount2 + " votes from 2");
            module.exports.waitTwoWeeks();
            return contract.resetVoting({from: accounts[0]})
        }).catch((err) => { throw new Error(err) });
    },

    testTokens(contract, accounts, locked, total, account0, account1) {
        return contract.lockedTokens.call({
            from: accounts[0]
        }).then(function (retVal) {
            assert.equal(locked, retVal.valueOf(), "locked wrong");
            return contract.totalSupply.call({from: accounts[1]})
        }).then(function (retVal) {
            assert.equal(total, retVal.valueOf(), "total wrong");
            return contract.balanceOf.call(accounts[0], {from: accounts[2]})
        }).then(function (retVal) {
            assert.equal(account0, retVal.valueOf(), "account0 wrong");
            return contract.balanceOf.call(accounts[1], {from: accounts[3]})
        }).then(function (retVal) {
            assert.equal(account1, retVal.valueOf(), "account1 wrong");
        }).catch((err) => { throw new Error(err) });
    },

    testVotingPhaseStatus(contract, accounts, ongoing, active, over) {
        return contract.isVoteOngoing.call({
            from: accounts[0]
        }).then(function (retVal) {
            assert.equal(ongoing, retVal.valueOf(), "ongoing flag wrong + (" + ongoing + "," + active + "," + over + ")");
            return contract.isVotingObjectActive.call({from: accounts[2]})
        }).then(function (retVal) {
            assert.equal(active, retVal.valueOf(), "active flag wrong: (" + ongoing + "," + active + "," + over + ")");
            return contract.isVotingPhaseOver.call({from: accounts[1]})
        }).then(function (retVal) {
            assert.equal(over, retVal.valueOf(), "over flag wrong (" + ongoing + "," + active + "," + over + ")");
        }).catch((err) => { throw new Error(err) });
    },

    waitTwoWeeks() {
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [twoWeeks], id: 0})
    },

    wait90Days() {
        const ninetyDays = 90 * nbSecondsInADay;
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [ninetyDays], id: 0})
    },

    wait548Days() {
        const ninetyDays = 548 * nbSecondsInADay;
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [ninetyDays], id: 0})
    },

    waitNbDays(nbDays) {
        const nbSeconds = nbDays * nbSecondsInADay;
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [nbSeconds], id: 0})
    },

    convertNbDaysToSeconds(nbDays) {
        return nbDays * nbSecondsInADay;
    },

    initVotingObject(token, accounts) {  
        return token.votingObject(uri, hash, twoWeeks, proposalsName, {from: accounts[0]});
    },

    initPayoutObject(token, accounts) {  
        return token.mint(accounts[9], 100, {from: accounts[0]
        }).then(function () {
            return token.payoutObject(uri, hash, {value: 100, from: accounts[0]})
        });  
    },     

    stringToHexBytes(stringToConvert) {
        var hexChar = ["0", "1", "2", "3", "4", "5", "6", "7","8", "9", "a", "b", "c", "d", "e", "f"];
        var result = "0x";
        for (var i = 0; i < stringToConvert.length; i++){  
            byteDec = stringToConvert.charCodeAt(i);
            result += hexChar[(byteDec >> 4) & 0x0f] + hexChar[byteDec & 0x0f];
        }
        return result;
    },

    byteToHex(byteToConvert) {
        var hexChar = ["0", "1", "2", "3", "4", "5", "6", "7","8", "9", "a", "b", "c", "d", "e", "f"];
        var result = "0x";
        for (var i = 0; i < b.length; i++){  
            result += hexChar[(b[i] >> 4) & 0x0f] + hexChar[b[i] & 0x0f];
        }
        return result;
    },

    getUri() {
        return uri;
    },

    getHash() {
        return hash;
    },

    getProposalsName() {
        return proposalsName;
    }
    
}
module.exports = Utils