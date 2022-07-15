// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./CollectionManager.sol";

abstract contract SaleManager is ReentrancyGuardUpgradeable, CollectionManager {
	uint256 public minimumAskPrice;
	uint256 public maximumAskPrice;

	function createAskOrder(
		address _collection,
		uint256 _tokenId,
		uint256 _askPrice
	) external nonReentrant {
		// Verify price is not too low/high
		require(_askPrice >= minimumAskPrice && _askPrice <= maximumAskPrice, "Order: Price not within range");

		// Verify collection is accepted
		require(_collections[_collection].status == CollectionStatus.Open, "Collection: Not for listing");

		// TODO: check if sender can list on the marketplace? can also be done on nfttransfer
		// require(_canTokenBeListed(_collection, _tokenId, _msgSender()), "Order: tokenId not eligible");

		// Transfer NFT to this contract
		IERC721(_collection).safeTransferFrom(address(msg.sender), address(this), _tokenId);

		// Adjust the information
		// _tokenIdsOfSellerForCollection[msg.sender][_collection].add(_tokenId);
		// _askDetails[_collection][_tokenId] = Ask({ seller: msg.sender, price: _askPrice });

		// // Add tokenId to the askTokenIds set
		// _askTokenIds[_collection].add(_tokenId);

		// // Emit event
		// emit AskNew(_collection, msg.sender, _tokenId, _askPrice);
	}

	uint256[500] private ______gap;
}
