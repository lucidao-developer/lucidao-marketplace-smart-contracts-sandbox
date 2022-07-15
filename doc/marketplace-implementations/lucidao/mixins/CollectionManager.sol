// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import { IERC165, IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

abstract contract CollectionManager is AccessControlUpgradeable {
	using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

	EnumerableSetUpgradeable.AddressSet private _collectionAddressSet;

	mapping(address => Collection) internal _collections;

	enum CollectionStatus {
		Pending,
		Open,
		Close
	}

	struct Collection {
		CollectionStatus status; // status of the collection
		address creatorAddress; // address of the creator
	}

	event CollectionWhitelisted(address indexed collection, address indexed creator);
	event CollectionClose(address indexed collection);

	function whitelistCollection(address _collection, address _creator) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(!_collectionAddressSet.contains(_collection), "Operations: Collection already listed");
		require(IERC165(_collection).supportsInterface(type(IERC721).interfaceId), "Operations: Not ERC721");

		require(_creator == address(0), "Operations: Creator parameters incorrect");

		_collectionAddressSet.add(_collection);

		_collections[_collection] = Collection({ status: CollectionStatus.Open, creatorAddress: _creator });

		emit CollectionWhitelisted(_collection, _creator);
	}

	function closeCollection(address _collection) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(_collectionAddressSet.contains(_collection), "Operations: Collection not listed");

		_collections[_collection].status = CollectionStatus.Close;
		_collectionAddressSet.remove(_collection);

		emit CollectionClose(_collection);
	}

	function viewCountCollections() external view returns (uint256) {
		return _collectionAddressSet.length();
	}

	function viewCollections(uint256 cursor, uint256 size)
		external
		view
		returns (
			address[] memory collectionAddresses,
			Collection[] memory collectionDetails,
			uint256
		)
	{
		uint256 length = size;

		if (length > _collectionAddressSet.length() - cursor) {
			length = _collectionAddressSet.length() - cursor;
		}

		collectionAddresses = new address[](length);
		collectionDetails = new Collection[](length);

		for (uint256 i = 0; i < length; i++) {
			collectionAddresses[i] = _collectionAddressSet.at(cursor + i);
			collectionDetails[i] = _collections[collectionAddresses[i]];
		}

		return (collectionAddresses, collectionDetails, cursor + length);
	}

	uint256[500] private ______gap;
}
