import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import {
    LucidaoNftCollateralRetriever, LucidaoNftCollection, LucidaoNftCollectionFactory,
    LucidaoFeeManager, LucidaoLicenseManager, AnyswapV3ERC20,
    LucidaoGovernanceReserve,
    TestFarm, LucidaoGovernanceNftReserve
} from "../typechain";

declare module "mocha" {
    export interface Context {
        zero: BigNumber;
        oneEth: BigNumber;
        negativeOneEth: BigNumber;
        snapshot: Uint8Array | undefined;
        skipTest: boolean;

        signer: SignerWithAddress;
        oracle1: SignerWithAddress;
        owner1: SignerWithAddress;
        owner2: SignerWithAddress;
        timelock: SignerWithAddress;
        governanceTreasury: LucidaoGovernanceReserve;
        governanceNftTreasury: LucidaoGovernanceNftReserve;
        addressZero: string;
        signers: SignerWithAddress[];

        nftCollection: LucidaoNftCollection;
        nftCollectionFactory: LucidaoNftCollectionFactory;
        nftCollateralRetriever: LucidaoNftCollateralRetriever;
        nftLicenseManager: LucidaoLicenseManager;
        nftFeeManager: LucidaoFeeManager;
        fUsdt: AnyswapV3ERC20;

        testFarm: TestFarm;
        stakedTokens: number;
        servicePid: number;
        redemptionFee: number;
        tokensForEligibility: number;
        minGracePeriod: number;
        insolvencyGracePeriod: number;
    }
}