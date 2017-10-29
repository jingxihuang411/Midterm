pragma solidity ^0.4.15;

import './Queue.sol';
import './Token.sol';
//import './utils/SafeMath.sol';
/**
 * @title Crowdsale
 * @dev Contract that deploys `Token.sol`
 * Is timelocked, manages buyer queue, updates balances on `Token.sol`
 */

//do i need a token address to initialize tokens??
//is this the address of the token contract after being deployed?

contract Crowdsale {
	using SafeMath for uint256;

	address public owner;

	//times for crowdsale
	uint256 public startTime;
	uint256 public endTime;

	//how many tokens per wei
	uint256 public rate;

	//amount of wei collected
	uint256 public weiRaised;

	//amount of tokens distributed
	uint256 public tokensSold;

	// holds all ether raised, sent to owner after end
	address public container;

	mapping (address => uint256) public deposits;

	Token public token;

	//our line of customers
	Queue public line;

	//modifiers
	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	//constructor
	function Crowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _capAmount, uint256 secondsWait) {

		require(_startTime != 0 && _endTime !=0);
		require (_startTime <= now && _endTime >= now);
		require(_rate > 0 && _capAmount > 0);
		require(secondsWait > 0);

		startTime = _startTime;
		endTime = _endTime;
		rate = _rate;
		owner = msg.sender;
		token = new Token();
		line = new Queue();
		token.mint(_capAmount);
		line.setTimeLimit(secondsWait);
	}

	//users must call this first to get in line to use a buy order
	function joinQueue() public {
		require(line.checkPlace() == 0);
		line.enqueue(msg.sender);
	}

	//buy tokens, must be valid purchase, updates sold amounts
	//user must be first in line, ie must call joinQueue before calling this
	function buyTokens() payable public {
		require(validBuy());
		uint256 weiAmount = msg.value;
		uint256 tokenAmount = weiAmount.mul(rate);

//		token.approve(msg.sender, tokenAmount);
		Debug(0,weiAmount, tokenAmount);
		token.transfer(msg.sender, tokenAmount);
		weiRaised = weiRaised.add( weiAmount);
		tokensSold = tokensSold.add(tokenAmount);

		//for refund purposes
		deposits[msg.sender] = weiAmount;
		TokenPurchase(msg.sender, weiAmount, tokenAmount);
		line.dequeue();
	}

	function mintToken(uint256 amount) onlyOwner public {
		require(amount > 0);
		token.mint(amount);
	}

	function burnToken(uint256 amount) onlyOwner public {
		require(amount > 0);

		if(token.burn(amount)) {
			tokensSold.sub(amount);
		}
	}

	function validBuy() internal constant returns (bool) {
		require(msg.value >= 0);
		require(now >= startTime && now <= endTime);

		//check first in queue and someone behind
		require(msg.sender == line.getFirst());
		require(line.qsize() > 1);

		return true;
	}

	//refunds ALL tokens
	function refundTokens() public returns (bool) {
		require(!hasEnded());
		address refundee = msg.sender;
		require(deposits[refundee] > 0);

		uint256 ethRefund = deposits[refundee];
		uint256 tokensReturned = token.balanceOf(refundee);

		deposits[refundee] = 0;
		//owner receives tokens back from user, user receives ether spent
		token.transferFrom(refundee, owner, tokensReturned);
		weiRaised = weiRaised.sub(ethRefund);
		tokensSold = tokensSold.sub(tokensReturned);
		refundee.transfer(ethRefund);
		Refund(refundee, tokensReturned);
	}

	//only callable by owner after sale, sends all ether held in contract to owner
	//not sure what to do with leftover tokens? owner keeps them for now
	function finalize() onlyOwner public {
		require(hasEnded());
		owner.transfer(weiRaised);
		token.closeMinting();
	}

	//ends if time is past OR if we met cap
	function hasEnded() public constant returns (bool) {
		return (now > endTime || token.balanceOf(owner) == 0);
	}

	function etherDepositOf(address _user) constant returns (uint256 balance){
		return deposits[_user];
	}

	event Debug(uint256 a, uint256 b, uint256 c);
	event Refund(address indexed _user, uint256 _value);
	event TokenPurchase(address indexed _buyer, uint256 _ethValue, uint256 _tokensBought);
}
