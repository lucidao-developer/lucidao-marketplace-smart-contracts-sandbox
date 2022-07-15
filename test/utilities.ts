import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Network } from "hardhat/types";
import { isDevelopment, testRunningInHardhat } from "../scripts/utilities";
import { AnyswapV3ERC20 } from "../typechain";
import { BigNumber } from "ethers";
import { ZERO_ADDRESS } from "../config/config";
import { concat, hexlify, toUtf8Bytes } from "ethers/lib/utils";

export function checkSkipTest(skipFlag: boolean, context: Mocha.Context) {
    if (skipFlag) {
        context.skip();
    }
}

export async function resetNetwork(network: Network) {
    if (isDevelopment() && (process.env.HARDHAT_NETWORK || process.env.HARDHAT_NETWORK == "localhost")) {
        await network.provider.send("hardhat_reset");
    }
}

export async function setSnapshot(network: Network): Promise<Uint8Array | undefined> {
    if (testRunningInHardhat()) {
        return network.provider.send("evm_snapshot");
    }
    return Promise.resolve(undefined);
}

export async function restoreSnapshot(network: Network, snapshot: Uint8Array | undefined) {
    if (testRunningInHardhat()) {
        await network.provider.send("evm_revert", [snapshot]);
    }
}

export function getUnixEpoch(minutes: number) {
    return Math.round((new Date().getTime() + (1000 * 60 * minutes)) / 1000);
}

export async function setNetworkTimestampTo(timestamp: number) {
    await ethers.provider.send("evm_mine", [timestamp]);
    // await network.provider.send("evm_increaseTime", [3600])
    // await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp
    // await network.provider.send("evm_setNextBlockTimestamp", [1625097600])
    // await network.provider.send("evm_mine") // this one will have 2021-07-01 12:00 AM as its timestamp, no matter what the previous block has
}

export async function getCurrentChainTimestamp(){
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return blockBefore.timestamp;
}

export async function resetfUsdtBalanceForSigner(fUsdt: AnyswapV3ERC20, signer: SignerWithAddress) {
    let balance = await fUsdt.balanceOf(signer.address);
    await (await fUsdt.connect(signer).transfer(ZERO_ADDRESS, balance)).wait();
    console.log(`Trashed ${balance} fUSDT for address ${signer.address}`);
}

export async function mintBigNumberfUsdtTo(fUsdt: AnyswapV3ERC20, address: string, qty: BigNumber) {
    await (await fUsdt.mint(address, qty)).wait();
    console.log(`Transferred ${qty.toString()} fUSDT to ${address}`);
}

export async function mintfUsdtTo(fUsdt: AnyswapV3ERC20, address: string, qty: string) {
    await (await fUsdt.mint(address, ethers.utils.parseUnits(qty, 6))).wait();
    console.log(`Transferred ${qty.toString()} fUSDT to ${address}`);
}

export function toBytes1(text: string): string {
    const bytes = toUtf8Bytes(text);

    if (bytes.length != 1) {
        throw new Error("bytes1 string must be less of 1 bytes");
    }

    return hexlify(bytes);
}