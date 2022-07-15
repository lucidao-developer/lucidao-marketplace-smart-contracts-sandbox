// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../interfaces/IStakingService.sol";

contract TestFarm is IStakingService {
	uint256 private immutable _stakedTokens;
	address private immutable _stakingToken;

	constructor(address stakingToken, uint256 stakedTokens) {
		_stakingToken = stakingToken;
		_stakedTokens = stakedTokens;
	}

	function userInfo(uint256 pid, address user) external view returns (uint256) {
		return _stakedTokens;
	}

	function poolInfo(uint256 pid) external view returns (PoolInfo memory) {
		// address stakingToken;
		uint256 stakingTokenTotalAmount = 1000;
		uint256 accLCDPerShare = 1000;
		uint32 lastRewardTime = uint32(block.number);
		uint16 allocPoint = 10;
		PoolInfo memory _poolInfo = PoolInfo(_stakingToken, stakingTokenTotalAmount, accLCDPerShare, lastRewardTime, allocPoint);
		return _poolInfo;
	}
}
