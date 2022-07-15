// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (security/Pausable.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism for token transfer that can be triggered by an authorized account.
 *
 * This module is used through inheritance.
 */
abstract contract ERC721TokenPausable is Context {
    /**
     * @dev Emitted when the token pause is triggered by `account`.
     */
    event TokenPaused(address account, uint256 tokenId);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event TokenUnpaused(address account, uint256 tokenId);

    // Mapping owner address to token pause flag
    mapping(uint256 => bool) private _pausedTokens;


    // /**
    //  * @dev Initializes the contract
    //  */
    // constructor() {
    // }

    /**
     * @dev Returns true if the token is paused, and false otherwise.
     */
    function tokenPaused(uint256 tokenId) public view virtual returns (bool) {
        return _pausedTokens[tokenId];
    }

    /**
     * @dev Modifier to make a function callable only when the token is not paused.
     *
     * Requirements:
     *
     * - The token must not be paused.
     */
    modifier whenTokenNotPaused(uint256 tokenId) {
        require(!tokenPaused(tokenId), "Token paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the token is paused.
     *
     * Requirements:
     *
     * - The token must be paused.
     */
    modifier whenTokenPaused(uint256 tokenId) {
        require(tokenPaused(tokenId), "Pausable: not paused");
        _;
    }

    /**
     * @dev Triggers token stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pauseToken(uint256 tokenId) internal virtual whenTokenNotPaused(tokenId) {
        _pausedTokens[tokenId] = true;
        emit TokenPaused(_msgSender(), tokenId);
    }

    /**
     * @dev Returns token to normal state.
     *
     * Requirements:
     *
     * - The token must be paused.
     */
    function _unpauseToken(uint256 tokenId) internal virtual whenTokenPaused(tokenId) {
        _pausedTokens[tokenId] = false;
        emit TokenPaused(_msgSender(), tokenId);
    }
}
