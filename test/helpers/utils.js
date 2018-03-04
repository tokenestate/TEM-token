const nbSecondsInADay = 24 * 60 * 60;
const twoWeeks = 2 * 7 * nbSecondsInADay;
const uri = "https://";
const hash = "0x123";
const proposalsName = ['no', 'yes'];

var Utils = {
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