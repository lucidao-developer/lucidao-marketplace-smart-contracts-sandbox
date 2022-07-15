import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { NFT_MINTER_ROLE } from '../config/roles';
import { deployNftCollection, getOrDeployLicenseManager, getOrDeployNftCollectionFactory } from '../scripts/deployFunctions';
import { IStakingService, LucidaoNftCollateralRetrieverV2, LucidaoNftCollateralRetrieverV3 } from "../typechain";
import { buildScenario1, getTokenId, mintNft, SOLIDITY_ERROR_MSG, whitelistAddressesForOracleTransferOnNftCollection } from './common';
import { checkSkipTest, getCurrentChainTimestamp, getUnixEpoch, setNetworkTimestampTo } from './utilities';

export function nftCollateralRetrieverBehavior(): void {
    it("Burn Nft", async function () {
        checkSkipTest(this.skipTest, this);
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const nftCollectionContract = await ethers.getContractAt("LucidaoNftCollection",
            nftTokenCollectionData.collectionAddress);

        let tokenOwner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(tokenOwner).eq(this.oracle1.address);

        await expect(this.nftCollateralRetriever.burnNft(nftTokenCollectionData.collectionAddress,
            nftTokenCollectionData.tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.ONLY_MINTER_CAN_BURN);

        await expect(this.nftCollateralRetriever.connect(this.oracle1).burnNft(nftTokenCollectionData.collectionAddress,
            nftTokenCollectionData.tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_TOKEN_OWNER);

        await whitelistAddressesForOracleTransferOnNftCollection(nftCollectionContract, this.signer, [this.owner1.address]);
        await nftCollectionContract.connect(this.oracle1).transferFrom(this.oracle1.address,
            this.owner1.address,
            nftTokenCollectionData.tokenId);

        tokenOwner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(tokenOwner).eq(this.owner1.address);

        await expect(this.nftCollateralRetriever.connect(this.oracle1).burnNft(nftTokenCollectionData.collectionAddress,
            nftTokenCollectionData.tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_TOKEN_OWNER);

        //owner began collateral retrieving
        await nftCollectionContract.connect(this.owner1).transferFrom(this.owner1.address,
            this.nftCollateralRetriever.address,
            nftTokenCollectionData.tokenId);

        tokenOwner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(tokenOwner).eq(this.nftCollateralRetriever.address);

        let tokenCount = await nftCollectionContract.totalSupply();
        expect(tokenCount).eq(1);

        await expect(this.nftCollateralRetriever.connect(this.owner1).burnNft(nftTokenCollectionData.collectionAddress,
            nftTokenCollectionData.tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.ONLY_MINTER_CAN_BURN);

        await expect(this.nftCollateralRetriever.connect(this.oracle1).burnNft(nftTokenCollectionData.collectionAddress,
            nftTokenCollectionData.tokenId))
            .to.emit(this.nftCollateralRetriever, "NftBurned")
            .withArgs(nftCollectionContract.address, this.oracle1.address, nftTokenCollectionData.tokenId);

        tokenCount = await nftCollectionContract.totalSupply();
        expect(tokenCount).eq(0);

        await expect(nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.INVALID_TOKEN);
    });

    it("Minter role can burn Nft", async function () {
        checkSkipTest(this.skipTest, this);
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const nftCollectionContract = await ethers.getContractAt("LucidaoNftCollection",
            nftTokenCollectionData.collectionAddress);

        let tokenOwner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(tokenOwner).eq(this.oracle1.address);

        await whitelistAddressesForOracleTransferOnNftCollection(nftCollectionContract, this.signer, [this.nftCollateralRetriever.address]);
        await nftCollectionContract.connect(this.oracle1)['safeTransferFrom(address,address,uint256)'](this.oracle1.address,
            this.nftCollateralRetriever.address,
            nftTokenCollectionData.tokenId);

        let tokenCount = await nftCollectionContract.totalSupply();
        expect(tokenCount).eq(1);

        await expect(this.nftCollateralRetriever.connect(this.owner2).burnNft(nftTokenCollectionData.collectionAddress,
            nftTokenCollectionData.tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.ONLY_MINTER_CAN_BURN);

        await (await nftCollectionContract.connect(this.oracle1).grantRole(NFT_MINTER_ROLE,
            this.owner2.address)
        ).wait();

        await expect(this.nftCollateralRetriever.connect(this.owner2).burnNft(nftTokenCollectionData.collectionAddress,
            nftTokenCollectionData.tokenId))
            .to.emit(this.nftCollateralRetriever, "NftBurned")
            .withArgs(nftCollectionContract.address, this.owner2.address, nftTokenCollectionData.tokenId);

        tokenCount = await nftCollectionContract.totalSupply();
        expect(tokenCount).eq(0);

        await expect(nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.INVALID_TOKEN);
    });

    it("Redeem request wkf", async function () {
        checkSkipTest(this.skipTest, this);
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const nftCollectionContract = await ethers.getContractAt("LucidaoNftCollection",
            nftTokenCollectionData.collectionAddress);

        await whitelistAddressesForOracleTransferOnNftCollection(nftCollectionContract, this.signer, [this.owner1.address]);
        await nftCollectionContract.connect(this.oracle1).transferFrom(this.oracle1.address,
            this.owner1.address,
            nftTokenCollectionData.tokenId);
        let owner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(owner).to.be.equal(this.owner1.address);

        const receipt = await (await nftCollectionContract.connect(this.owner1)['safeTransferFrom(address,address,uint256,bytes)'](this.owner1.address,
            this.nftCollateralRetriever.address,
            nftTokenCollectionData.tokenId, [])).wait();

        //https://github.com/ethers-io/ethers.js/issues/487
        let abi = ["event RedeemRequest(address indexed collectionAddress, address indexed from, address operator, uint256 tokenId)"];
        let iface = new ethers.utils.Interface(abi);
        const redeemEvent = iface.parseLog(receipt.logs[receipt.logs.length - 1]);
        expect(redeemEvent.name).to.be.equal("RedeemRequest");
        const { collectionAddress, from, operator, tokenId } = redeemEvent?.args;
        expect(collectionAddress).to.be.equal(nftTokenCollectionData.collectionAddress);
        expect(from).to.be.equal(this.owner1.address);
        expect(operator).to.be.equal(this.owner1.address);
        expect(tokenId).to.be.equal(nftTokenCollectionData.tokenId);
        owner = await nftCollectionContract.ownerOf(tokenId);
        expect(owner).to.be.equal(this.nftCollateralRetriever.address);
    });

    it("Transfer nft with expired vault service", async function () {
        checkSkipTest(this.skipTest, this);
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const nftCollectionContract = await ethers.getContractAt("LucidaoNftCollection",
            nftTokenCollectionData.collectionAddress);

        const deadline = getUnixEpoch(10);
        await (await nftCollectionContract.connect(this.oracle1).setVaultServiceDeadline(nftTokenCollectionData.tokenId, deadline)).wait();
        const vaultServiceDeadline = await nftCollectionContract.getVaultServiceDeadline(nftTokenCollectionData.tokenId);
        expect(vaultServiceDeadline).is.equal(deadline);

        setNetworkTimestampTo(deadline);

        await whitelistAddressesForOracleTransferOnNftCollection(nftCollectionContract, this.signer, [this.owner1.address]);
        await (await nftCollectionContract.connect(this.oracle1).transferFrom(this.oracle1.address,
            this.owner1.address,
            nftTokenCollectionData.tokenId)).wait();

        await expect(nftCollectionContract.connect(this.owner1)['safeTransferFrom(address,address,uint256,bytes)'](this.owner1.address,
            this.nftCollateralRetriever.address,
            nftTokenCollectionData.tokenId, []))
            .to.be.revertedWith("Vault service expired");

        const newDeadline = await getCurrentChainTimestamp() + 10;
        await (await nftCollectionContract.connect(this.oracle1).setVaultServiceDeadline(nftTokenCollectionData.tokenId, newDeadline)).wait();
        expect(await nftCollectionContract.getVaultServiceDeadline(nftTokenCollectionData.tokenId)).is.equal(newDeadline);

        //Owner1 made an off chain payment of the vault service
        await (await nftCollectionContract.connect(this.owner1)['safeTransferFrom(address,address,uint256,bytes)'](this.owner1.address,
            this.nftCollateralRetriever.address,
            nftTokenCollectionData.tokenId, [])).wait();
        let tokenOwner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(tokenOwner).eq(this.nftCollateralRetriever.address);
    });

    it("Check unknown collection", async function () {
        checkSkipTest(this.skipTest, this);
        let nftCollectionContract = await deployNftCollection("unknownCollection", "UNK_COL", this.signer, this.oracle1.address, this.governanceNftTreasury.address);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(nftCollectionContract, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);

        //FIXME: transfer from non controlla se la collection è valida
        //enable transfer to NftCollateralRetriever...
        await whitelistAddressesForOracleTransferOnNftCollection(nftCollectionContract, this.signer, [this.nftCollateralRetriever.address]);
        let receipt = await (await nftCollectionContract.connect(this.oracle1).transferFrom(this.oracle1.address,
            this.nftCollateralRetriever.address,
            tokenId)).wait();
        let owner = await nftCollectionContract.ownerOf(tokenId);
        expect(owner).to.be.equal(this.nftCollateralRetriever.address);

        transactionReceipt = await mintNft(nftCollectionContract, tokenUri, this.oracle1);
        const tokenId2 = getTokenId(transactionReceipt);
        await expect(nftCollectionContract.connect(this.oracle1)['safeTransferFrom(address,address,uint256,bytes)'](this.oracle1.address,
            this.nftCollateralRetriever.address,
            tokenId2, [])).to.be.revertedWith("'Unknown collection");

        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        nftCollectionContract = await ethers.getContractAt("LucidaoNftCollection",
            nftTokenCollectionData.collectionAddress);

        //enable transfer to NftCollateralRetriever...
        await whitelistAddressesForOracleTransferOnNftCollection(nftCollectionContract, this.signer, [this.nftCollateralRetriever.address]);
        await nftCollectionContract.connect(this.oracle1)['safeTransferFrom(address,address,uint256,bytes)'](this.oracle1.address,
            this.nftCollateralRetriever.address,
            nftTokenCollectionData.tokenId, []);
        owner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(owner).to.be.equal(this.nftCollateralRetriever.address);
    });

    it("Check burn on unknown collection", async function () {
        checkSkipTest(this.skipTest, this);
        let nftCollectionContract = await deployNftCollection("unknownCollection", "UNK_COL", this.signer, this.oracle1.address, this.governanceNftTreasury.address);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(nftCollectionContract, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);

        //enable transfer to NftCollateralRetriever...
        await whitelistAddressesForOracleTransferOnNftCollection(nftCollectionContract, this.signer, [this.nftCollateralRetriever.address]);

        let receipt = await (await nftCollectionContract.connect(this.oracle1).transferFrom(this.oracle1.address,
            this.nftCollateralRetriever.address,
            tokenId)).wait();
        let owner = await nftCollectionContract.ownerOf(tokenId);
        expect(owner).to.be.equal(this.nftCollateralRetriever.address);
        await expect(this.nftCollateralRetriever.connect(this.oracle1).burnNft(nftCollectionContract.address,
            tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.UNKNOWN_COLLECTION);

    });

    it.skip("update collectionFactory or feeManager", async function () {
        //FIXME: test EIP-165
        // await (await this.nftCollateralRetriever.setCollectionFactory(this.owner2))
        //     .to.emit();
    });

    it.skip("upgrade collateral retriever implementation to V2", async function () {
        checkSkipTest(this.skipTest, this);
        let originalCollectionFactory = await this.nftCollateralRetriever.getCollectionFactory();
        expect(await (await upgrades.admin.getInstance()).owner()).to.be.equal(this.signer.address);
        const LucidaoNftCollateralRetrieverV2 = await ethers.getContractFactory("LucidaoNftCollateralRetrieverV2");
        const lucidaoNftCollateralRetriever = await upgrades.upgradeProxy(this.nftCollateralRetriever.address,
            LucidaoNftCollateralRetrieverV2,
            { call: { fn: 'setOwner', args: [this.signer.address] } }) as LucidaoNftCollateralRetrieverV2;
        expect(lucidaoNftCollateralRetriever.address).to.be.eq(this.nftCollateralRetriever.address);

        const proxyAdmin = (await upgrades.admin.getInstance()).address;
        //expect(await lucidaoNftCollateralRetriever.owner()).to.be.equal(proxyAdmin);
        expect(await lucidaoNftCollateralRetriever.owner()).to.be.equal(this.signer.address);
        expect(await lucidaoNftCollateralRetriever.getCollectionFactory()).to.be.equal(originalCollectionFactory);
        const licenseManager = await getOrDeployLicenseManager(this.testFarm as IStakingService,
            this.servicePid,
            this.tokensForEligibility);
        const newCollectionFactory = await getOrDeployNftCollectionFactory(this.signer, licenseManager, this.governanceNftTreasury);
        (await lucidaoNftCollateralRetriever.updateCollectionFactory(newCollectionFactory.address)).wait();
        expect(await lucidaoNftCollateralRetriever.getCollectionFactory()).to.be.equal(newCollectionFactory.address);
    })

    it.skip("upgrade collateral retriever implementation v3", async function () {
        checkSkipTest(this.skipTest, this);
        let originalCollectionFactory = await this.nftCollateralRetriever.getCollectionFactory();
        expect(await (await upgrades.admin.getInstance()).owner()).to.be.equal(this.signer.address);
        const LucidaoNftCollateralRetrieverV2 = await ethers.getContractFactory("LucidaoNftCollateralRetrieverV3");
        const lucidaoNftCollateralRetriever = await upgrades.upgradeProxy(this.nftCollateralRetriever.address,
            LucidaoNftCollateralRetrieverV2,
            { call: { fn: 'migration', args: [this.signer.address] } }) as LucidaoNftCollateralRetrieverV3;

        expect(lucidaoNftCollateralRetriever.address).to.be.eq(this.nftCollateralRetriever.address);
        const proxyAdmin = (await upgrades.admin.getInstance()).address;
        //expect(await lucidaoNftCollateralRetriever.owner()).to.be.equal(proxyAdmin);
        expect(await lucidaoNftCollateralRetriever.owner()).to.be.equal(this.signer.address);
        expect(await lucidaoNftCollateralRetriever.getCollectionFactory()).to.be.equal(originalCollectionFactory);
        const licenseManager = await getOrDeployLicenseManager(this.testFarm as IStakingService,
            this.servicePid,
            this.tokensForEligibility);
        const newCollectionFactory = await getOrDeployNftCollectionFactory(this.signer, licenseManager, this.governanceNftTreasury);
        (await lucidaoNftCollateralRetriever.updateCollectionFactory(newCollectionFactory.address)).wait();
        expect(await lucidaoNftCollateralRetriever.getCollectionFactory()).to.be.equal(newCollectionFactory.address);
    })
}
