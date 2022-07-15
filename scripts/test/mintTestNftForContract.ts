import { ethers } from "hardhat";

import { getTokenId } from "../../test/common";
import { mintTestNft } from "./utility";

async function main() {
  const signers = await ethers.getSigners();
  const oracle = signers[0];
  const contractName = "MaramaoNftCollection";
  const contractAddress = "";

  console.log(`\Get Contract ${contractName} at ${contractName}`);
  const lucidaoNftCollection = await ethers.getContractAt("LucidaoNftCollection", contractAddress);

  const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
  const transactionReceipt = await mintTestNft(lucidaoNftCollection, tokenUri, oracle);

  // await lucidaoNftCollection.connect(oracle).transferFrom(oracle.address,
  //   "address",
  //   getTokenId(transactionReceipt));
  console.log(`Minted nft ${getTokenId(transactionReceipt)}`)

  return lucidaoNftCollection;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
