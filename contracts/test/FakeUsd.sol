// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FakeUsd is ERC20, Pausable, Ownable {
	uint256 public faucetAllowedAmount = 10000 * 10**decimals();
	uint256 public lockTime = 1 days;
	mapping(address => uint256) public lockTimes;

	event TokensRequested(address indexed requestor, uint256 amount);

	constructor() ERC20("FakeUsd", "FUSD") {
		_mint(_msgSender(), 10000000 * 10**decimals());
	}

	function decimals() public pure override returns (uint8) {
		return 6;
	}

	function pause() external onlyOwner {
		_pause();
	}

	function unpause() external onlyOwner {
		_unpause();
	}

	function mint(address to, uint256 amount) external onlyOwner {
		_mint(to, amount);
	}

	function setFaucetAllowedAmount(uint256 newAmountAllowed) external onlyOwner {
		faucetAllowedAmount = newAmountAllowed * 10**decimals();
	}

	function setLockTime(uint256 newLockTime) external onlyOwner {
		lockTime = newLockTime;
	}

	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 amount
	) internal override whenNotPaused {
		super._beforeTokenTransfer(from, to, amount);
	}

	function requestTokens() external {
		require(block.timestamp > lockTimes[_msgSender()], "Try again later");
		lockTimes[_msgSender()] = block.timestamp + lockTime;
		_mint(_msgSender(), faucetAllowedAmount);
		emit TokensRequested(_msgSender(), faucetAllowedAmount);
	}
}
