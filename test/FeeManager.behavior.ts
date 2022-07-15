import { expect } from 'chai';
import { config as hardhatConfig } from 'hardhat'
import { ContractReceipt, Event } from 'ethers';
import BN from 'bn.js';
import { checkSkipTest } from './utilities';
import { feeReceivedEventabi, SOLIDITY_ERROR_MSG, TEN_DISCOUNT, testDiscount } from './common';
import { ethers, upgrades, waffle } from 'hardhat';
import { LucidaoFeeManagerV2 } from "../typechain";
import { ADMIN_ROLE } from '../config/roles';
import { HardhatNetworkAccountsConfig, HardhatNetworkHDAccountsConfig } from 'hardhat/types';

export function feeManagerBehavior(): void {
    it("Check default fee in native token", async function () {
        checkSkipTest(this.skipTest, this);
        const provider = waffle.provider;
        const feeManagerAmount = "100";
        const parsedFeeManagerAmount = ethers.utils.parseEther(feeManagerAmount);
        const FEE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        const testFeeData = ethers.utils.formatBytes32String("text")

        //governance treasury new balance
        const governanceTreasuryBalance = await provider.getBalance(this.governanceTreasury.address);

        const owner1InitialBalance = await provider.getBalance(this.owner1.address);
        const feeTransferred = await (await this.owner1.sendTransaction({
            to: this.nftFeeManagerTester.address,
            value: parsedFeeManagerAmount
        })
        ).wait();

        const nftFeeManagerTesterNewBalance = await provider.getBalance(this.nftFeeManagerTester.address);
        expect(nftFeeManagerTesterNewBalance).to.be.equal(parsedFeeManagerAmount);

        let owner1NewBalance = await provider.getBalance(this.owner1.address);
        let gasCost = feeTransferred.effectiveGasPrice.mul(feeTransferred.gasUsed); //GWEI
        expect(owner1NewBalance).to.be.equal(owner1InitialBalance
            .sub(parsedFeeManagerAmount)
            .sub(gasCost));

        const tx = await this.nftFeeManagerTester.connect(this.owner1).testReceiveZeroExFeeCallback(FEE_TOKEN,
            parsedFeeManagerAmount,
            testFeeData);
        const receipt: ContractReceipt = await tx.wait();
        const zeroCallGasCost = receipt.effectiveGasPrice.mul(receipt.gasUsed);

        let iface = new ethers.utils.Interface(feeReceivedEventabi);
        const rebateReceived: Event | undefined = receipt.events?.find((x: Event) => { return x.event == "RebateReceived" });
        expect(rebateReceived).to.be.equal(undefined);

        const feeReceived: Event | undefined = receipt.events?.find((x: Event) => { return x.event == "FeeReceived" });
        if (!feeReceived) {
            throw Error("Missing event FeeReceived");
        }
        const feeReceivedEvent = iface.parseLog(feeReceived);
        const { tokenAddress, amount, feeData } = feeReceivedEvent.args;
        expect((tokenAddress as string).toLowerCase()).to.be.equal(FEE_TOKEN);
        expect(amount).to.be.equal(parsedFeeManagerAmount);
        expect(testFeeData).to.be.equal(feeData);
        owner1NewBalance = await provider.getBalance(this.owner1.address);
        const newGovernanceTreasuryBalance = await provider.getBalance(this.governanceTreasury.address);
        expect(newGovernanceTreasuryBalance).to.be.eq(governanceTreasuryBalance.add(parsedFeeManagerAmount));
        expect(owner1NewBalance).to.be.equal(owner1InitialBalance.sub(gasCost)
            .sub(zeroCallGasCost)
            .sub(parsedFeeManagerAmount));

        const owner2Balance = await provider.getBalance(this.owner2.address);
        const hardhatAccountData: HardhatNetworkHDAccountsConfig = hardhatConfig.networks.hardhat.accounts as HardhatNetworkHDAccountsConfig;
        const balance = hardhatAccountData.accountsBalance;
        expect(owner2Balance).to.be.equal(balance);
        const timelockBalance = await provider.getBalance(this.timelock.address);
        //La fee la paga la timelock
        const transferEthTransaction = await (await this.governanceTreasury.connect(this.timelock).transferEth(this.owner2.address,
            newGovernanceTreasuryBalance)).wait();
        const owner2NewBalance = await provider.getBalance(this.owner2.address);

        expect(await provider.getBalance(this.governanceTreasury.address))
            .to.be.eq(0);

        expect(owner2NewBalance).to.be.equal(owner2Balance
            .add(newGovernanceTreasuryBalance)
        );

        expect(timelockBalance).to.be.equal(
            (await provider.getBalance(this.timelock.address))
            .add(transferEthTransaction.effectiveGasPrice.mul(transferEthTransaction.gasUsed))
        );
    });

    it("Check fee with discount 12%", async function () {
        checkSkipTest(this.skipTest, this);
        const test = {
            feeManagerAmount: ethers.utils.parseUnits("100", 6),
            expectedRebateAmount: ethers.utils.parseUnits("12", 6),
            discount: 1200 //12%
        };
        await testDiscount(this,
            test.feeManagerAmount,
            test.expectedRebateAmount,
            test.discount);
    });

    it("Check fee with discount 0.01%", async function () {
        checkSkipTest(this.skipTest, this);
        const test = {
            feeManagerAmount: ethers.utils.parseUnits("100", 6),
            expectedRebateAmount: ethers.utils.parseUnits("1", 4),
            discount: 1 //0.01%
        };
        await testDiscount(this,
            test.feeManagerAmount,
            test.expectedRebateAmount,
            test.discount);
    });

    it("Check fee with discount 13.25%", async function () {
        checkSkipTest(this.skipTest, this);
        const test = {
            feeManagerAmount: ethers.utils.parseUnits("10000", 6),
            expectedRebateAmount: ethers.utils.parseUnits("1325", 6),
            discount: 1325
        };
        await testDiscount(this,
            test.feeManagerAmount,
            test.expectedRebateAmount,
            test.discount);
    });

    it("upgrade fee manager implementation to V2", async function () {
        checkSkipTest(this.skipTest, this);

        expect(await this.nftFeeManager.owner())
            .to.be.eq(this.signer.address);

        const LucidaoFeeManagerV2 = await ethers.getContractFactory("LucidaoFeeManagerV2");
        const lucidaoFeeManagerV2 = await upgrades.upgradeProxy(this.nftFeeManager.address,
            LucidaoFeeManagerV2,
            { call: { fn: 'migration', args: [] } }) as LucidaoFeeManagerV2;
        expect(lucidaoFeeManagerV2.address).to.be.eq(this.nftFeeManager.address);
        expect(await lucidaoFeeManagerV2.hasRole(ADMIN_ROLE, this.signer.address))
            .to.be.eq(true);
        const proxyAdmin = (await upgrades.admin.getInstance());
        expect(await lucidaoFeeManagerV2.hasRole(ADMIN_ROLE, proxyAdmin.address))
            .to.be.eq(false);

        expect(await lucidaoFeeManagerV2.governanceTreasury())
        .to.be.eq(await this.nftFeeManager.governanceTreasury());

        expect(await lucidaoFeeManagerV2.governanceTreasury())
        .to.be.eq(this.governanceTreasury.address);

        const GOVERNANCE_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GOVERNANCE_ROLE"));
        await expect(lucidaoFeeManagerV2.connect(this.owner1)
                                        .setGovernanceTreasuryForRole(this.governanceNftTreasury.address))
            .to.be.revertedWith(`${this.owner1.address.toLowerCase()} is missing role ${GOVERNANCE_ROLE}`);

        await(await lucidaoFeeManagerV2.grantRole(GOVERNANCE_ROLE, this.owner1.address)).wait();

        await(await lucidaoFeeManagerV2.connect(this.owner1)
                                       .setGovernanceTreasuryForRole(this.governanceNftTreasury.address)
              ).wait();

        expect(await lucidaoFeeManagerV2.governanceTreasury())
        .to.be.eq(this.governanceNftTreasury.address);

        //transferownership?
        //lucidaoFeeManagerV2.setGovernanceTreasury
    })
}