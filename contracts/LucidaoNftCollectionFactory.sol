// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "./LucidaoNftCollection.sol";
import "./interfaces/ILicenseManager.sol";

//Estendere ERC721 con struct prezzo, costo di custodia e periodo di validità
//Il costi delle fee avviene sempre al transfer (quando avviene il calcolo). Invocazione su license manager?
//ricontrollare logiche burn (_isApprovedOrOwner) - marketplace è operator? setApprovalForAll è listing?

contract LucidaoNftCollectionFactory is Initializable, OwnableUpgradeable {
	using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

	struct CreatedContract {
		LucidaoNftCollection collection; // FIXME: should be ILucidaoNftCollection so that when we upgrade we can keep the interface?
		string symbol;
		string name;
		address oracle;
		bytes1 tokenVersion;
	}

	EnumerableSetUpgradeable.AddressSet private _collectionAddressSet;
	CreatedContract[] public createdContracts;
	address public licenseManager;
	address public nftReserveAddress;
	bytes1 public tokenVersion;

	event CollectionCreated(address indexed contractAddress, string collectionName, string collectionSymbol, address collectionOracle);
	event LicenseManagerChanged(address indexed licenseManager);
	event NftReserveAddressChanged(address indexed nftReserveAddress);

	// FIXME: latest OpenZeppelin wizard version uses _disableInitializers() in constructor body and drops initializer keyword, replicate?
	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() initializer {}

	function initialize(address _licenseManager, address _nftReserveAddress) public initializer {
		require(_licenseManager != address(0), "Cannot be null address");
		require(_nftReserveAddress != address(0), "Cannot be null address");
		__LucidaoNftCollectionFactory_init(_licenseManager, _nftReserveAddress);
	}

	function __LucidaoNftCollectionFactory_init(address _licenseManager, address _nftReserveAddress) internal onlyInitializing {
		__Ownable_init_unchained();
		__LucidaoNftCollectionFactory_init_unchained(_licenseManager, _nftReserveAddress);
	}

	function __LucidaoNftCollectionFactory_init_unchained(address _licenseManager, address _nftReserveAddress) internal onlyInitializing {
		licenseManager = _licenseManager;
		nftReserveAddress = _nftReserveAddress;
		tokenVersion = "1";
	}

	function createCollection(
		string memory _name,
		string memory _symbol,
		address _oracle,
		uint256 _minGracePeriod,
		uint256 _insolvencyGracePeriod
	) external onlyOwner {
		require(_oracle != address(0), "Invalid Oracle");
		require(_insolvencyGracePeriod >= _minGracePeriod, "Grace period too short");

		require(ILicenseManager(licenseManager).isAQualifiedOracle(_oracle), "Requirements to become oracle not met");

		LucidaoNftCollection collection = new LucidaoNftCollection(
			_name,
			_symbol,
			_oracle,
			msg.sender,
			nftReserveAddress,
			_minGracePeriod,
			_insolvencyGracePeriod
		);

		CreatedContract memory newContract = CreatedContract(collection, _symbol, _name, _oracle, tokenVersion);

		createdContracts.push(newContract);
		_collectionAddressSet.add(address(collection));

		emit CollectionCreated(address(collection), _name, _symbol, _oracle);
	}

	function setLicenseManager(address _licenseManager) external onlyOwner {
		require(_licenseManager != address(0), "Cannot be null address");
		licenseManager = _licenseManager;
		emit LicenseManagerChanged(_licenseManager);
	}

	function setNftReserveAddress(address _nftReserveAddress) external onlyOwner {
		require(_nftReserveAddress != address(0), "Cannot be null address");
		nftReserveAddress = _nftReserveAddress;
		emit NftReserveAddressChanged(_nftReserveAddress);
	}

	function isAKnownCollection(address collectionAddress) external view returns (bool) {
		return _collectionAddressSet.contains(collectionAddress);
	}

	function createdContractCount() external view returns (uint256) {
		return _collectionAddressSet.length();
	}
}
