// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface INftCollectionVaultService {
	function getVaultServiceDeadline(uint256 tokenId) external view returns (uint256 deadline);

	function setVaultServiceDeadline(uint256 tokenId, uint256 deadline) external;
}
