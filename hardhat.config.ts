import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { isDevelopment, myDotenvConfig } from "./scripts/utilities";

myDotenvConfig();

const chainIds = {
  hardhat: 31337,
  ftmTestnet: 4002,
  ftmMainnet: 250,
  ropsten: 3,
  polygonTestnet: 80001,
  polygonMainnet: 137
};

let mnemonic: string;

if (!process.env.MNEMONIC) {
  throw new Error("Please set your MNEMONIC in the .env file");
} else {
  mnemonic = process.env.MNEMONIC;
}

let ftmscanApiKey: string;
let etherscanApiKey = "";
let polygonscanApiKey = "";

if (!process.env.FTMSCAN_API_KEY) {
  throw new Error("Please set your FTMSCAN_API_KEY in the .env file");
} else {
  ftmscanApiKey = process.env.FTMSCAN_API_KEY;
}

if (process.env.npm_lifecycle_script && process.env.npm_lifecycle_script.indexOf("ropsten") > -1 && process.env.ETHERSCAN_API_KEY) {
  etherscanApiKey = process.env.ETHERSCAN_API_KEY;
}

if (process.env.npm_lifecycle_script && process.env.npm_lifecycle_script.indexOf("polygonTestnet") > -1 && process.env.POLYGONSCAN_API_KEY) {
  polygonscanApiKey = process.env.POLYGONSCAN_API_KEY;
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts: { mnemonic: mnemonic },
    },
    hardhat: {
      accounts: {
        mnemonic: mnemonic,
        accountsBalance: "90000000000000000000000",
        count: 10
      },
      chainId: chainIds.hardhat,
      gas: 950000000,
      blockGasLimit: 950000000,
      allowUnlimitedContractSize: true
    },
    ftmTestnet: {
      url: "https://rpc.testnet.fantom.network/",
      chainId: chainIds.ftmTestnet,
      accounts: { mnemonic: mnemonic },
    },
    ftmMainnet: {
      url: "https://rpc.ftm.tools",
      chainId: chainIds.ftmMainnet,
      accounts: { mnemonic: mnemonic },
    },
    polygonTestnet: {
      url: "https://rpc-mumbai.matic.today",
      chainId: chainIds.polygonTestnet,
      accounts: { mnemonic: mnemonic },
    },
    polygonMainnet: {
      url: "https://polygon-rpc.com/",
      chainId: chainIds.polygonMainnet,
      accounts: { mnemonic: mnemonic },
      gasMultiplier: 3,
      gas: 3000000
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      ropsten: etherscanApiKey,
      ftmTestnet: ftmscanApiKey,
      opera: ftmscanApiKey,
      polygon: polygonscanApiKey,
      polygonMumbai: polygonscanApiKey
    }
  }
};

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("ftmscan", "validate smart contract on ftmscan", async (args, hre) => {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying account: ${deployer.address}`);

  await hre.run("verify: verify", {
    address: deployer.address
  })
});

if (isDevelopment()) {
  // let onMainnet = false;
  let deployingAnonymizedContractsScript = process.env.npm_lifecycle_script?.indexOf('anonymizeDeployEverything');
  let deployingAnonymizedVerifyScript = process.env.npm_lifecycle_script?.indexOf('anonymizedVerifyContract');
  let anonymizedScript = process.env.npm_lifecycle_script?.indexOf('anonymize-contracts');

  // process.argv.forEach(param => {
  //   if(param.toLowerCase().indexOf('mainnet')>-1){
  //     onMainnet = true;
  //   }
  // });

  if (
    (deployingAnonymizedContractsScript && deployingAnonymizedContractsScript > -1)
    ||
    (anonymizedScript && anonymizedScript > -1)
    ||
    (deployingAnonymizedVerifyScript && deployingAnonymizedVerifyScript > -1)
  ) {
    config.paths = {
      sources: "./anonymized-contracts",
    };
  };
}

console.log(`Contracts Path: ${config.paths ? config.paths.sources : "contracts"}`);
export default config;
