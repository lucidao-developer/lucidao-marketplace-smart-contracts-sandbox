import { expect } from 'chai';
import { BigNumber, ContractReceipt } from 'ethers';
import { ethers } from 'hardhat';
import { IPFS_BASE_URL, ZERO_ADDRESS } from '../config/config';
//import { BigNumberish } from "@ethersproject/bignumber";
//import BN from 'bn.js';
import {
    ADMIN_ROLE, NFT_MINTER_ROLE,
    VAULT_MANAGER_ROLE, NFT_MINTER_ROLE_MANAGER
} from '../config/roles';
import { getTokenId, mintNft, nftReceivedEventabi, removeAddressesFromWhitelistedOracleTransferOnNftCollection,
         SOLIDITY_ERROR_MSG, UNINITIALIZE_UINT256, whitelistAddressesForOracleTransferOnNftCollection } from './common';
import { checkSkipTest, getUnixEpoch, setNetworkTimestampTo } from './utilities';

export function nftCollectionBehavior(): void {
    async function baseNftCheck(context: Mocha.Context, transactionReceipt: ContractReceipt, tokenUri: string) {
        const tokenId = getTokenId(transactionReceipt);
        expect(tokenId).to.equal(0);
        const completeTokenUri = await context.nftCollection.tokenURI(tokenId.toString());
        expect(completeTokenUri).to.equal(`${IPFS_BASE_URL}${tokenUri}`);
    }

    it("Mint nft on nft collection", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        await expect(mintNft(this.nftCollection, tokenUri, this.signer)).to.be.revertedWith("AccessControl: account");
        await expect(mintNft(this.nftCollection, tokenUri, this.owner1)).to.be.revertedWith("AccessControl: account");
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        await baseNftCheck(this, transactionReceipt, tokenUri);
        const oracleBalance = await this.nftCollection.balanceOf(this.oracle1.address);
        expect(oracleBalance).to.equal(1);
        const tokenId = getTokenId(transactionReceipt);
        const tokenOwner = await this.nftCollection.ownerOf(tokenId);
        expect(tokenOwner).is.not.equal(this.signer.address);
        expect(tokenOwner).is.equal(this.oracle1.address);
        const deadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(deadline).is.equal(UNINITIALIZE_UINT256);
    });

    it("Test token URI", async function () {
        checkSkipTest(this.skipTest, this);
        let tokenUri = "";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        let tokenId = getTokenId(transactionReceipt);
        let completeTokenUri = await this.nftCollection.tokenURI(tokenId.toString());
        expect(completeTokenUri).to.equal(`${IPFS_BASE_URL}${tokenId}`);
        tokenUri = "myTokenUri";
        transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        tokenId = getTokenId(transactionReceipt);
        completeTokenUri = await this.nftCollection.tokenURI(tokenId.toString());
        expect(completeTokenUri).to.equal(`${IPFS_BASE_URL}${tokenUri}`);
    });

    it("Set token deadline", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);
        let newDeadline = getUnixEpoch(10);
        let vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.equal(UNINITIALIZE_UINT256);
        await expect(this.nftCollection.connect(this.owner1).setVaultServiceDeadline(tokenId, newDeadline))
            .to.be.revertedWith(`is missing role ${VAULT_MANAGER_ROLE}`);
        await (await this.nftCollection.connect(this.oracle1).setVaultServiceDeadline(tokenId, newDeadline)).wait();
        vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.equal(newDeadline);

        //cannot set a prev deadline
        newDeadline = getUnixEpoch(5);
        await expect(this.nftCollection.connect(this.oracle1).setVaultServiceDeadline(tokenId, newDeadline))
            .to.be.revertedWith("INftCollectionVaultService: new deadline is lower than the current one");

        //can update deadline
        newDeadline = getUnixEpoch(15);
        await (await this.nftCollection.connect(this.oracle1).setVaultServiceDeadline(tokenId, newDeadline)).wait();
        vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.equal(newDeadline);
    });

    it("Set a vault deadline in the past", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);
        let newDeadline = getUnixEpoch(-1000);
        let vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.equal(UNINITIALIZE_UINT256);
        await (await this.nftCollection.connect(this.oracle1).setVaultServiceDeadline(tokenId, newDeadline)).wait();
        vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.equal(newDeadline);
    });

    it("Approve for all", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);

        //set approval for nonexistent collection
        await this.nftCollection.connect(this.signer).setApprovalForAll(this.oracle1.address, true);

        //mark user as operator
        await this.nftCollection.connect(this.oracle1).setApprovalForAll(this.owner1.address, true);

        //unmark user as operator
        await this.nftCollection.connect(this.oracle1).setApprovalForAll(this.owner1.address, true);

        //mark signer as operator
        await this.nftCollection.connect(this.oracle1).setApprovalForAll(this.signer.address, true);
    });

    it.skip("Check contract with safe transfer", async function () {
    });

    it.skip("Set license manager", async function () {
    });

    it("Check Burn on nft collection", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        let tokenId = getTokenId(transactionReceipt);

        //Fake Owner burn
        await expect(this.nftCollection.connect(this.owner1).burn(tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_TOKEN_OWNER);
        await whitelistAddressesForOracleTransferOnNftCollection(this.nftCollection, this.signer, [this.owner1.address]);
        await (await this.nftCollection.connect(this.oracle1).transferFrom(this.oracle1.address, this.owner1.address, tokenId)).wait();
        //burn token after transfer from minter to new owner
        let realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.owner1.address);
        await expect(this.nftCollection.connect(this.oracle1).burn(tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_TOKEN_OWNER);

        //Real owner burn
        await this.nftCollection.connect(this.owner1).burn(tokenId);
        await expect(this.nftCollection.ownerOf(tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.INVALID_TOKEN);

        transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        tokenId = getTokenId(transactionReceipt);

        //Admin cannot burn nft token (FIXME: check if is correct)
        await expect(this.nftCollection.connect(this.signer).burn(tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_TOKEN_OWNER);

        //Oracle can burn only if real owner
        realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.oracle1.address);
        await this.nftCollection.connect(this.oracle1).burn(tokenId);
        await expect(this.nftCollection.ownerOf(tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.INVALID_TOKEN);
    });

    it("Oracle sets approvalForAll for an owner that burns the token", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);
        this.nftCollection.connect(this.oracle1).setApprovalForAll(this.owner1.address, true);
        await this.nftCollection.connect(this.owner1).burn(tokenId);
        await expect(this.nftCollection.ownerOf(tokenId)).to.be.revertedWith(SOLIDITY_ERROR_MSG.INVALID_TOKEN);
    });

    it("Check Role", async function () {
        checkSkipTest(this.skipTest, this);
        expect(await this.nftCollection.MINTER_ROLE()).to.equal(NFT_MINTER_ROLE);
        expect(await this.nftCollection.VAULT_MANAGER_ROLE()).to.equal(VAULT_MANAGER_ROLE);
        expect(await this.nftCollection.DEFAULT_ADMIN_ROLE()).to.equal(ADMIN_ROLE);
        expect(await this.nftCollection.MINTER_ROLE_MANAGER()).to.equal(NFT_MINTER_ROLE_MANAGER);
    });

    it("Test minter admin role", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        await expect(this.nftCollection.connect(this.oracle1)
            .grantRole(NFT_MINTER_ROLE_MANAGER, this.owner2.address))
            .to.be.revertedWith(`is missing role ${ADMIN_ROLE}`);

        await expect(this.nftCollection.connect(this.owner1)
            .grantRole(NFT_MINTER_ROLE, this.owner2.address))
            .to.be.revertedWith(`is missing role ${NFT_MINTER_ROLE_MANAGER}`);

        await expect(mintNft(this.nftCollection, tokenUri, this.owner2))
            .to.be.revertedWith(`is missing role ${NFT_MINTER_ROLE}`);

        await (await this.nftCollection.connect(this.oracle1)
            .grantRole(NFT_MINTER_ROLE, this.owner2.address)
        ).wait();

        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.owner2);
        const tokenId = getTokenId(transactionReceipt);
        let realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.oracle1.address);
        await expect(this.nftCollection.connect(this.owner2)
            .transferFrom(this.oracle1.address,
                this.owner1.address,
                tokenId)
        ).to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_TOKEN_OWNER);

        await expect(this.nftCollection.connect(this.owner1)
            .grantRole(NFT_MINTER_ROLE, this.owner2.address))
            .to.be.revertedWith(`is missing role ${NFT_MINTER_ROLE_MANAGER}`);

        //the admin role cannot revoke the minter role
        await expect(this.nftCollection.connect(this.signer)
            .revokeRole(NFT_MINTER_ROLE, this.owner2.address))
            .to.be.revertedWith(`is missing role ${NFT_MINTER_ROLE_MANAGER}`);

        await (await this.nftCollection.connect(this.oracle1)
            .revokeRole(NFT_MINTER_ROLE, this.owner2.address)).wait();

        await expect(mintNft(this.nftCollection, tokenUri, this.owner2))
            .to.be.revertedWith(`is missing role ${NFT_MINTER_ROLE}`);

        await expect(this.nftCollection.connect(this.oracle1)
            .grantRole(NFT_MINTER_ROLE_MANAGER, this.owner2.address))
            .to.be.revertedWith(`is missing role ${ADMIN_ROLE}`);

        await (await this.nftCollection.connect(this.signer)
            .grantRole(NFT_MINTER_ROLE_MANAGER, this.owner2.address)).wait();

        const owner2HasMinterManagerRole = await this.nftCollection.connect(this.owner2)
            .hasRole(NFT_MINTER_ROLE_MANAGER,
                this.owner2.address);

        expect(owner2HasMinterManagerRole).to.be.eq(true);
    });

    it.skip("Oracle sets approvalForAll for an owner that tries the transfer", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);
        this.nftCollection.connect(this.oracle1).setApprovalForAll(this.owner1.address, true);
        await expect(this.nftCollection.connect(this.owner1).transferFrom(this.oracle1.address,
            this.owner2.address,
            tokenId))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_TRANSFER);
    });

    it.skip("Test whitelisting for oracle's transfer", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        let tokenId = getTokenId(transactionReceipt);

        await expect(this.nftCollection.connect(this.oracle1)
            .transferFrom(this.oracle1.address, this.owner1.address, tokenId)
        ).to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_TRANSFER);

        await (await this.nftCollection.connect(this.oracle1).approve(this.owner1.address, tokenId)).wait();

        await expect(this.nftCollection.connect(this.owner1)
            .transferFrom(this.oracle1.address, this.owner1.address, tokenId)
        ).to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_TRANSFER);

        await (await this.nftCollection.connect(this.oracle1).setApprovalForAll(this.owner1.address, true)).wait();

        await expect(this.nftCollection.connect(this.owner1)
            .transferFrom(this.oracle1.address, this.owner1.address, tokenId)
        ).to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_TRANSFER);

        await expect(whitelistAddressesForOracleTransferOnNftCollection(this.nftCollection,
            this.oracle1,
            [this.owner1.address])
        ).to.be.revertedWith(`is missing role ${ADMIN_ROLE}`);

        await whitelistAddressesForOracleTransferOnNftCollection(this.nftCollection,
            this.signer,
            [this.owner1.address]);

        await (await this.nftCollection.connect(this.oracle1)
            .transferFrom(this.oracle1.address, this.owner1.address, tokenId)).wait();

        let realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.owner1.address);

        await (await this.nftCollection.connect(this.owner1)
        ['safeTransferFrom(address,address,uint256)'](this.owner1.address,
            this.oracle1.address,
            tokenId)).wait();

        await removeAddressesFromWhitelistedOracleTransferOnNftCollection(this.nftCollection,
            this.signer,
            [this.owner1.address, this.oracle1.address, ZERO_ADDRESS]);

        await expect(this.nftCollection.connect(this.oracle1)
            .transferFrom(this.oracle1.address, this.owner1.address, tokenId)
        ).to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_TRANSFER);

        await expect(this.nftCollection.connect(this.oracle1)
            .burn(tokenId))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_TRANSFER)
    });

    it("oracle can transfer approved nft", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        let tokenId = getTokenId(transactionReceipt);

        await whitelistAddressesForOracleTransferOnNftCollection(this.nftCollection,
            this.signer,
            [this.owner1.address]);

        await (await this.nftCollection.connect(this.oracle1)
            .transferFrom(this.oracle1.address, this.owner1.address, tokenId)).wait();

        await expect(this.nftCollection.connect(this.oracle1)
            .transferFrom(this.owner1.address, this.oracle1.address, tokenId))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_TOKEN_OWNER);

        await (await this.nftCollection.connect(this.owner1).approve(this.oracle1.address, tokenId)).wait();

        await (await this.nftCollection.connect(this.oracle1)
            .transferFrom(this.owner1.address, this.owner2.address, tokenId)).wait();

        const tokenOwner = await this.nftCollection.ownerOf(tokenId);
        expect(tokenOwner).to.be.equal(this.owner2.address);
    });

    it("check deadline", async function () {
        checkSkipTest(this.skipTest, this);
        //TODO: check service deadline behavior
    })

    it("test seize with a vault service deadline and return token to owner", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const origTokenId = getTokenId(transactionReceipt);
        let newDeadline = getUnixEpoch(100);
        let vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(origTokenId);
        await (await this.nftCollection.connect(this.oracle1).setVaultServiceDeadline(origTokenId, newDeadline)).wait();
        vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(origTokenId);
        expect(vaultServiceDeadline).is.equal(newDeadline);
        await whitelistAddressesForOracleTransferOnNftCollection(this.nftCollection, this.signer, [this.owner1.address]);
        await (await this.nftCollection.connect(this.oracle1).transferFrom(this.oracle1.address, this.owner1.address, origTokenId)).wait();
        let realOwner = await this.nftCollection.ownerOf(origTokenId);
        const owner1Balance = await this.nftCollection.balanceOf(this.owner1.address);
        expect(realOwner).to.be.equal(this.owner1.address);

        await expect(this.nftCollection.connect(this.oracle1).seize(origTokenId))
            .to.be.revertedWith(`missing role ${ADMIN_ROLE}`);

        await expect(this.nftCollection.seize(origTokenId))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_SEIZE);

        await setNetworkTimestampTo(newDeadline);

        await expect(this.nftCollection.connect(this.signer).seize(origTokenId))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_SEIZE);

        //TODO: test minGracePeriod
        let grace_months = await this.nftCollection.insolvencyGracePeriod();
        //testing gte condition
        await setNetworkTimestampTo(grace_months.add(newDeadline).sub(1).toNumber());

        await expect(this.nftCollection.seize(origTokenId))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.CANNOT_SEIZE);

        const receipt = await (await this.nftCollection.seize(origTokenId)).wait();
        const nftReceivedEvent = receipt.events?.find((x) => { return x.event == "NftReceived" });
        if (!nftReceivedEvent) {
            throw Error("Missing event NftReceived");
        }
        let iface = new ethers.utils.Interface(nftReceivedEventabi);
        const parsedNftReceivedEvent = iface.parseLog(nftReceivedEvent);
        const { collectionAddress, from, operator, tokenId } = parsedNftReceivedEvent.args;

        expect(collectionAddress).to.be.equal(this.nftCollection.address);
        expect(from).to.be.equal(this.owner1.address);
        expect(tokenId).to.be.equal(origTokenId);
        expect(operator).to.be.equal(this.signer.address);

        realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.governanceNftTreasury.address);
        const newOwner1Balance = await this.nftCollection.balanceOf(this.owner1.address);
        expect(newOwner1Balance).to.be.equal(owner1Balance.sub(1));

        await expect(this.governanceNftTreasury.connect(this.owner2).approveToken(this.nftCollection.address,
            this.signer.address,
            tokenId))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.NOT_OWNER_CALLER);

        await (await this.governanceNftTreasury.connect(this.timelock).approveToken(this.nftCollection.address,
            this.owner2.address,
            tokenId)).wait();

        await this.nftCollection.connect(this.owner2).transferFrom(this.governanceNftTreasury.address,
            this.owner2.address,
            tokenId);

        realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.owner2.address);
        expect(await this.nftCollection.balanceOf(this.governanceNftTreasury.address))
            .to.be.equal(0);
        expect(await this.nftCollection.balanceOf(this.owner2.address))
            .to.be.equal(1);
    });

    it("test seize without a vault service deadline", async function () {
        checkSkipTest(this.skipTest, this);
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);
        const vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.equal(UNINITIALIZE_UINT256);
        await whitelistAddressesForOracleTransferOnNftCollection(this.nftCollection, this.signer, [this.owner1.address]);
        await (await this.nftCollection.connect(this.oracle1).transferFrom(this.oracle1.address, this.owner1.address, tokenId)).wait();

        let realOwner = await this.nftCollection.ownerOf(tokenId);
        const owner1Balance = await this.nftCollection.balanceOf(this.owner1.address);
        expect(realOwner).to.be.equal(this.owner1.address);

        await expect(this.nftCollection.seize(tokenId))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.DEADLINE_NOT_SET);

        let grace_months = await this.nftCollection.insolvencyGracePeriod();
        await setNetworkTimestampTo(grace_months.add(getUnixEpoch(100)).toNumber());

        await expect(this.nftCollection.seize(tokenId))
            .to.be.revertedWith(SOLIDITY_ERROR_MSG.DEADLINE_NOT_SET);
    });
}