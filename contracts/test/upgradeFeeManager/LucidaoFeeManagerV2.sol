// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../../interfaces/IFeeManager.sol";
import "../../interfaces/ILicenseManager.sol";
import "../../LucidaoFeeManager.sol";


contract LucidaoFeeManagerV2 is LucidaoFeeManager, AccessControlUpgradeable {
	bool private contractAlreadyMigrated;
	bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
	bytes32 public constant LICENSE_ROLE = keccak256("LICENSE_ROLE");

	modifier onlyOnce() {
		require(!contractAlreadyMigrated, "Function already executed");
		_;
	}

	function migration() external onlyOnce {
		contractAlreadyMigrated = true;
		_grantRole(DEFAULT_ADMIN_ROLE, tx.origin);
	}

	function setGovernanceTreasuryForRole(address _governanceTreasury) external onlyRole(GOVERNANCE_ROLE) {
		require(_governanceTreasury != address(0), "Cannot be null address");
		governanceTreasury = _governanceTreasury;
		emit GovernanceTreasuryChanged(_governanceTreasury);
	}

	function setLicenseManagerForRole(address _licenseManager) external onlyRole(LICENSE_ROLE) {
		require(_licenseManager != address(0), "Cannot be null address");
		licenseManager = _licenseManager;
		emit LicenseManagerChanged(_licenseManager);
	}
}
