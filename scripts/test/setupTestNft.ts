import { ethers } from "hardhat";
import { verifyContract } from "../deployFunctions";
import { getTokenId } from "../../test/common";
import { mintTestNft } from "./utility";

async function main() {
  const [signer, oracle] = await ethers.getSigners();
  const contractName = "MaramaoNftCollection";
  const name = "MaramaoCollection";
  const symbol = "Mrm";

  console.log(`\nDeploying contract ${contractName}`);

  // DEPLOY NFT COLLECTION
  const LucidaoNftCollection = await ethers.getContractFactory(contractName);
  const lucidaoNftCollection = await LucidaoNftCollection.connect(oracle).deploy(name, symbol, oracle.address, signer.address);
  await lucidaoNftCollection.deployed();
  console.log(`${contractName} address: ${lucidaoNftCollection.address}`);

  const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
  const transactionReceipt = await mintTestNft(lucidaoNftCollection, tokenUri, oracle);

  // await lucidaoNftCollection.connect(oracle).transferFrom(oracle.address,
  //   <address>,
  //   getTokenId(transactionReceipt));

  await verifyContract(contractName, { address: lucidaoNftCollection.address,
  constructorArguments: [name, symbol, oracle.address] });

  return lucidaoNftCollection;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
