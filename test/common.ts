import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish, ContractReceipt, Event } from "ethers";
import { ethers } from "hardhat";
import { LucidaoNftCollection, LucidaoNftCollectionFactory } from "../typechain";
import { mintBigNumberfUsdtTo } from "./utilities";

export const TEN_DISCOUNT = "10";
export const ZERO_DISCOUNT = "0";
export const UNINITIALIZE_UINT256 = BigNumber.from("0");

export const feeReceivedEventabi = ["event FeeReceived(address indexed tokenAddress, uint256 amount, bytes feeData)"];
export const rebateReceivedEventabi = ["event RebateReceived(address indexed receiver, address indexed tokenAddress, uint256 amount, bytes feeData)"];
export const nftReceivedEventabi = ["event NftReceived(address indexed collectionAddress, address indexed from, address operator, uint256 tokenId)"];


export async function mintNft(nftCollection: LucidaoNftCollection, tokenUri: string, minter: SignerWithAddress): Promise<ContractReceipt> {
    const nftTransaction = await nftCollection.connect(minter).safeMint(tokenUri);
    const transactionReceipt = await nftTransaction.wait();
    return transactionReceipt;
}

export async function whitelistAddressesForOracleTransferOnNftCollection(nftCollection: LucidaoNftCollection, signer: SignerWithAddress, addresses: string[]) {
    await (await nftCollection.connect(signer).addWhitelistAddressesForMinterRole(addresses)).wait();
}

export async function removeAddressesFromWhitelistedOracleTransferOnNftCollection(nftCollection: LucidaoNftCollection, signer: SignerWithAddress, addresses: string[]) {
    await (await nftCollection.connect(signer).removeAddressesFromWhitelistForMinterRole(addresses)).wait();
}

export function getTokenId(transactionReceipt: ContractReceipt): BigNumberish {
    const transferEvent = transactionReceipt.events?.find((x) => { return x.event == "Transfer" });
    expect(transferEvent).to.not.equal(undefined);
    if (!transferEvent || !transferEvent.args) {
        throw new Error("Error while minting Nft for Oracle")
    }
    return transferEvent.args["tokenId"];
}

export type NftTokenCollection = {
    collectionAddress: string;
    tokenId: BigNumberish;

};

export async function buildScenario1(context: Mocha.Context, signer: SignerWithAddress, nftCollectionFactory: LucidaoNftCollectionFactory, oracle: SignerWithAddress): Promise<NftTokenCollection> {
    const tokenUri = "tokenUri";
    let contractReceipt = await (await nftCollectionFactory.connect(signer).createCollection("watches", "wtch1", context.oracle1.address, context.minGracePeriod, context.insolvencyGracePeriod)).wait();
    const currentContractIdx = (await nftCollectionFactory.createdContractCount()).sub("1");
    const createdContract = await context.nftCollectionFactory.createdContracts(currentContractIdx);
    const nftCollection = await ethers.getContractAt("LucidaoNftCollection", createdContract.collection);
    let transactionReceipt = await mintNft(nftCollection, tokenUri, oracle);
    let tokenId = getTokenId(transactionReceipt);

    return { collectionAddress: createdContract.collection, tokenId: tokenId };
}

