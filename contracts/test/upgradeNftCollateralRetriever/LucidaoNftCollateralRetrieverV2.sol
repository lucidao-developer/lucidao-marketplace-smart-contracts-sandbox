// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "../../LucidaoNftCollectionFactory.sol";

contract LucidaoNftCollateralRetrieverV2 is
	Initializable,
	ContextUpgradeable,
	ERC721HolderUpgradeable
{
	address internal _collectionFactory;
	address internal _platformFeeManager;

	address private _owner;

	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	event NftBurned(address indexed collectionAddress, address indexed oracleAddress, uint256 tokenId);
	event RedeemRequest(address indexed collectionAddress, address indexed from, address operator, uint256 tokenId);

	modifier onlyMinter(address _nftContract) {
		require(IAccessControl(_nftContract).hasRole(MINTER_ROLE, _msgSender()), "Only Minter can burn NFT");
		_;
	}

	function initialize(address collectionFactory) public initializer {
		__LucidaoNftCollateralRetriever_init(collectionFactory);
	}

	function __LucidaoNftCollateralRetriever_init(address collectionFactory) internal initializer {
		__Context_init_unchained();
		__ERC721Holder_init_unchained();
		//__Ownable_init_unchained();
		__LucidaoNftCollateralRetriever_init_unchained(collectionFactory);
	}

	function __LucidaoNftCollateralRetriever_init_unchained(address collectionFactory) internal initializer {
		_collectionFactory = collectionFactory;
	}

	function setOwner(address ownerAddress) public {
		//https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/62
		require(_owner == address(0), "owner already initialized!");
		_owner = ownerAddress;
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
		bytes4 result = super.onERC721Received(operator, from, tokenId, data);
		emit RedeemRequest(msg.sender, from, operator, tokenId);
		return result;
	}

	function owner() public view virtual returns (address) {
		return _owner;
	}

	modifier onlyOwner() {
		require(owner() == _msgSender(), "Ownable: caller is not the owner");
		_;
	}

	function updateCollectionFactory(address newCollectionFactory) public onlyOwner {
		_collectionFactory = newCollectionFactory;
	}
}
