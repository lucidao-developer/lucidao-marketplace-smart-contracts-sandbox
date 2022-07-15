// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../LucidaoFeeManager.sol";
import "../interfaces/IFeeManager.sol";

contract FeeManagerTester {
	using SafeERC20 for IERC20;

	address public feeManager;

	address internal constant NATIVE_TOKEN_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    event FeeReceived(address indexed tokenAddress, uint256 amount, bytes feeData);
	event RebateReceived(address indexed receiver, address indexed tokenAddress, uint256 amount, bytes feeData);
	event Received(address, uint);

	constructor(address _feeManager) {
		feeManager = _feeManager;
	}

	function testReceiveZeroExFeeCallback(
		address tokenAddress,
		uint256 amount,
		bytes calldata feeData
	) external returns (bytes4 success) {
		if (tokenAddress == NATIVE_TOKEN_ADDRESS) {
			_transferEth(payable(feeManager), amount);
		} else {
			IERC20(tokenAddress).safeTransfer(feeManager, amount);
		}
		return IFeeManager(feeManager).receiveZeroExFeeCallback(tokenAddress, amount, feeData);
	}

	function _transferEth(address payable recipient, uint256 amount) internal {
		if (amount > 0) {
			(bool success, ) = recipient.call{ value: amount }("");
			require(success, "Native token transfer failed");
		}
	}

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
