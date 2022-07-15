import { isDevelopment, myDotenvConfig, onMumbaiChain } from '../scripts/utilities';

interface IProcessEnv {
    MNEMONIC: string
    FTMSCAN_API_KEY: string
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends IProcessEnv { }
    }
}

myDotenvConfig();

if (isDevelopment()) {
    //change parameters value
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const IPFS_BASE_URL = "ipfs://";

let governanceTreasuryAddress: string | undefined = "";
let fusdtAddress: string | undefined = "";
let farmAddress: string | undefined = "";
let fakeUsdAddress: string | undefined = "";

let governanceNftReserveAddress: string | undefined = "";
let licenseManagerAddress: string | undefined = "";
let feeManagerAddress: string | undefined = "";
let nftCollectionFactoryAddress: string | undefined = "";
let nftCollateralRetrieverAddress: string | undefined = "";

//TODO: check config parameters value
const stakedTokens = 1000;
const servicePid = 0;
const tokensForEligibility = 0;
const redemptionFee = 1; //Chain Native Token
const insolvencyGracePeriod = 15552000; //seconds: 180 days;
const minGracePeriod = 5184000; //seconds: 60 days

if (onMumbaiChain()) {
    nftCollectionFactoryAddress = process.env.RopstenNftCollectionFactoryAddress;
    governanceTreasuryAddress = process.env.RopstenGovernanceTreasuryAddress;
    licenseManagerAddress = process.env.RopstenLicenseManagerAddress;
    feeManagerAddress = process.env.RopstenFeeManagerAddress;
    governanceNftReserveAddress = process.env.RopstenGovernanceNftReserveAddress;
    fusdtAddress = process.env.RopstenFusdtAddress;
    farmAddress = process.env.RopstenFarmAddress;
    fakeUsdAddress = process.env.RopstenFakeUsdAddress;
    nftCollateralRetrieverAddress = process.env.RopstenCollateralRetrieverAddress;
}

export {
    nftCollectionFactoryAddress,
    governanceTreasuryAddress,
    licenseManagerAddress,
    feeManagerAddress,
    governanceNftReserveAddress,
    fusdtAddress,
    farmAddress,
    fakeUsdAddress,
    nftCollateralRetrieverAddress,
    stakedTokens,
    servicePid,
    tokensForEligibility,
    redemptionFee,
    insolvencyGracePeriod,
    minGracePeriod
};
