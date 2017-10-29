pragma solidity ^0.4.15;

/**
 * @title Queue
 * @dev Data structure contract used in `Crowdsale.sol`
 * Allows buyers to line up on a first-in-first-out basis
 * See this example: http://interactivepython.org/courselib/static/pythonds/BasicDS/ImplementingaQueueinPython.html
 */

//import './utils/SafeMath.sol';

contract Queue {

	/* State variables */
	//	using SafeMath for uint256;

	address[5] queue;


	uint8 sizeLimit = 5;
	uint8 size = 0;
	uint8 front = 0;
	uint8 back = 0;
	uint256 timeLimit;
	uint256 startTime;

	/* Add events */
	event Timeout(address indexed timeOuter);
	event Purchased(address indexed buyer);

	/* Returns the number of people waiting in line */
	function qsize() constant returns(uint8) {
		return size;
	}

	/* Returns whether the queue is empty or not */
	function empty() constant returns(bool) {
		return size == 0;
	}

	/* Returns the address of the person in the front of the queue */
	function getFirst() constant returns(address) {
		require(size > 0);
		return queue[front];

	}

	/* Allows `msg.sender` to check their position in the queue */
	function checkPlace() constant returns(uint8) {
		// return 1-5 indicating the position of msg.sender in the queue, 0 if not present in the queue
		for (uint8 i = 0; i < size; i++) {
			if (queue[(front + i) % 5] == msg.sender) {
				return i+1;
			}
		}
		return 0;
	}

	/* Allows anyone to expel the first person in line if their time
	 * limit is up
	 */
	function checkTime() returns (uint256) {
		if (size > 0 && (now - startTime) > timeLimit) {
			Timeout(queue[front]);
			dequeue();
		}
		return (now-startTime);
	}

	//do we need to check ownerOnly? It's only called in the constructor
	function setTimeLimit(uint256 _timeLimit)  returns (bool) {
		require(_timeLimit > 0);
		timeLimit = _timeLimit;
	}

	/* Removes the first person in line; either when their time is up or when
	 * they are done with their purchase
	 */
	function dequeue() {
		require(size > 0);
		Purchased(queue[front]);
		queue[front] = address(0);
		front = (front + 1) % 5;
		size -= 1;

//		if(size > 0) {
//			startTime = now;
//		}
	}

	/* Places `addr` in the first empty position in the queue */
	function enqueue(address addr) {
		require(size + 1 <= sizeLimit);
		if (size == 0) {
			startTime = now;
		}
		queue[back] = addr;
		back = (back + 1) % 5;
		size += 1;
	}
}
