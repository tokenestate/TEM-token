module.exports = function (error) {
  assert.isAbove(error.message.search('not a function'), -1, 'Error containing "not a function" must be returned');
};