export async function testDiscount(context: Mocha.Context, parsedFeeManagerAmount: BigNumber, parsedExpectedRebateAmount: BigNumber, discount: number) {
    mintBigNumberfUsdtTo(context.fUsdt, context.owner1.address, parsedFeeManagerAmount)
    let appliedDiscount = await (await context.nftLicenseManager.connect(context.signer).setDiscount(context.owner1.address,
        discount)
    ).wait();

    //owner balance
    let balance = await context.fUsdt.balanceOf(context.owner1.address);
    expect(balance).to.be.eq(parsedFeeManagerAmount);

    //fee manager balance
    balance = await context.fUsdt.balanceOf(context.nftFeeManager.address);
    expect(balance).to.be.eq(0);

    //governance treasury new balance
    const governanceTreasuryBalance = await context.fUsdt.balanceOf(context.governanceTreasury.address);
    expect(governanceTreasuryBalance).to.be.eq(0);

    const feeTransferred = await (await context.fUsdt.connect(context.owner1).transfer(context.nftFeeManagerTester.address,
        parsedFeeManagerAmount)
    ).wait();

    //owner balance
    balance = await context.fUsdt.balanceOf(context.owner1.address);
    expect(balance).to.be.eq(0);

    //fee manager balance
    balance = await context.fUsdt.balanceOf(context.nftFeeManagerTester.address);
    expect(balance).to.be.eq(parsedFeeManagerAmount);

    const FEE_TOKEN = context.fUsdt.address;
    const testFeeData = ethers.utils.formatBytes32String("text")
    const tx = await context.nftFeeManagerTester.connect(context.owner1).testReceiveZeroExFeeCallback(FEE_TOKEN,
        parsedFeeManagerAmount,
        testFeeData);
    const receipt: ContractReceipt = await tx.wait();

    let iface = new ethers.utils.Interface(feeReceivedEventabi);
    const feeReceived: Event | undefined = receipt.events?.find((x: Event) => { return x.event == "FeeReceived" });
    if (!feeReceived) {
        throw Error("Missing event FeeReceived");
    }
    const feeReceivedEvent = iface.parseLog(feeReceived);
    const { receiver, tokenAddress, amount, feeData } = feeReceivedEvent.args;
    expect(tokenAddress).to.be.equal(FEE_TOKEN);
    expect(amount).to.be.equal(parsedFeeManagerAmount.sub(parsedExpectedRebateAmount));
    expect(testFeeData).to.be.equal(feeData);

    iface = new ethers.utils.Interface(rebateReceivedEventabi);
    const rebateReceived: Event | undefined = receipt.events?.find((x: Event) => { return x.event == "RebateReceived" });
    if (!rebateReceived) {
        throw Error("Missing event RebateReceived");
    }
    const rebateReceivedEvent = iface.parseLog(rebateReceived);
    const rebateReceivedEventArgs = rebateReceivedEvent.args;
    expect(rebateReceivedEventArgs.receiver).to.be.equal(context.owner1.address);
    expect(rebateReceivedEventArgs.tokenAddress).to.be.equal(FEE_TOKEN);
    expect(rebateReceivedEventArgs.amount).to.be.equal(parsedExpectedRebateAmount);
    expect(rebateReceivedEventArgs.feeData).to.be.equal(feeData);

    //governance treasury new balance
    balance = await context.fUsdt.balanceOf(context.governanceTreasury.address);
    expect(balance.add(governanceTreasuryBalance)).to.be.eq(parsedFeeManagerAmount.sub(parsedExpectedRebateAmount));

    //owner new balance
    balance = await context.fUsdt.balanceOf(context.owner1.address);
    expect(balance).to.be.eq(parsedExpectedRebateAmount);
}

export class SOLIDITY_ERROR_MSG {
    public static readonly NOT_TOKEN_OWNER = "ERC721: caller is not token owner nor approved";
    public static readonly ONLY_MINTER_CAN_BURN = "Only Minter can burn NFT";
    public static readonly INVALID_TOKEN = "ERC721: invalid token ID";
    public static readonly CANNOT_TRANSFER = "Cannot transfer token from minter to a not whitelisted address";
    public static readonly NOT_OWNER_CALLER = "Ownable: caller is not the owner";
    public static readonly DEADLINE_NOT_SET = "Service deadline not set";
    public static readonly CANNOT_SEIZE = "Cannot seize token";
    public static readonly INVALID_DISCOUNT = "discount not in accepted range";
    public static readonly INVALID_ORACLE = "Requirements to become oracle not met";
    public static readonly UNKNOWN_COLLECTION = "Unknown collection";

};