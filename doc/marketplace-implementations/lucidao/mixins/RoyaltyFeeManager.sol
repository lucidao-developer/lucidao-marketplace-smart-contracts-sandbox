// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// TODO: define only IRoyaltyInfo and ISupportsInterface instead of importing the whole standard?
import { IERC165, IERC2981 } from "@openzeppelin/contracts/interfaces/IERC2981.sol";

abstract contract RoyaltyFeeManager {
	function _getFees(
		address collection,
		uint256 tokenId,
		uint256 amount
	) internal view returns (address receiver, uint256 royaltyAmount) {
		if (IERC165(collection).supportsInterface(type(IERC2981).interfaceId)) {
			(receiver, royaltyAmount) = IERC2981(collection).royaltyInfo(tokenId, amount);
			return (receiver, royaltyAmount);
		}
	}

	uint256[500] private ______gap;
}
