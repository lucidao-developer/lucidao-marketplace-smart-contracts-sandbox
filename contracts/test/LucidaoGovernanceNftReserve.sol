// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract LucidaoGovernanceNftReserve is Context, ERC721Holder, Ownable {
	event NftReceived(address indexed collectionAddress, address indexed from, address operator, uint256 tokenId);

	function approveToken(
		address nftContract,
		address to,
		uint256 tokenId
	) external onlyOwner {
		ERC721(nftContract).approve(to, tokenId);
	}

	function onERC721Received(
		address operator,
		address from,
		uint256 tokenId,
		bytes memory data
	) public override(ERC721Holder) returns (bytes4) {
		bytes4 result = super.onERC721Received(operator, from, tokenId, data);
		emit NftReceived(msg.sender, from, operator, tokenId);
		return result;
	}

	function transferEth(address payable recipient, uint256 amount) external onlyOwner {
		if (amount > 0) {
			(bool success, ) = recipient.call{ value: amount }("");
			require(success, "Native token transfer failed");
		}
	}
}
