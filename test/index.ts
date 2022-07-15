import { ethers, network } from 'hardhat';
import { mockConsoleLog } from '../scripts/utilities';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { nftCollectionBehavior } from './NftCollection.behavior';
import {
  getOrDeployFeeManager, deployFeeManagerTester, getOrDeployfUsdt,
  getOrDeployLicenseManager, getOrDeployNftCollateralRetriever, deployNftCollection,
  getOrDeployNftCollectionFactory, getOrDeployLucidaoGovernanceReserve, getOrDeployFarm, getOrDeployLucidaoGovernanceNftReserve
} from "../scripts/deployFunctions";
import { nftCollectionFactoryBehavior } from "./NftCollectionFactory.behavior";
import { } from '../types/mochaContextAugmentations';
import { nftCollateralRetrieverBehavior } from './NftCollateralRetriever.behavior';
import { licenseManagerBehavior } from './LicenseManager.behavior';
import { resetNetwork, restoreSnapshot, setSnapshot } from './utilities';
import { feeManagerBehavior } from './FeeManager.behavior';
import { IStakingService } from '../typechain';
import { insolvencyGracePeriod, minGracePeriod } from '../config/config';

var chai = require("chai");
chai.config.includeStack = true;

describe("Unit tests", () => {
  let signer: SignerWithAddress;
  let oracle1: SignerWithAddress;
  let owner1: SignerWithAddress;
  let owner2: SignerWithAddress;
  let timelock: SignerWithAddress;
  let nftVault: SignerWithAddress;
  let signers: SignerWithAddress[];

  before(async function () {
    mockConsoleLog();
    signers = await ethers.getSigners();
    [signer, oracle1, owner1, owner2, timelock, nftVault] = signers;
    this.skipTest = false;
    this.signer = signer;
    console.log(`Signer: ${this.signer.address}`);
    this.oracle1 = oracle1;
    console.log(`Oracle1: ${this.oracle1.address}`);
    this.owner1 = owner1;
    console.log(`Owner1: ${this.owner1.address}`);
    this.owner2 = owner2;
    console.log(`Owner2: ${this.owner2.address}`);
    this.timelock = timelock;
    console.log(`Timelock: ${this.timelock.address}`);
    /* Contracts used only for testing purpose */
    this.fUsdt = await getOrDeployfUsdt(this.signer)
    this.governanceTreasury = await getOrDeployLucidaoGovernanceReserve(timelock.address);
    this.governanceNftTreasury = await getOrDeployLucidaoGovernanceNftReserve(timelock.address);
    this.stakedTokens = 1000;
    this.servicePid = 0;
    this.redemptionFee = 0;
    this.tokensForEligibility = 0;
    this.minGracePeriod = minGracePeriod;
    this.insolvencyGracePeriod = insolvencyGracePeriod;

    this.testFarm = await getOrDeployFarm(this.fUsdt, this.stakedTokens);
    console.log(`Governance Treasury: ${this.governanceTreasury.address}`);
    console.log(`Governance Nft Treasury: ${this.governanceNftTreasury.address}`);
  });

  describe("Nft Collection Factory", () => {
    before(async function () {
      await resetNetwork(network);
      this.nftLicenseManager = await getOrDeployLicenseManager(this.testFarm as IStakingService,
        this.servicePid,
        this.tokensForEligibility);
      this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.signer, this.nftLicenseManager, this.governanceNftTreasury);
    });

    beforeEach(async function () {
      this.snapshot = await setSnapshot(network);
    })

    afterEach(async function () {
      await restoreSnapshot(network, this.snapshot)
    })

    nftCollectionFactoryBehavior();
  });

  describe("Nft Collection", () => {
    before(async function () {
      await resetNetwork(network);
      this.nftCollection = await deployNftCollection("oracle1Watches", "OR1_WTCH", this.signer, this.oracle1.address, this.governanceNftTreasury.address);
    });

    beforeEach(async function () {
      this.snapshot = await setSnapshot(network);
    })

    afterEach(async function () {
      await restoreSnapshot(network, this.snapshot)
    })

    nftCollectionBehavior();
  });

  describe("Nft Collateral Retriever", () => {
    before(async function () {
      await resetNetwork(network);
      this.nftLicenseManager = await getOrDeployLicenseManager(this.testFarm as IStakingService,
        this.servicePid,
        this.tokensForEligibility);
      this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.signer, this.nftLicenseManager, this.governanceNftTreasury);
      this.platformFeeManager = await getOrDeployFeeManager(this.signer, this.governanceTreasury, this.nftLicenseManager, this.redemptionFee);;
      this.nftCollateralRetriever = await getOrDeployNftCollateralRetriever(this.signer, this.nftCollectionFactory, this.platformFeeManager);
    });

    beforeEach(async function () {
      this.snapshot = await setSnapshot(network);
    })

    afterEach(async function () {
      await restoreSnapshot(network, this.snapshot)
    })

    nftCollateralRetrieverBehavior();
  });

  describe("Nft License Manager", () => {
    before(async function () {
      await resetNetwork(network);
      this.nftLicenseManager = await getOrDeployLicenseManager(this.testFarm as IStakingService,
        this.servicePid,
        this.tokensForEligibility);
    });

    beforeEach(async function () {
      this.snapshot = await setSnapshot(network);
    })

    afterEach(async function () {
      await restoreSnapshot(network, this.snapshot)
    })

    licenseManagerBehavior();
  });

  describe("Nft Fee Manager", () => {
    before(async function () {
      await resetNetwork(network);
      this.nftLicenseManager = await getOrDeployLicenseManager(this.testFarm as IStakingService,
        this.servicePid,
        this.tokensForEligibility);
      this.nftFeeManager = await getOrDeployFeeManager(this.signer, this.governanceTreasury, this.nftLicenseManager, this.redemptionFee);
      this.nftFeeManagerTester = await deployFeeManagerTester(this.nftFeeManager.address);
    });

    beforeEach(async function () {
      this.snapshot = await setSnapshot(network);
    })

    afterEach(async function () {
      await restoreSnapshot(network, this.snapshot)
    })

    feeManagerBehavior();
  });
});
