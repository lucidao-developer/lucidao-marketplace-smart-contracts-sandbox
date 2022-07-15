import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import {
    ADMIN_ROLE, NFT_MINTER_ROLE, NFT_MINTER_ROLE_MANAGER,
    VAULT_MANAGER_ROLE
} from '../config/roles';
import { LucidaoNftCollectionFactoryV2 } from "../typechain";
import { getTokenId, mintNft, SOLIDITY_ERROR_MSG, whitelistAddressesForOracleTransferOnNftCollection } from './common';
import { checkSkipTest, getUnixEpoch, setNetworkTimestampTo, toBytes1 } from './utilities';

export function nftCollectionFactoryBehavior(): void {
    async function createCollection(context: Mocha.Context, name: string, symbol: string, signer: SignerWithAddress, oracle: SignerWithAddress): Promise<string> {
        const collectionFactory = await context.nftCollectionFactory.connect(signer).createCollection(
            name,
            symbol,
            oracle.address,
            context.minGracePeriod,
            context.insolvencyGracePeriod
        );
        const createCollectionResult = await collectionFactory.wait();
        const collectionAddress = createCollectionResult.logs[0].address;
        return collectionAddress;
    }

    it("Mint Nft for collection", async function () {
        checkSkipTest(this.skipTest, this);
        let collectionsCount = await this.nftCollectionFactory.createdContractCount();
        expect(collectionsCount).to.equal(0);
        const collectionAddress = await createCollection(this, "watches", "symbol", this.signer, this.oracle1)
        const collectionContract = await ethers.getContractAt("LucidaoNftCollection", collectionAddress);
        expect(await collectionContract.whitelistedTransferAddressForMinter(this.oracle1.address))
            .to.be.equal(true);
        expect(await collectionContract.whitelistedTransferAddressForMinter(this.signer.address))
            .to.be.equal(false);
        expect(await collectionContract.whitelistedTransferAddressForMinter(this.owner1.address))
            .to.be.equal(false);
        await expect(collectionContract.safeMint(""))
            .to.be.revertedWith(`is missing role ${NFT_MINTER_ROLE}`);
        await (await collectionContract.connect(this.oracle1).safeMint("")).wait();
        expect(await collectionContract.totalSupply()).to.be.eq(1);
        await (await collectionContract.connect(this.signer)
            .removeAddressesFromWhitelistForMinterRole([this.oracle1.address])).wait();
        await expect(collectionContract.connect(this.oracle1).safeMint(""))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_TRANSFER);
    })

    it("Create collection with valid roles", async function () {
        checkSkipTest(this.skipTest, this);
        let collectionsCount = await this.nftCollectionFactory.createdContractCount();
        expect(collectionsCount).to.equal(0);

        const symbol = "wtch_1";
        await expect(createCollection(this, "watches", symbol, this.oracle1, this.oracle1)).to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_OWNER_CALLER);
        const collectionAddress = await createCollection(this, "watches", symbol, this.signer, this.oracle1)

        collectionsCount = await this.nftCollectionFactory.createdContractCount();
        expect(collectionsCount).to.equal(1);

        const createdCollectionContract = await this.nftCollectionFactory.createdContracts(0);
        expect(collectionAddress).to.equal(createdCollectionContract.collection);
        expect(createdCollectionContract.symbol).to.equal(symbol);
        expect(createdCollectionContract.oracle).to.equal(this.oracle1.address);

        const collectionContract = await ethers.getContractAt("LucidaoNftCollection", collectionAddress);
        const derivedminterAdminRole = await collectionContract.getRoleAdmin(NFT_MINTER_ROLE);
        expect(NFT_MINTER_ROLE_MANAGER).to.eq(derivedminterAdminRole);

        const derivedMinterManagerRole = await collectionContract.getRoleAdmin(NFT_MINTER_ROLE_MANAGER);
        expect(ADMIN_ROLE).to.eq(derivedMinterManagerRole);

        const derivedVaultAdminRole = await collectionContract.getRoleAdmin(VAULT_MANAGER_ROLE);
        expect(ADMIN_ROLE).to.eq(derivedVaultAdminRole);

        //Oracle
        const oracleHasAdminRole = await collectionContract.hasRole(ADMIN_ROLE, this.oracle1.address);
        expect(oracleHasAdminRole).to.be.false;
        const oracleHasMinterRoleManager = await collectionContract.hasRole(NFT_MINTER_ROLE_MANAGER, this.oracle1.address);
        expect(oracleHasMinterRoleManager).to.be.true;
        const oracleHasMinterRole = await collectionContract.hasRole(NFT_MINTER_ROLE, this.oracle1.address);
        expect(oracleHasMinterRole).to.be.true;
        const oracleHasVaulManagerRole = await collectionContract.hasRole(VAULT_MANAGER_ROLE, this.oracle1.address);
        expect(oracleHasVaulManagerRole).to.be.true;

        //signer
        const signerHasAdminRole = await collectionContract.hasRole(ADMIN_ROLE, this.signer.address);
        expect(signerHasAdminRole).to.be.true;
        const signerHasMinterRoleManager = await collectionContract.hasRole(NFT_MINTER_ROLE_MANAGER, this.signer.address);
        expect(signerHasMinterRoleManager).to.be.false;
        const signerHasMinterRole = await collectionContract.hasRole(NFT_MINTER_ROLE, this.signer.address);
        expect(signerHasMinterRole).to.be.false;
        const signerHasVaulManagerRole = await collectionContract.hasRole(VAULT_MANAGER_ROLE, this.signer.address);
        expect(signerHasVaulManagerRole).to.be.false;

        //collectionFactory
        const factoryHasAdminRole = await collectionContract.hasRole(ADMIN_ROLE, this.nftCollectionFactory.address);
        expect(factoryHasAdminRole).to.be.false;
        const factoryHasMinterRole = await collectionContract.hasRole(NFT_MINTER_ROLE, this.nftCollectionFactory.address);
        expect(factoryHasMinterRole).to.be.false;
        const factoryHasMinterRoleManager = await collectionContract.hasRole(NFT_MINTER_ROLE_MANAGER, this.nftCollectionFactory.address);
        expect(factoryHasMinterRoleManager).to.be.false;
        const factoryHasVaulManagerRole = await collectionContract.hasRole(VAULT_MANAGER_ROLE, this.nftCollectionFactory.address);
        expect(factoryHasVaulManagerRole).to.be.false;

        await createCollection(this, "watches", symbol, this.signer, this.oracle1)
        collectionsCount = await this.nftCollectionFactory.createdContractCount();
        expect(collectionsCount).to.equal(2);
    });

    it.skip("Remove collection", async function () {
    });

    it("upgrade factory implementation to V2", async function () {
        checkSkipTest(this.skipTest, this);
        expect(await (await upgrades.admin.getInstance()).owner()).to.be.equal(this.signer.address);
        const name = "watches_1";
        const symbol = "wtch_1";
        const newName = "watches_2";
        const newSymbol = "wtch_2";
        const deadline = getUnixEpoch(10);
        await createCollection(this, name, symbol, this.signer, this.oracle1)

        const LucidaoNftCollectionFactoryV2 = await ethers.getContractFactory("LucidaoNftCollectionFactoryV2");
        const lucidaoNftCollectionFactoryV2 = await upgrades.upgradeProxy(this.nftCollectionFactory.address,
            LucidaoNftCollectionFactoryV2,
            { call: { fn: 'migration', args: [] } }
        ) as LucidaoNftCollectionFactoryV2;

        expect(lucidaoNftCollectionFactoryV2.address).to.be.eq(this.nftCollectionFactory.address);
        await (await lucidaoNftCollectionFactoryV2.connect(this.signer).createCollection(
            newName,
            newSymbol,
            this.oracle1.address,
            this.minGracePeriod,
            this.insolvencyGracePeriod,
            deadline
        )).wait();
        let collectionsCount = await lucidaoNftCollectionFactoryV2.createdContractCount();
        expect(collectionsCount).to.equal(2);

        const firstCreatedCollection = (await lucidaoNftCollectionFactoryV2.createdContracts(0));
        const newCreatedCollection = (await lucidaoNftCollectionFactoryV2.createdContracts(1));
        expect(await lucidaoNftCollectionFactoryV2.isAKnownCollection(firstCreatedCollection.collection))
            .to.be.eq(true);
        expect(await lucidaoNftCollectionFactoryV2.isAKnownCollection(newCreatedCollection.collection))
            .to.be.eq(true);

        expect(firstCreatedCollection.tokenVersion)
            .to.be.eq(toBytes1("1"));

        expect(newCreatedCollection.tokenVersion)
            .to.be.eq(toBytes1("2"));

        //Cannot cast parent to child contract
        await expect((await ethers.getContractAt("LucidaoNftCollectionV2",
            firstCreatedCollection.collection)).sellDeadline())
            .to.be.revertedWith("call revert exception");

        //Can cast child to parent contract
        const newCollectionWrongCast = await ethers.getContractAt("LucidaoNftCollection",
            newCreatedCollection.collection);
        expect(await newCollectionWrongCast.name()).to.be.eq(newName);

        const newCollectionV2 = await ethers.getContractAt("LucidaoNftCollectionV2", newCreatedCollection.collection);
        expect(await newCollectionV2.sellDeadline()).to.be.eq(deadline);
        await setNetworkTimestampTo(deadline);

        const transactionReceipt = await mintNft(newCollectionV2, "", this.oracle1);
        const tokenId = getTokenId(transactionReceipt);
        await whitelistAddressesForOracleTransferOnNftCollection(newCollectionV2, this.signer, [this.owner1.address]);

        await expect(newCollectionV2.connect(this.oracle1)
            .transferFrom(this.oracle1.address, this.owner1.address, tokenId)
        ).to.be.revertedWith("Sell ended");
    })
}
