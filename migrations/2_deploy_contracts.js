var TokenEstateMarketplaceToken = artifacts.require("./TokenEstateMarketplaceToken.sol");

module.exports = function(deployer) {
  deployer.deploy(TokenEstateMarketplaceToken);
};
