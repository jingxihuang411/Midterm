pragma solidity ^0.4.15;

import './interfaces/ERC20Interface.sol';
import './utils/SafeMath.sol';

/**
 * @title Token
 * @dev Contract that implements ERC20 token standard
 * Is deployed by `Crowdsale.sol`, keeps track of balances, etc.
 */

contract Token is ERC20Interface {
	using SafeMath for uint256;

	address public owner;
	//total amount of tokens to be sold
	uint256 public totalSupply;
	bool public mintable = true;

	string public constant name = "Astro";
	string public constant symbol = "AST";
	//uint8 public decimals = 18;

	mapping (address => uint256) public balances;
	mapping(address => mapping (address => uint256)) public allowances;

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	function Token() public {
		owner = msg.sender;
		totalSupply = 0;
		balances[owner] = 0;
	}

	function balanceOf(address _user) constant returns (uint256 balance){
		return balances[_user];
	}

	function transfer(address _to, uint256 _value) returns (bool success){
		require(balances[msg.sender] >= _value);
		require(_value >= 0);
		require(_to != address(0));

		balances[msg.sender] = balances[msg.sender].sub(_value);
		balances[_to] = balances[_to].add(_value);
		Transfer(msg.sender, _to, _value);
		return true;
	}

	function transferFrom(address _from, address _to, uint256 _value) returns (bool success){

		require(_value >= 0);
		require(_value <=balances[_from]) ;
		require(_value <= allowances[_from][msg.sender]);
		require(_to != address(0));

		balances[_from] = balances[_from].sub(_value);
		balances[_to] = balances[_to].add(_value);
		allowances[_from][msg.sender] = allowances[_from][msg.sender].sub(_value);
		Transfer(_from, _to, _value);
		return true;
	}

	/// will entirely reset current allowance value upon calling, is this a problem?
	function approve(address _spender, uint256 _value) returns (bool success){
		require(_spender != address(0));
		require(_value >= 0);

		allowances[msg.sender][_spender] = _value;
		Approval(msg.sender, _spender, _value);
		return true;
	}

	function allowance(address _owner, address _spender) constant returns (uint256 remaining){
		return allowances[_owner][_spender];
	}

	//allows anyone to burn tokens
	//if called by owner, equivalent to burning "unsold tokens"
	function burn(uint256 _value) returns (bool success) {
		require(_value > 0);
		require(_value <= balances[msg.sender]);

		balances[msg.sender] = balances[msg.sender].sub(_value);
		totalSupply = totalSupply.sub(_value);
		Burn(msg.sender, _value);
		return true;
	}

	//only owner can mint tokens, and can only mint before sale ends
	//added to owners account, which is where totalSupply unsold is held
	function mint(uint256 _value) onlyOwner returns (bool success) {
		require(mintable);
		require(_value > 0);

		balances[owner] = balances[owner].add(_value);
		totalSupply = totalSupply.add(_value);
		Transfer(address(0), owner, _value);
		return true;
	}

	function closeMinting() onlyOwner public returns (bool success) {
		mintable = false;
		return true;
	}

	event Transfer(address indexed _from, address indexed _to, uint256 _value);
	event Approval(address indexed _owner, address indexed _spender, uint256 _value);
	event Burn(address indexed _burner, uint256 _value);
}
