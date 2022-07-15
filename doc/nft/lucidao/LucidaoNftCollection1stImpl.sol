// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LucidaoNftCollection1stImpl is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
	using Counters for Counters.Counter;

	Counters.Counter private _tokenIdCounter;

	constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

	function _baseURI() internal pure override returns (string memory) {
		return "ipfs://";
	}

	// FIXME: upgradable????
	// FIXME: price
	// TODO: add roles to make approved workers able to mint NFTs in behalf of the Oracle. address to MUST be the Oracle itself though
	function safeMint(address to, string memory uri) public onlyOwner {
		uint256 tokenId = _tokenIdCounter.current();
		_tokenIdCounter.increment();
		_safeMint(to, tokenId);
		_setTokenURI(tokenId, uri);
	}

	// function createToken(string memory tokenURI) public returns (uint) {
	//     _tokenIds.increment();
	//     uint256 newItemId = _tokenIds.current();

	//     _mint(msg.sender, newItemId);
	//     _setTokenURI(newItemId, tokenURI);

	//     return newItemId;
	// }

	function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
		super._burn(tokenId);
	}

	function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
		return super.tokenURI(tokenId);
	}
}
