import { ethers } from "hardhat";
import { deployNftCollection } from "./deployFunctions";

async function main() {
  throw new Error("Forbidden");
  // const signers = await ethers.getSigners();
  // const signer = signers[0];
  // await deployNftCollection("....", "....", signer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
