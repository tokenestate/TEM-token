// Forked from:
// https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/helpers/assertJump.js

module.exports = function(error) {
  assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
};
