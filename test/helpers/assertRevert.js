// Forked from:
// https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/helpers/assertRevert.js

module.exports = function (error) {
  assert.isAbove(error.message.search('revert'), -1, 'Error containing "revert" must be returned');
};
