const Crowdsale = artifacts.require("./Crowdsale.sol");
const Queue = artifacts.require("./Queue.sol");
const Token = artifacts.require("./Token.sol");

contract('testCrowdsale', function(accounts) {
	/* Define your constant variables and instantiate constantly changing
	 * ones
	 */
	const args = {_owner: accounts[6]};
	let crowdSale, token, line;

	/* Do something before every `describe` method */
	beforeEach(async function() {
		var oneWeekDuration = 1*60*60*24*7;
		var twoDayWait = 1*60*60*24*2;
		var startTime = 1509066566;
		var endTime =   startTime + oneWeekDuration;
		crowdSale = await Crowdsale.new(startTime, endTime, 10, 100, twoDayWait, {from: args._owner});
		token = Token.at(await crowdSale.token());
		line = Queue.at(await crowdSale.line());


	});

	/* Group test cases together
	 * Make sure to provide descriptive strings for method arguements and
	 * assert statements
	 */
	describe('crowdsaleTest', function() {
		it('should be token owner', async function () {
			//accounts[0] is crowdSale owner address, crowdSale.address is Token owner address
			assert.equal(await token.owner(), crowdSale.address);
			assert.equal(await crowdSale.owner(), args._owner)
        })
        it('should initialize token owner balance', async function () {
        	assert.equal(await token.balanceOf(crowdSale.address), 100);
        })
	});

	describe('buyTokensTest', function () {
		beforeEach(async function() {
			crowdSale.joinQueue({from: accounts[1]});
            crowdSale.joinQueue({from: accounts[2]});
		});
		it("should be able to joinQueue", async function() {
			assert.equal(await line.qsize(),2);
        });

        it('should be abble to buy and refund tokens', async function () {

			crowdSale.buyTokens({from: accounts[1], value: 1});
			assert.equal(await crowdSale.etherDepositOf(accounts[1]), 1);
			assert.equal(await token.balanceOf(crowdSale.address), 90);
			assert.equal(await token.balanceOf(accounts[1]), 10);
			assert.equal(await line.qsize(),1);

			crowdSale.refundTokens({from: accounts[1]});
			assert.equal(await crowdSale.etherDepositOf(accounts[1]), 0);
            assert.equal(await token.balanceOf(crowdSale.address), 100);
            assert.equal(await token.balanceOf(accounts[1]), 0);

         });
         it('should be able finalize', async function () {
         	crowdSale.buyTokens({from: accounts[1], value: 1});
			crowdSale.burnToken(90, {from: args._owner});
			crowdSale.finalize({from: args._owner});
			console.log(await token.mintable());
			assert.equal(await token.mintable(), false);
			assert.equal(await crowdSale.etherDepositOf(args._owner), 1);

         });
	});

});
