// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../../interfaces/INftCollectionVaultService.sol";
import "../../LucidaoNftCollection.sol";

contract LucidaoNftCollectionV2 is LucidaoNftCollection {
	uint256 public immutable sellDeadline;

	constructor(
		string memory _name,
		string memory _symbol,
		address _oracleAddress,
		address _adminAddress,
		address _nftReserveAddress,
		uint256 _minGracePeriod,
		uint256 _insolvencyGracePeriod,
		uint256 _sellDeadline
	) LucidaoNftCollection(_name, _symbol, _oracleAddress, _adminAddress, _nftReserveAddress, _minGracePeriod, _insolvencyGracePeriod) {
		sellDeadline = _sellDeadline;
	}

	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId
	) internal override(LucidaoNftCollection) {
		super._beforeTokenTransfer(from, to, tokenId);
		if (hasRole(MINTER_ROLE, from)) {
			require(block.timestamp <= sellDeadline, "Sell ended");
		}
	}
}
