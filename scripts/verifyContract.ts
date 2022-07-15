import { verifyContract } from "./deployFunctions";

async function main() {
  var contractName = "";

  //npx hardhat verify --network polygonTestnet 0xD17AE825EAbB4a2712AdF8ca8aaBdF992E043B1b 'Watches2' 'wtch2' '0x14C4e654e81d538dCDFcb7264253Ef31a555cc4B' '0xD10fab07Afd4bF7d6c3F0254051AfAC0736902F2' '0xE93BD6cAdC253fDe25Be7f0446daf86028e2d18E' 0 86400

  const contractArgs = ['Watches', 'WTC', '0x2e756170fF277FB05b96648Dc3eF88CC96753a79', '0xd10fab07afd4bf7d6c3f0254051afac0736902f2', '0x60933dcd00a171ebccf7670952251f109d3f5544', 5184000, 15552000] as const;

  await verifyContract("LucidaoNftCollection",
    {
      address: "0xF6BF17E8506B9e8d61944eBc7559Ea7cad8C48b4",
      constructorArguments: contractArgs,
      contract: "contracts/LucidaoNftCollection.sol:LucidaoNftCollection",
    });

  // await verifyContract(contractName, { address: "" });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
