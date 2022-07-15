// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/INftCollectionVaultService.sol";

contract LucidaoNftCollection is ERC721URIStorage, ERC721Enumerable, ERC721Burnable, AccessControl, INftCollectionVaultService {
	using Counters for Counters.Counter;

	bytes32 public constant MINTER_ROLE_MANAGER = keccak256("MINTER_ROLE_MANAGER");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
	bytes32 public constant VAULT_MANAGER_ROLE = keccak256("VAULT_MANAGER_ROLE");

	address public immutable oracleAddress;
	address public immutable nftReserveAddress;

	uint256 public immutable minGracePeriod;
	uint256 public insolvencyGracePeriod;

	Counters.Counter private _tokenIdCounter;
	mapping(uint256 => uint256) private _vaultServiceDeadline;
	mapping(address => bool) public whitelistedTransferAddressForMinter;

	event VaultServiceDeadlineSet(uint256 indexed tokenId, uint256 deadline);
	event InsolvencyGracePeriodSet(uint256 indexed insolvencyGracePeriod);
	event Seize(uint256 indexed tokenId);
	//TODO: check if is correct to define nested events
	event NftReceived(address indexed collectionAddress, address indexed from, address operator, uint256 tokenId);

	constructor(
		string memory _name,
		string memory _symbol,
		address _oracleAddress,
		address _adminAddress,
		address _nftReserveAddress,
		uint256 _minGracePeriod,
		uint256 _insolvencyGracePeriod
	) ERC721(_name, _symbol) {
		require(_oracleAddress != address(0), "Cannot be null address");
		require(_nftReserveAddress != address(0), "Cannot be null address");
		require(_insolvencyGracePeriod >= _minGracePeriod, "Grace period too short");

		oracleAddress = _oracleAddress;
		nftReserveAddress = _nftReserveAddress;
		minGracePeriod = _minGracePeriod;
		insolvencyGracePeriod = _insolvencyGracePeriod;
		_setRoleAdmin(MINTER_ROLE, MINTER_ROLE_MANAGER);
		_grantRole(DEFAULT_ADMIN_ROLE, _adminAddress);
		_grantRole(MINTER_ROLE_MANAGER, _oracleAddress);
		_grantRole(MINTER_ROLE, _oracleAddress);
		_grantRole(VAULT_MANAGER_ROLE, _oracleAddress);
		//Whitelist burn address
		whitelistedTransferAddressForMinter[address(0)] = true;
		whitelistedTransferAddressForMinter[_oracleAddress] = true;
	}

	function seize(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
		//TODO: test per token senza deadline
		//TODO: seize callable only for a non-minter owner?
		require(_vaultServiceDeadline[tokenId] > 0, "Service deadline not set");
		require(block.timestamp > _vaultServiceDeadline[tokenId] + insolvencyGracePeriod, "Cannot seize token");
		address tokenOwner = ownerOf(tokenId);

		_safeTransfer(tokenOwner, nftReserveAddress, tokenId, "");
		// _burn(tokenId);

		emit Seize(tokenId);
	}

	function _baseURI() internal pure override returns (string memory) {
		return "ipfs://";
	}

	function safeMint(string memory uri) public onlyRole(MINTER_ROLE) {
		uint256 tokenId = _tokenIdCounter.current();
		_tokenIdCounter.increment();
		_safeMint(oracleAddress, tokenId);
		_setTokenURI(tokenId, uri);
	}

	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId
	) internal virtual override(ERC721, ERC721Enumerable) {
		super._beforeTokenTransfer(from, to, tokenId);
		//hasRole(MINTER_ROLE, from) ||
		if (hasRole(MINTER_ROLE, to)) {
			require(whitelistedTransferAddressForMinter[to], "Cannot transfer token from minter to a not whitelisted address");
		}
	}

	function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
		super._burn(tokenId);
	}

	function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
		return super.tokenURI(tokenId);
	}

	// FIXME: what is the correct chain of overrides? are we losing AccessControl or ERC721Enumerable interface by doing this?
	function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
		return interfaceId == type(INftCollectionVaultService).interfaceId || super.supportsInterface(interfaceId);
	}

	function getVaultServiceDeadline(uint256 tokenId) external view returns (uint256 deadline) {
		return _vaultServiceDeadline[tokenId];
	}

	function setVaultServiceDeadline(uint256 tokenId, uint256 deadline) external onlyRole(VAULT_MANAGER_ROLE) {
		require(deadline > _vaultServiceDeadline[tokenId], "INftCollectionVaultService: new deadline is lower than the current one");
		_vaultServiceDeadline[tokenId] = deadline;
		emit VaultServiceDeadlineSet(tokenId, deadline);
	}

	function addWhitelistAddressesForMinterRole(address[] calldata _addresses) public onlyRole(DEFAULT_ADMIN_ROLE) {
		for (uint256 i = 0; i < _addresses.length; i++) {
			whitelistedTransferAddressForMinter[_addresses[i]] = true;
		}
	}

	function removeAddressesFromWhitelistForMinterRole(address[] calldata _addresses) public onlyRole(DEFAULT_ADMIN_ROLE) {
		for (uint256 i = 0; i < _addresses.length; i++) {
			delete whitelistedTransferAddressForMinter[_addresses[i]];
		}
	}

	function setInsolvencyGracePeriod(uint256 _insolvencyGracePeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(_insolvencyGracePeriod >= minGracePeriod, "Grace period too short");
		insolvencyGracePeriod = _insolvencyGracePeriod;
		emit InsolvencyGracePeriodSet(_insolvencyGracePeriod);
	}
}
