import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MaramaoNftCollection
} from "../../typechain";
import { ContractReceipt } from "ethers";

export async function mintTestNft(nftCollection: MaramaoNftCollection, tokenUri: string, minter: SignerWithAddress): Promise<ContractReceipt> {
    const nftTransaction = await nftCollection.connect(minter).safeMint(tokenUri);
    const transactionReceipt = await nftTransaction.wait();
    return transactionReceipt;
  }