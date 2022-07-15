// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ILicenseManager.sol";
import "./interfaces/IStakingService.sol";

contract LucidaoLicenseManager is Ownable, ILicenseManager {
	mapping(address => uint256) public conventions;
	uint256 public constant MIN_DISCOUNT = 0;
	uint256 public constant MAX_DISCOUNT = 9000;
	address public stakingService;
	uint256 public stakingServicePid;
	uint256 public stakedTokensForOracleEligibility;

	event DiscountSet(address indexed user, uint256 discount);
	event StakingServiceSet(address indexed stakingService);
	event StakingServicePidSet(uint256 indexed pid);
	event StakedTokensForOracleEligibilitySet(uint256 indexed amount);

	constructor(
		address _stakingService,
		uint256 _stakingServicePid,
		uint256 _stakedTokensForOracleEligibility
	) {
		require(_stakingService != address(0), "Cannot be null address");

		stakingService = _stakingService;
		stakingServicePid = _stakingServicePid;
		stakedTokensForOracleEligibility = _stakedTokensForOracleEligibility;
	}

	function getDiscount(address user) external view override returns (uint256 discount) {
		return conventions[user];
	}

	function setDiscount(address user, uint256 discount) external onlyOwner {
		require(discount > MIN_DISCOUNT && discount <= MAX_DISCOUNT, "discount not in accepted range");
		conventions[user] = discount;
		emit DiscountSet(user, discount);
	}

	function isAQualifiedOracle(address oracle) external view virtual returns (bool possibility) {
		uint256 stakedTokens = IStakingService(stakingService).userInfo(stakingServicePid, oracle);
		if (stakedTokens < stakedTokensForOracleEligibility) return false;
		return true;
	}

	// TODO: merge setStakingService and setStakingServicePid in onle function
	function setStakingService(address _stakingService) external onlyOwner {
		require(_stakingService != address(0), "Cannot be null address");
		stakingService = _stakingService;
		emit StakingServiceSet(_stakingService);
	}

	function setStakingServicePid(uint256 _pid) external onlyOwner {
		IStakingService.PoolInfo memory poolInfo = IStakingService(stakingService).poolInfo(_pid);
		require(poolInfo.stakingToken != address(0), "pool id not valid");
		stakingServicePid = _pid;
		emit StakingServicePidSet(_pid);
	}

	function setStakedTokensForOracleEligibility(uint256 _amount) external onlyOwner {
		stakedTokensForOracleEligibility = _amount;
		emit StakedTokensForOracleEligibilitySet(_amount);
	}
}
