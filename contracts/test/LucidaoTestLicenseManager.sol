// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../LucidaoLicenseManager.sol";

contract LucidaoTestLicenseManager is LucidaoLicenseManager {
	constructor(
		address _stakingService,
		uint256 _stakingServicePid,
		uint256 _stakedTokensForOracleEligibility
	) LucidaoLicenseManager(_stakingService, _stakingServicePid, _stakedTokensForOracleEligibility) {}

	function isAQualifiedOracle(address oracle) external view override returns (bool possibility) {
		return false;
	}
}
