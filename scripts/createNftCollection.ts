import { ethers } from "hardhat";
import { governanceTreasuryAddress, insolvencyGracePeriod, minGracePeriod, nftCollectionFactoryAddress } from "../config/config";
import { LucidaoNftCollectionFactory } from "../typechain";
import { verifyContract } from "./deployFunctions";

async function main() {
  //TODO: test if new collection are automatically verified!
  const [signer] = await ethers.getSigners();
  console.log(`Creating collection with signer: ${signer.address}`);
  const contractName = "LucidaoNftCollectionFactory";
  const name = "<name>";
  const symbol = "<symbol>";
  const oracle = "<oracle>"

  const contractArgs = [name, symbol, oracle, signer.address, governanceTreasuryAddress, minGracePeriod, insolvencyGracePeriod] as const;

  console.log(`\nCreating collection ${name} on ${contractName} at address ${nftCollectionFactoryAddress}`);
  const collectionFactory: LucidaoNftCollectionFactory = await ethers.getContractAt(contractName, nftCollectionFactoryAddress!);
  const transaction = await collectionFactory.createCollection(name, symbol, oracle, minGracePeriod, insolvencyGracePeriod);
  const receipt = await transaction.wait();
  console.log(receipt);

  const createdContracts = await collectionFactory.createdContracts(0);
  console.log(createdContracts[0]);

  // const abiCoder = new ethers.utils.AbiCoder();
  // const encodedParams = abiCoder.encode([ "string", "string", "address", "address", "address", "uint256", "uint256"], contractArgs);

  // await verifyContract("LucidaoNftCollection",
  //   {
  //     address: a[0],
  //     constructorArguments: contractArgs,
  //     contract: "anonymized-contracts/FakeAltroNftCollection.sol:FakeAltroNftCollection",
  //   });

  //npx hardhat verify --network ropsten 0x3D3Bc8af222F3b5798aD77A2755B3Db7Cc16532b
  //'Watches1' 'wtch1' '0x1C87E11C672A0938e5E4FD1A3FAFDDC2dF539EB5'
  //'0xD10fab07Afd4bF7d6c3F0254051AfAC0736902F2' '0xF93B7aE40b02AbF3FeD5184211Cc387486CDe078'
  //0 86400
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
