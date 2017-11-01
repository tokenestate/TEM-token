var TokenEstatePlatformToken = artifacts.require("./TokenEstatePlatformToken.sol");

module.exports = function(deployer) {
  deployer.deploy(TokenEstatePlatformToken);
};
