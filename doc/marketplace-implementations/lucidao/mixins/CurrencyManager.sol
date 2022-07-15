// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

abstract contract CurrencyManager is AccessControlUpgradeable {
	using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

	EnumerableSetUpgradeable.AddressSet private _whitelistedCurrencySet;

	event CurrencyRemoved(address indexed currency);
	event CurrencyWhitelisted(address indexed currency);

	function addCurrency(address currency) external onlyRole(DEFAULT_ADMIN_ROLE) {
		// TODO: require currency is ERC20
		// TODO: add decimals? or does every stable has 6 decimals?
		require(!_whitelistedCurrencySet.contains(currency), "Currency: Already whitelisted");
		_whitelistedCurrencySet.add(currency);

		emit CurrencyWhitelisted(currency);
	}

	function removeCurrency(address currency) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(_whitelistedCurrencySet.contains(currency), "Currency: Not whitelisted");
		_whitelistedCurrencySet.remove(currency);

		emit CurrencyRemoved(currency);
	}

	function isCurrencyWhitelisted(address currency) external view returns (bool) {
		return _whitelistedCurrencySet.contains(currency);
	}

	function viewCountWhitelistedCurrencies() external view returns (uint256) {
		return _whitelistedCurrencySet.length();
	}

	function viewWhitelistedCurrencies(uint256 cursor, uint256 size) external view returns (address[] memory whitelistedCurrencies, uint256) {
		uint256 length = size;

		if (length > _whitelistedCurrencySet.length() - cursor) {
			length = _whitelistedCurrencySet.length() - cursor;
		}

		whitelistedCurrencies = new address[](length);

		for (uint256 i = 0; i < length; i++) {
			whitelistedCurrencies[i] = _whitelistedCurrencySet.at(cursor + i);
		}

		return (whitelistedCurrencies, cursor + length);
	}

	uint256[500] private ______gap;
}
