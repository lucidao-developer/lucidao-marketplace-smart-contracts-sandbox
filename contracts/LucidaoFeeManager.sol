// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IFeeManager.sol";
import "./interfaces/ILicenseManager.sol";

contract LucidaoFeeManager is Initializable, OwnableUpgradeable, IFeeManager {
	using SafeERC20Upgradeable for IERC20Upgradeable;
	address internal constant NATIVE_TOKEN_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
	bytes4 private constant FEE_CALLBACK_MAGIC_BYTES = this.receiveZeroExFeeCallback.selector;
	uint256 public constant MAX_REDEMPTION_FEE = 1e18;

	mapping(address => bool) public userDiscount;
	mapping(address => mapping(uint256 => bool)) public redemptionFeesPaid;

	address public governanceTreasury;
	address public licenseManager;

	uint256 public redemptionFee;

	event FeeReceived(address indexed tokenAddress, uint256 amount, bytes feeData);
	event RebateReceived(address indexed receiver, address indexed tokenAddress, uint256 amount, bytes feeData);
	event GovernanceTreasuryChanged(address indexed governanceTreasury);
	event LicenseManagerChanged(address indexed licenseManager);
	event Received(address, uint256);
	event RedemptionFeePaid(address indexed nftCollection, uint256 indexed tokenId, address sender, uint256 fee);
	event RedemptionFeeSet(uint256 indexed redemptionFee);

	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() initializer {}

	function initialize(
		address _governanceTreasury,
		address _licenseManager,
		uint256 _redemptionFee
	) public initializer {
		require(_governanceTreasury != address(0), "Cannot be null address");
		require(_licenseManager != address(0), "Cannot be null address");
		__LucidaoFeeManager_init(_governanceTreasury, _licenseManager, _redemptionFee);
	}

	function __LucidaoFeeManager_init(
		address _governanceTreasury,
		address _licenseManager,
		uint256 _redemptionFee
	) internal onlyInitializing {
		__Ownable_init_unchained();
		__LucidaoFeeManager_init_unchained(_governanceTreasury, _licenseManager, _redemptionFee);
	}

	function __LucidaoFeeManager_init_unchained(
		address _governanceTreasury,
		address _licenseManager,
		uint256 _redemptionFee
	) internal onlyInitializing {
		governanceTreasury = _governanceTreasury;
		licenseManager = _licenseManager;
		redemptionFee = _redemptionFee;
	}

	function receiveZeroExFeeCallback(
		address tokenAddress,
		uint256 amount,
		bytes calldata feeData
	) external override returns (bytes4 success) {
		uint256 finalAmount = amount;
		uint256 discount = ILicenseManager(licenseManager).getDiscount(tx.origin);

		if (discount > 0) {
			uint256 rebateAmount = (amount * discount) / 10000;
			finalAmount = amount - rebateAmount;
			_payoutFees(tx.origin, tokenAddress, rebateAmount);
			emit RebateReceived(tx.origin, tokenAddress, rebateAmount, feeData);
		}

		_payoutFees(governanceTreasury, tokenAddress, finalAmount);
		emit FeeReceived(tokenAddress, finalAmount, feeData);
		return FEE_CALLBACK_MAGIC_BYTES;
	}

	function setGovernanceTreasury(address _governanceTreasury) external onlyOwner {
		require(_governanceTreasury != address(0), "Cannot be null address");
		governanceTreasury = _governanceTreasury;
		emit GovernanceTreasuryChanged(_governanceTreasury);
	}

	function setLicenseManager(address _licenseManager) external onlyOwner {
		require(_licenseManager != address(0), "Cannot be null address");
		licenseManager = _licenseManager;
		emit LicenseManagerChanged(_licenseManager);
	}

	function _transferEth(address payable recipient, uint256 amount) internal {
		if (amount > 0) {
			(bool success, ) = recipient.call{ value: amount }("");
			require(success, "Native token transfer failed");
		}
	}

	function _payoutFees(
		address recipient,
		address tokenAddress,
		uint256 amount
	) internal {
		if (tokenAddress == NATIVE_TOKEN_ADDRESS) {
			_transferEth(payable(recipient), amount);
		} else {
			IERC20Upgradeable(tokenAddress).safeTransfer(recipient, amount);
		}
	}

	receive() external payable {
		emit Received(msg.sender, msg.value);
	}

	function isRedemptionFeePaid(address nftCollection, uint256 tokenId) external view returns (bool feePaid) {
		if (redemptionFee == 0) {
			return true;
		}
		return redemptionFeesPaid[nftCollection][tokenId];
	}

	function payRedemptionFee(address nftCollection, uint256 tokenId) external payable {
		require(msg.value >= redemptionFee, "Fee import incorrect");
		redemptionFeesPaid[nftCollection][tokenId] = true;
		_payoutFees(governanceTreasury, NATIVE_TOKEN_ADDRESS, msg.value);

		emit FeeReceived(NATIVE_TOKEN_ADDRESS, msg.value, "0x");
		emit RedemptionFeePaid(nftCollection, tokenId, msg.sender, msg.value);
	}

	function setRedemptionFee(uint256 _redemptionFee) external onlyOwner {
		require(_redemptionFee < MAX_REDEMPTION_FEE, "redemption fee too high");
		redemptionFee = _redemptionFee;

		emit RedemptionFeeSet(_redemptionFee);
	}
}
