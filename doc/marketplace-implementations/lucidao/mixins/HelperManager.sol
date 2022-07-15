// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

abstract contract HelperManager is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
	using AddressUpgradeable for address;
	using AddressUpgradeable for address payable;
	using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
	using SafeERC20Upgradeable for IERC20Upgradeable;

	mapping(address => EnumerableSetUpgradeable.UintSet) private _askTokenIds;

	address public wFTM;
	address payable public treasury;

	event NonFungibleTokenRecovery(address indexed token, uint256 indexed tokenId);
	event TokenRecovery(address indexed token, uint256 amount);

	function _initializeHelperManager(address _wFTMAddress, address payable _treasuryAddress) internal onlyInitializing {
		require(_wFTMAddress.isContract(), "FoundationTreasuryNode: Address is not a contract");
		require(_treasuryAddress.isContract(), "FoundationTreasuryNode: Address is not a contract");
		wFTM = _wFTMAddress;
		treasury = _treasuryAddress;
	}

	function recoverFungibleTokens(address _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(_token != wFTM, "Operations: Cannot recover wFTM");
		uint256 amountToRecover = IERC20Upgradeable(_token).balanceOf(address(this));
		require(amountToRecover != 0, "Operations: No token to recover");

		IERC20Upgradeable(_token).safeTransfer(address(msg.sender), amountToRecover);

		emit TokenRecovery(_token, amountToRecover);
	}

	function recoverNonFungibleToken(address _token, uint256 _tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
		require(!_askTokenIds[_token].contains(_tokenId), "Operations: NFT not recoverable");
		IERC721(_token).safeTransferFrom(address(this), address(msg.sender), _tokenId);

		emit NonFungibleTokenRecovery(_token, _tokenId);
	}

	uint256[500] private ______gap;
}
