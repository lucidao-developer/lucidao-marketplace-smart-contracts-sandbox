import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import { Contract } from "ethers";
import { ethers, network, run, upgrades } from "hardhat";
import {
    farmAddress, feeManagerAddress, fusdtAddress, governanceNftReserveAddress,
    governanceTreasuryAddress, insolvencyGracePeriod, licenseManagerAddress,
    minGracePeriod, nftCollateralRetrieverAddress,
    nftCollectionFactoryAddress, fakeUsdAddress
} from "../config/config";
import {
    AnyswapV3ERC20, FeeManagerTester, IStakingService, LucidaoFeeManager, LucidaoGovernanceNftReserve, LucidaoGovernanceReserve, LucidaoLicenseManager, LucidaoNftCollateralRetriever, LucidaoNftCollection, LucidaoNftCollectionFactory, LucidaoTestLicenseManager,
    TestFarm
} from "../typechain";
import {
    isDevelopment, removeOpenzeppelinProxyFile, skipContractVerify
} from "./utilities";

export async function deployNftCollection(name: string, symbol: string, signer: SignerWithAddress, oracle: string, governanceNftTreasury: string): Promise<LucidaoNftCollection> {
    const contractName = "LucidaoNftCollection";
    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY NFT COLLECTION
    const LucidaoNftCollection = await ethers.getContractFactory(contractName);
    const contractArgs = [name, symbol, oracle, signer.address, governanceNftTreasury, minGracePeriod, insolvencyGracePeriod] as const;
    const lucidaoNftCollection = await LucidaoNftCollection.connect(signer).deploy(...contractArgs);
    await lucidaoNftCollection.deployed();
    console.log(`${contractName} address: ${lucidaoNftCollection.address}`);

    await verifyContract(contractName,
        {
            address: lucidaoNftCollection.address,
            constructorArguments: contractArgs
            // contract: "anonymized-contracts/FakeAltroNftCollection.sol:FakeAltroNftCollection"
        });

    return lucidaoNftCollection;
}

export async function getOrDeployNftCollectionFactory(deployer: SignerWithAddress, licenseManager: LucidaoLicenseManager, governanceNftTreasury: LucidaoGovernanceNftReserve): Promise<LucidaoNftCollectionFactory> {
    const contractName = "LucidaoNftCollectionFactory";

    if (nftCollectionFactoryAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${nftCollectionFactoryAddress}`);
        return await ethers.getContractAt(contractName, nftCollectionFactoryAddress);
    };

    const chainId = await deployer.getChainId();
    removeOpenzeppelinProxyFile(chainId);

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY NFT COLLECTION FACTORY
    const contractArgs = [licenseManager.address, governanceNftTreasury.address];
    const LucidaoNftCollectionFactory = await ethers.getContractFactory(contractName);
    const lucidaoNftCollectionFactory = await upgrades.deployProxy(LucidaoNftCollectionFactory,
        contractArgs, { initializer: 'initialize' }) as LucidaoNftCollectionFactory;
    await lucidaoNftCollectionFactory.deployed();
    console.log(`${contractName} address: ${lucidaoNftCollectionFactory.address}`);

    //await upgrades.admin.transferProxyAdminOwnership(?????);
    const contractParameter = "contracts/LucidaoNftCollectionFactory.sol:LucidaoNftCollectionFactory";
    await verifyProxiedContractImplementation(contractName, lucidaoNftCollectionFactory, contractParameter, contractArgs);
    return lucidaoNftCollectionFactory;
}

export async function getOrDeployNftCollateralRetriever(deployer: SignerWithAddress, nftCollectionFactory: LucidaoNftCollectionFactory, feeManager: LucidaoFeeManager): Promise<LucidaoNftCollateralRetriever> {
    const contractName = "LucidaoNftCollateralRetriever";

    if (nftCollateralRetrieverAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${nftCollateralRetrieverAddress}`);
        return await ethers.getContractAt(contractName, nftCollateralRetrieverAddress);
    };

    const chainId = await deployer.getChainId();
    removeOpenzeppelinProxyFile(chainId);

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY NFT COLLECTION
    const LucidaoNftCollateralRetriever = await ethers.getContractFactory(contractName);
    const contractArgs = [nftCollectionFactory.address, feeManager.address];
    const lucidaoNftCollateralRetriever = await upgrades.deployProxy(LucidaoNftCollateralRetriever, contractArgs, { initializer: 'initialize' }) as LucidaoNftCollateralRetriever;
    await lucidaoNftCollateralRetriever.deployed();
    console.log(`${contractName} address: ${lucidaoNftCollateralRetriever.address}`);

    //await upgrades.admin.transferProxyAdminOwnership(?????);
    const contractParameter = "contracts/LucidaoNftCollateralRetriever.sol:LucidaoNftCollateralRetriever";
    await verifyProxiedContractImplementation(contractName, lucidaoNftCollateralRetriever, contractParameter, contractArgs);
    return lucidaoNftCollateralRetriever;
}

