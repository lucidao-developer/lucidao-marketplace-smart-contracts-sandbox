// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ILicenseManager {
	function getDiscount(address user) external view returns (uint256 discount);

	function isAQualifiedOracle(address oracle) external view returns (bool possibility);
}
