import { ethers } from "hardhat";
import { LucidaoNftCollection } from "../typechain";

async function main() {
  const collection: LucidaoNftCollection = await ethers.getContractAt("LucidaoNftCollection", "0xd67cde86a7ee3ae2904dfdb363a520c3b006401d");
  const transaction = await collection.addWhitelistAddressesForMinterRole(["0xF8c431eB0fb0beD31e54BE70136Bb7826e8F101e"]);
  await transaction.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
