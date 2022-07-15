pragma solidity ^0.8.9;

interface ICollectionWhitelistChecker {
    function canList(uint256 _tokenId) external view returns (bool);
}
