// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStakingService {
	struct PoolInfo {
		address stakingToken; //FIXME: IERC20?
		uint256 stakingTokenTotalAmount;
		uint256 accLCDPerShare;
		uint32 lastRewardTime;
		uint16 allocPoint;
	}

	function userInfo(uint256 pid, address user) external view returns (uint256 stakedTokens);

	function poolInfo(uint256 pid) external view returns (PoolInfo memory poolInfo);
}
