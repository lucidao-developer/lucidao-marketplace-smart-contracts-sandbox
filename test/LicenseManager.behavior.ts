import { expect } from 'chai';
// import { ContractReceipt } from 'ethers';
import BN from 'bn.js';
import { checkSkipTest } from './utilities';
import { SOLIDITY_ERROR_MSG, TEN_DISCOUNT, ZERO_DISCOUNT } from './common';
import { getOrDeployNftCollectionFactory, deployTestLicenseManager } from '../scripts/deployFunctions';
import { IStakingService } from '../typechain';

export function licenseManagerBehavior(): void {
    it("Set discount", async function () {
        checkSkipTest(this.skipTest, this);
        const max_discount = new BN(9000); //90%
        const gap = new BN(1);

        let userDiscount = await this.nftLicenseManager.getDiscount(this.owner1.address);
        expect(userDiscount).to.be.eq(ZERO_DISCOUNT);

        await expect(this.nftLicenseManager.connect(this.oracle1)
            .setDiscount(this.owner1.address, TEN_DISCOUNT))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_OWNER_CALLER);
        const tx = await this.nftLicenseManager.connect(this.signer).setDiscount(this.owner1.address, TEN_DISCOUNT);
        tx.wait();
        userDiscount = await this.nftLicenseManager.connect(this.oracle1).getDiscount(this.owner1.address);
        expect(userDiscount).to.be.eq(TEN_DISCOUNT);
        await expect(this.nftLicenseManager.connect(this.signer)
            .setDiscount(this.owner1.address, ZERO_DISCOUNT))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.INVALID_DISCOUNT);
        await expect(this.nftLicenseManager.connect(this.signer)
            .setDiscount(this.owner1.address, max_discount.add(gap).toString()))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.INVALID_DISCOUNT);
    });

    it("Check if oracle is a qualified oracle", async function () {
        checkSkipTest(this.skipTest, this);
        expect(await this.nftLicenseManager.isAQualifiedOracle(this.oracle1.address))
            .to.be.equal(true);
        let nftCollectionFactory = await getOrDeployNftCollectionFactory(this.signer,
            this.nftLicenseManager,
            this.governanceNftTreasury);
        expect(await nftCollectionFactory.createdContractCount()).to.be.eq(0);
        await (await nftCollectionFactory.createCollection("name", "symbol",
            this.oracle1.address, this.minGracePeriod, this.insolvencyGracePeriod)).wait();
        expect(await nftCollectionFactory.createdContractCount()).to.be.eq(1);
    });

    it("A not qualified oracle cannot create a collection", async function () {
        checkSkipTest(this.skipTest, this);
        const testLicenseManager = await deployTestLicenseManager(this.testFarm as IStakingService,
            this.servicePid,
            this.tokensForEligibility);
        let nftCollectionFactory = await getOrDeployNftCollectionFactory(this.signer, testLicenseManager, this.governanceNftTreasury);
        expect(await nftCollectionFactory.createdContractCount()).to.be.eq(0);
        expect(await testLicenseManager.isAQualifiedOracle(this.oracle1.address))
            .to.be.equal(false);
        await expect(nftCollectionFactory.createCollection("name", "symbol",
            this.oracle1.address, this.minGracePeriod, this.insolvencyGracePeriod))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.INVALID_ORACLE);
        expect(await nftCollectionFactory.createdContractCount()).to.be.eq(0);
    });
}