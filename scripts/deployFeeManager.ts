import { ethers } from "hardhat";
import { governanceTreasuryAddress, licenseManagerAddress, redemptionFee } from "../config/config";
import { getOrDeployFeeManager } from "./deployFunctions";

async function main() {
    const [deployer] = await ethers.getSigners();
    const governanceTreasury = await ethers.getContractAt("LucidaoGovernanceReserve", governanceTreasuryAddress!);
    const licenseManager = await ethers.getContractAt("LucidaoLicenseManager", licenseManagerAddress!);
    await getOrDeployFeeManager(deployer, governanceTreasury, licenseManager, redemptionFee!);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
