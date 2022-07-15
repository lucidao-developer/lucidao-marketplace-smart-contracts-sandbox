// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "./mixins/CollectionManager.sol";
import "./mixins/CurrencyManager.sol";
import "./mixins/HelperManager.sol";
import "./mixins/RoyaltyFeeManager.sol";

contract LucidaoNftMarketplace is ERC721HolderUpgradeable, CollectionManager, CurrencyManager, RoyaltyFeeManager, HelperManager {
	function initialize(address _wFTMAddress, address payable _treasuryAddress) public initializer {
		HelperManager._initializeHelperManager(_wFTMAddress, _treasuryAddress);
	}
}
