//LUCIDAONFTCOLLECTION?
// await verifyContract("MaramaoNftCollection", { address: "0x3d7aCE31707d0dDca4be725aEd99a3873BdFFD3D",
// constructorArguments: ["", "", "0x8c530dB7A0fB68293b009b69Ffd61B407F5eC564"]});


import { ethers } from "hardhat";
import { redemptionFee, servicePid, stakedTokens, tokensForEligibility } from "../config/config";
import { IStakingService } from "../typechain";
import {
    getOrDeployNftCollectionFactory, getOrDeployNftCollateralRetriever,
    getOrDeployLicenseManager,
    getOrDeployFarm,
    getOrDeployfUsdt,
    getOrDeployLucidaoGovernanceReserve,
    getOrDeployLucidaoGovernanceNftReserve,
    getOrDeployFeeManager
} from "./deployFunctions";
import { isDevelopment } from "./utilities";

async function main() {
    const [deployer, timelock] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address} on Network: ${process.env.HARDHAT_NETWORK}`);
    console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);

    if (!isDevelopment()) {
        throw new Error("Check env parameters");
    }

    const fUsdt = await getOrDeployfUsdt(deployer)
    const governanceTreasury = await getOrDeployLucidaoGovernanceReserve(timelock.address);
    const governanceNftTreasury = await getOrDeployLucidaoGovernanceNftReserve(timelock.address);
    const stakingFarm = await getOrDeployFarm(fUsdt, stakedTokens);

    // license manager
    const licenseManager = await getOrDeployLicenseManager(stakingFarm as IStakingService,
        servicePid,
        tokensForEligibility);

    // collection factory
    const nftCollectionFactory = await getOrDeployNftCollectionFactory(deployer,
        licenseManager,
        governanceNftTreasury);

    // fee manager
    const feeManager = await getOrDeployFeeManager(deployer,
        governanceTreasury,
        licenseManager,
        redemptionFee)

    // DEPLOY PROXIED COLLATERAL RETRIEVER
    const collateralRetriever = await getOrDeployNftCollateralRetriever(deployer,
        nftCollectionFactory,
        feeManager);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });