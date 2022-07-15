// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "./LucidaoNftCollateralRetriever1stImpl.sol";


contract LucidaoNftCollateralRetrieverV3 is
	LucidaoNftCollateralRetriever1stImpl,
	OwnableUpgradeable //ReentrancyGuardUpgradeable
{
	function migration(address signer) external {
		require(address(0) == owner(), "Owner already initialized!");
		_transferOwnership(signer);
	}

	function updateCollectionFactory(address newCollectionFactory) public onlyOwner {
		_collectionFactory = newCollectionFactory;
	}
}
