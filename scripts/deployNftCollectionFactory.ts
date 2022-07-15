import { ethers } from "hardhat";
import { licenseManagerAddress, governanceNftReserveAddress } from "../config/config";
import { getOrDeployNftCollectionFactory } from "./deployFunctions";

async function main() {
  const [deployer] = await ethers.getSigners();
  const licenseManager = await ethers.getContractAt("LucidaoLicenseManager",
    licenseManagerAddress);
  const governanceNftTreasury = await ethers.getContractAt("LucidaoGovernanceNftReserve",
    governanceNftReserveAddress);
  await getOrDeployNftCollectionFactory(deployer, licenseManager, governanceNftTreasury.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
