var Crowdsale = artifacts.require("./Crowdsale.sol");
var Queue = artifacts.require("./Queue.sol");
var Token = artifacts.require("./Token.sol");

module.exports = function(deployer) {
	deployer.deploy(Queue);
	deployer.deploy(Token);
	//how to make this deploy work?
//	deployer.deploy(Crowdsale);
};
