// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "../../LucidaoNftCollectionFactory.sol";
import "../../interfaces/INftCollectionVaultService.sol";
import "../../interfaces/IFeeManager.sol";

//FIXME: upgradeability test on actual NftCollateralRetriever!
contract LucidaoNftCollateralRetriever1stImpl is
	Initializable,
	ContextUpgradeable,
	ERC721HolderUpgradeable
	// OwnableUpgradeable
{
	address internal _collectionFactory;
	address internal _platformFeeManager;

	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	event NftBurned(address indexed collectionAddress, address indexed oracleAddress, uint256 tokenId);
	event RedeemRequest(address indexed collectionAddress, address indexed from, address operator, uint256 tokenId);
	// event CollectionFactoryChanged(address indexed collectionFactory);
	// event PlatformFeeManagerChanged(address indexed platformFeeManager);

	modifier onlyMinter(address _nftContract) {
		require(IAccessControl(_nftContract).hasRole(MINTER_ROLE, _msgSender()), "Only Minter can burn NFT");
		_;
	}

	function initialize(address collectionFactory, address platformFeeManager) public initializer {
		__LucidaoNftCollateralRetriever_init(collectionFactory, platformFeeManager);
	}

	function __LucidaoNftCollateralRetriever_init(address collectionFactory, address platformFeeManager) internal initializer {
		__Context_init_unchained();
		__ERC721Holder_init_unchained();
		__LucidaoNftCollateralRetriever_init_unchained(collectionFactory, platformFeeManager);
	}

	function __LucidaoNftCollateralRetriever_init_unchained(address collectionFactory, address platformFeeManager) internal initializer {
		_collectionFactory = collectionFactory;
		_platformFeeManager = platformFeeManager;
	}

	function getCollectionFactory() public view returns (address) {
		return _collectionFactory;
	}

	function burnNft(address _nftContract, uint256 _tokenId) external onlyMinter(_nftContract) {
		require(LucidaoNftCollectionFactory(_collectionFactory).isAKnownCollection(_nftContract), "Unknown collection");
		ERC721Burnable(_nftContract).burn(_tokenId);

		emit NftBurned(_nftContract, _msgSender(), _tokenId);
	}

	function onERC721Received(
		address operator,
		address from,
		uint256 tokenId,
		bytes calldata data
	) public override(ERC721HolderUpgradeable) returns (bytes4) {
		require(LucidaoNftCollectionFactory(_collectionFactory).isAKnownCollection(msg.sender), "Unknown collection");
		uint256 deadline = INftCollectionVaultService(msg.sender).getVaultServiceDeadline(tokenId);
		require(deadline == 0 || deadline > block.timestamp, "Vault service expired");
		require(IFeeManager(_platformFeeManager).isRedemptionFeePaid(msg.sender, tokenId), "Platform fee has not been paid");

		bytes4 result = super.onERC721Received(operator, from, tokenId, data);

		emit RedeemRequest(msg.sender, from, operator, tokenId);

		return result;
	}
}