export async function getOrDeployFeeManager(deployer: SignerWithAddress, governanceTreasury: LucidaoGovernanceReserve, licenseManager: LucidaoLicenseManager, redemptionFee: number): Promise<LucidaoFeeManager> {
    const contractName = "LucidaoFeeManager";

    if (feeManagerAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${feeManagerAddress}`);
        return await ethers.getContractAt(contractName, feeManagerAddress);
    };

    const chainId = await deployer.getChainId();
    removeOpenzeppelinProxyFile(chainId);

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY FEE MANAGER
    const LucidaoFeeManager = await ethers.getContractFactory(contractName);
    const contractArgs = [governanceTreasury.address, licenseManager.address, redemptionFee];
    const lucidaoFeeManager = await upgrades.deployProxy(LucidaoFeeManager,
        contractArgs,
        { initializer: 'initialize' }) as LucidaoFeeManager;

    await lucidaoFeeManager.deployed();
    console.log(`${contractName} address: ${lucidaoFeeManager.address}`);

    //await upgrades.admin.transferProxyAdminOwnership(?????);
    const contractParameter = "contracts/LucidaoFeeManager.sol:LucidaoFeeManager";
    await verifyProxiedContractImplementation(contractName, lucidaoFeeManager, contractParameter, contractArgs);
    return lucidaoFeeManager;
}

export async function getOrDeployLicenseManager(stakingService: IStakingService, servicePid: number, tokensForEligibility: number): Promise<LucidaoLicenseManager> {
    const contractName = "LucidaoLicenseManager";

    if (licenseManagerAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${licenseManagerAddress}`);
        return await ethers.getContractAt(contractName, licenseManagerAddress);
    };

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY LICENSE MANAGER
    const contractArgs = [stakingService.address, servicePid, tokensForEligibility] as const;
    const LucidaoLicenseManager = await ethers.getContractFactory(contractName);
    const lucidaoLicenseManager = await LucidaoLicenseManager.deploy(...contractArgs);
    await lucidaoLicenseManager.deployed();
    console.log(`${contractName} address: ${lucidaoLicenseManager.address}`);

    await verifyContract(contractName,
        {
            address: lucidaoLicenseManager.address,
            contract: "contracts/LucidaoLicenseManager.sol:LucidaoLicenseManager",
            constructorArguments: contractArgs
        });

    return lucidaoLicenseManager;
}

