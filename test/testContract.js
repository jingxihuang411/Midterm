'use strict';

/* Add the dependencies you're testing */
const Queue = artifacts.require("./Queue.sol");
const Token = artifacts.require("./Token.sol");
//
contract('testToken', function(accounts) {
	/* Define your constant variables and instantiate constantly changing
	 * ones
	 */
	const args = {_owner: accounts[0], _buyer1: accounts[1], _buyer2: accounts[2]};
	let token;

	/* Do something before every `describe` method */
	beforeEach(async function() {
		token = await Token.new({from: args._owner});
		token.mint(100);

	});

	/* Group test cases together
	 * Make sure to provide descriptive strings for method arguements and
	 * assert statements
	 */
	describe('TokenTestGeneric', function() {
		it("should be able to deploy token contract", async function() {
			assert.ok(token.address);
		});
		it("should initialize owner and totalSupply upon deployment ", async function() {
        	assert.equal(await token.owner(), args._owner);
        	assert.equal(await token.balanceOf(args._owner), 100);
        	assert.equal(await token.totalSupply(), 100);
        });
        it("should set totalSupply after mint", async function() {
        	token.mint(50)
            assert.equal(await token.totalSupply(), 150);
            assert.equal(await token.balanceOf(args._owner), 150);
        });
	});

	describe('TokenTestTransfer', function() {
        it("should return correct balances after transfer", async function() {
        	await token.transfer(args._buyer1, 30);
        	assert.equal(await token.balanceOf(args._owner), 70);
        	assert.equal(await token.balanceOf(args._buyer1), 30);
        });
        it('should throw an error when trying to transfer more than balance', async function() {
            try {
            	await token.transfer(args._buyer1, 101);
              	assert.fail('should have thrown before');
            } catch(error) {
				assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
            }
         });
        it('should throw an error when trying to transfer to 0x0', async function() {
             try {
               await token.transfer(0x0, 100);
               assert.fail('should have thrown before');
             } catch(error) {
               assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
             }
         });
	});

	describe('ToeknTestApprove', function() {
		it('should return the correct allowance amount after approval', async function() {
			await token.approve(args._buyer1, 100);
			assert.equal(await token.allowance(args._owner, args._buyer1), 100);
		});

		it('should return correct balances after transfering from another account', async function() {
            await token.approve(args._buyer1, 100);
            await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});

            let balance0 = await token.balanceOf(accounts[0]);
            assert.equal(balance0, 0);

            let balance1 = await token.balanceOf(accounts[2]);
            assert.equal(balance1, 100);

            let balance2 = await token.balanceOf(accounts[1]);
            assert.equal(balance2, 0);
            assert.equal(await token.allowance(args._owner, args._buyer1), 0);
          });

        it('should throw an error when trying to transfer more than allowed', async function() {
            await token.approve(accounts[1], 99);
            try {
              await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
              assert.fail('should have thrown before');
            } catch (error) {
              assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
            }
         });

        it('should throw an error when trying to transferFrom more than _from has', async function() {
            let balance0 = await token.balanceOf(accounts[0]);
            await token.approve(accounts[1], 99);
            try {
              await token.transferFrom(accounts[0], accounts[2], balance0+1, {from: accounts[1]});
              assert.fail('should have thrown before');
            } catch (error) {
              assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
            }
        });

        it('should throw an error when trying to transfer to 0x0', async function() {
            try {
              let transfer = await token.transfer(0x0, 100);
              assert.fail('should have thrown before');
            } catch(error) {
              assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
            }
          });

        it('should throw an error when trying to transferFrom to 0x0', async function() {
            await token.approve(accounts[1], 100);
			try {
			  let transfer = await token.transferFrom(accounts[0], 0x0, 100, {from: accounts[1]});
			  assert.fail('should have thrown before');
			} catch(error) {
			  assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
			}
		  });
    });
	describe('TokenTestBurn', function() {
        it('owner should be able to burn tokens', async function () {
			await token.burn(1, { from: accounts[0] })

			assert.equal(await token.balanceOf(accounts[0]), 99);
			assert.equal(await token.totalSupply(), 99);
		})

		it('buyer should be able to burn tokens', async function () {
			token.transfer(args._buyer1, 30);
			token.burn(1, {from: args._buyer1});
			assert.equal(await token.balanceOf(args._owner),70);
			assert.equal(await token.balanceOf(args._buyer1),29);
			assert.equal(await token.totalSupply(), 99);
        })

		it('cannot burn more tokens than your balance', async function () {
			try {
			  await token.burn(101, {from: args._owner});
			  assert.fail('should have thrown before');
			} catch(error) {
			  assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
			}
		})
	});
});

contract('testQueue', function(accounts) {
	/* Define your constant variables and instantiate constantly changing
	 * ones
	 */
	const args = {_owner: accounts[0]};
	let queue;

	/* Do something before every `describe` method */
	beforeEach(async function() {
		queue = await Queue.new({from: args._owner});

	});

	/* Group test cases together
	 * Make sure to provide descriptive strings for method arguements and
	 * assert statements
	 */
	describe('queueTestGeneric', function() {
		it("should be able to deploy token contract", async function() {
			assert.ok(queue.address);
		});

		it("should initialize properly after deployment", async function() {
        	assert.equal(await queue.qsize(),0);
        	assert.equal(await queue.empty(), true);
        });

	});

	describe('queueTestEnqueueDequeue', function() {
		it("should be able to enqueue if less than 5", async function() {
    		queue.enqueue(accounts[1]);
    		assert.equal(await queue.qsize(),1);
    		assert.equal(await queue.getFirst({from: accounts[5]}), accounts[1]);
    		assert.equal(await queue.checkPlace({from: accounts[1]}), 1);

    		queue.enqueue(accounts[2]);
			queue.enqueue(accounts[3]);
			queue.enqueue(accounts[4]);
			queue.enqueue(accounts[5]);
			assert.equal(await queue.qsize(), 5);
			assert.equal(await queue.getFirst({from: accounts[5]}), accounts[1]);
			assert.equal(await queue.checkPlace({from: accounts[5]}), 5);

			try {
				await queue.enqueue(accounts[6])
				assert.fail('should have thrown before');
			} catch (error) {
				assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
			}
    	});

    	it("should return 0 if checkPlace of non exist address", async function() {
            assert.equal(await queue.checkPlace({from: accounts[1]}), 0);
        });

        it("should be able to dequeue if not empty", async function() {
        	queue.enqueue(accounts[1]);
        	queue.enqueue(accounts[2]);
            queue.enqueue(accounts[3]);
            queue.dequeue();
            assert.equal(await queue.qsize(), 2);
            assert.equal(await queue.getFirst({from: accounts[3]}), accounts[2]);
            assert.equal(await queue.checkPlace({from: accounts[3]}), 2);
        });
//
//        it("should be able to setTimeLimit and checkTime", async function() {
//            queue.enqueue(accounts[1]);
//			queue.enqueue(accounts[2]);
//			queue.setTimeLimit(1);
////			web3.eth.getBlockNumber().then(console.log);
////			web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [1000], id: 0});
////			web3.eth.getBlockNumber().then(console.log);
//
//
////			var start = new Date().getTime();
////            while (new Date().getTime() < start + 2);
////			var check = queue.checkTime();
////
////
//			assert.equal(await queue.qsize(), 2);

	});
});