export async function getOrDeployLucidaoGovernanceNftReserve(luciDaoTimelockAddress: string): Promise<LucidaoGovernanceNftReserve> {
    const contractName = "LucidaoGovernanceNftReserve";

    if (governanceNftReserveAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${governanceNftReserveAddress}`);
        return await ethers.getContractAt(contractName, governanceNftReserveAddress);
    };


    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY NFT GOVERNANCE RESERVE
    const contractArgs = [] as const;
    const GovernanceNftReserve = await ethers.getContractFactory(contractName);
    const governanceNftReserve = await GovernanceNftReserve.deploy();
    await governanceNftReserve.deployed();
    console.log(`${contractName} address: ${governanceNftReserve.address}`);

    await (await governanceNftReserve.transferOwnership(luciDaoTimelockAddress)).wait();
    console.log(`${contractName} ownership given to timelock of governance ${luciDaoTimelockAddress}`);

    await verifyContract(contractName, {
        address: governanceNftReserve.address,
        contract: "contracts/test/LucidaoGovernanceNftReserve.sol:LucidaoGovernanceNftReserve",
        constructorArguments: contractArgs
    });

    return governanceNftReserve;
}

// *** Proxied Collateral Retriever ***
// TODO: can be replaced with oz-hardhat-upgrades' verify system for proxies
async function verifyProxiedContractImplementation(contractName: string, contract: Contract, contractParameter: string, contractArgs: (string | number)[]) {
    try {
        const contractImplAddress = await getImplementationAddress(network.provider, contract.address);;
        console.log(`Found ${contractName} implementation in proxied contract json. Impl address: ${contractImplAddress}`);
        await verifyContract(contractName, {
            address: contractImplAddress,
            contract: contractParameter
            // constructorArguments: contractArgs
        });
    } catch (error) {
        console.log(`Warning: problem while verifying ${contractName} contract. Skip! Error detail: ${error}`);
    }
}

// *** Verify contract ***
export async function verifyContract(name: string, taskArguments?: any) {
    if (skipContractVerify()) {
        return;
    }
    console.log(`Verifying contract ${name}`);
    await new Promise(r => setTimeout(r, 90000));

    try {
        await run("verify:verify", taskArguments);
    } catch (error) {
        console.log(`Unable to verify contract ${name}`);
        console.log(error);
    }
}

/*********************************** TEST CONTRACT DEPLOY *********************/
export async function deployTestLicenseManager(stakinService: Contract, servicePid: number, tokensForEligibility: number): Promise<LucidaoTestLicenseManager> {
    if (!isDevelopment()) {
        throw Error("Deploying test contract in wrong environment");
    }

    const contractName = "LucidaoTestLicenseManager";
    console.log(`\nDeploying contract ${contractName}`);
    const contractArgs = [stakinService.address, servicePid, tokensForEligibility] as const;

    // DEPLOY TEST LICENSE MANAGER
    const LucidaoTestLicenseManager = await ethers.getContractFactory(contractName);
    const lucidaoTestLicenseManager = await LucidaoTestLicenseManager.deploy(...contractArgs);
    await lucidaoTestLicenseManager.deployed();
    console.log(`${contractName} address: ${lucidaoTestLicenseManager.address}`);

    await verifyContract(contractName, { address: lucidaoTestLicenseManager.address });

    return lucidaoTestLicenseManager;
}

export async function deployFeeManagerTester(feeManager: string): Promise<FeeManagerTester> {
    if (!isDevelopment()) {
        throw Error("Deploying test contract in wrong environment");
    }
    //test contract
    const contractName = "FeeManagerTester";
    console.log(`\nDeploying contract ${contractName}`);

    const FeeManagerTester = await ethers.getContractFactory(contractName);
    const feeManagerTester = await FeeManagerTester.deploy(feeManager);
    await feeManagerTester.deployed();
    console.log(`${contractName} address: ${feeManagerTester.address}`);

    await verifyContract(contractName, { address: feeManagerTester.address });

    return feeManagerTester;
}

export async function getOrDeployLucidaoGovernanceReserve(luciDaoTimelockAddress: string): Promise<LucidaoGovernanceReserve> {
    if (!isDevelopment()) {
        throw Error("Deploying test contract in wrong environment");
    };
    let usdtForLiquidity = "528000";
    const contractName = "LucidaoGovernanceReserve";

    if (governanceTreasuryAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${governanceTreasuryAddress}`);
        return await ethers.getContractAt(contractName, governanceTreasuryAddress);
    };

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY GOVERNANCE RESERVE
    // const contractArgs = [liquidityToken.address, liquidityVaultAddress, usdtForLiquidity] as const;
    const LuciDaoGovernanceReserve = await ethers.getContractFactory(contractName);
    const luciDaoGovernanceReserve = await LuciDaoGovernanceReserve.deploy();
    await luciDaoGovernanceReserve.deployed();
    console.log(`${contractName} address: ${luciDaoGovernanceReserve.address}`);

    await (await luciDaoGovernanceReserve.transferOwnership(luciDaoTimelockAddress)).wait();
    console.log(`${contractName} ownership given to timelock of governance ${luciDaoTimelockAddress}`);

    // await transferLuciDaoTo(luciDao, contractName, luciDaoGovernanceReserve.address, lcdAllocations.governanceReserve);
    // await verifyContract(contractName, { address: luciDaoGovernanceReserve.address, constructorArguments: contractArgs });

    return luciDaoGovernanceReserve;

}

// *** fUSDT contract ***
export async function getOrDeployfUsdt(vault: SignerWithAddress): Promise<AnyswapV3ERC20> {
    if (!isDevelopment()) {
        throw Error("Deploying test contract in wrong environment");
    };

    const contractName = "AnyswapV3ERC20";

    if (fusdtAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${fusdtAddress}`);
        return await ethers.getContractAt(contractName, fusdtAddress);
    };

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY fUSDT
    const Fusdt = await ethers.getContractFactory(contractName);
    const contractArgs = ["Frapped USDT", "fUSDT", 6, ethers.constants.AddressZero, vault.address] as const;
    const fusdt = await Fusdt.deploy(...contractArgs);
    await fusdt.deployed();
    console.log(`${contractName} address ${fusdt.address}`);

    await verifyContract(contractName,
        {
            address: fusdt.address,
            constructorArguments: contractArgs
        });

    // if (whitelistedAddresses?.length) {
    //     for (let index = 0; index < whitelistedAddresses.length; index++) {
    //         const address = whitelistedAddresses[index];
    //         await mintfUsdtTo(fusdt, address, usdtToMintForAddress);
    //     }
    // }
    return fusdt;
}

// *** test farm ***
export async function getOrDeployFarm(fUsdt: AnyswapV3ERC20, stakedTokens: number): Promise<TestFarm> {
    if (!isDevelopment()) {
        throw Error("Deploying test contract in wrong environment");
    };

    const contractName = "TestFarm";

    if (farmAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${farmAddress}`);
        return await ethers.getContractAt(contractName, farmAddress);
    };

    console.log(`\nDeploying contract ${contractName}`);
    const contractArgs = [fUsdt.address, stakedTokens] as const;

    const MyTestFarm = await ethers.getContractFactory(contractName);
    const testFarm = await MyTestFarm.deploy(...contractArgs);
    await testFarm.deployed();
    console.log(`${contractName} address ${testFarm.address}`);

    await verifyContract(contractName,
        {
            address: testFarm.address,
            constructorArguments: contractArgs
        });

    return testFarm;
}

export async function getOrDeployFakeUsd() {
    const contractName = "FakeUsd";

    if (fakeUsdAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${fakeUsdAddress}`);
        return await ethers.getContractAt(contractName, fakeUsdAddress);
    };

    console.log(`\nDeploying contract ${contractName}`);

    const FakeUsd = await ethers.getContractFactory(contractName);
    const fakeUsd = await FakeUsd.deploy();
    await fakeUsd.deployed();
    console.log(`${contractName} address ${fakeUsd.address}`);

    await verifyContract(contractName,
        {
            address: fakeUsd.address
        });

    return fakeUsd;
}
