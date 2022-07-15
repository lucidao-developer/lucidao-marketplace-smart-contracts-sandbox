import fs from 'fs';
import path from 'path';

const newPrefix = 'FakeAltro';
const newTokenPrefix = 'FCA';
const newFUSDTPrefix = 'FakeUsdt';
const newTestFarmPrefix = 'FakeAltroTestFarm';
const newFUSDTName = 'FakeUsdt';
const anonymizedContractsPath = '"anonymized-contracts/';

async function copyRecursiveSync(src: string, dest: string) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats && stats.isDirectory();
    if (isDirectory) {
        fs.mkdirSync(dest);
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest,
                childItemName.replace(/Lucidao/g, newPrefix)));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

function replaceContractPrefixInFile(destFilename: string) {
    const data = fs.readFileSync(destFilename, { encoding: 'utf8' });
    let result = data.replace(/Lucidao/g, newPrefix);
    result = result.replace(/LCD/g, newTokenPrefix);
    //fusdt
    result = result.replace(/AnyswapV3ERC20/g, newFUSDTPrefix);
    result = result.replace(/Frapped USDT/g, newFUSDTName);
    //testfarm
    result = result.replace(/TestFarm/g, newTestFarmPrefix);
    //anonymized contract path
    result = result.replace(/"contracts\//g, anonymizedContractsPath);
    result = result.replace(/contract: `contracts\//g, "contract: `anonymized-contracts\/");
    fs.writeFileSync(destFilename, result, { encoding: 'utf8' });
}

// function patchFUsdtInDeployFunctions(destFilename: string) {
//     const data = fs.readFileSync(destFilename, { encoding: 'utf8' });
//     let result = data.replace(/"Frapped USDT"/g, '"' + newPrefix + ' USDT"');
//     result = data.replace(/"fUSDT"/g, '"' + newPrefix + 'USDT"');
//     result = data.replace(/"contracts\//g, '"anonymized-contracts/');
//     fs.writeFileSync(destFilename, result, { encoding: 'utf8' });
// }

function walk(dir: string) {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else {
            /* Is a file */
            results.push(file);
        }
    });
    return results;
}

async function anonymizedScriptsManagement(anonymizeScriptContractFolder: string) {
    const utilitiesScripts = path.join(__dirname, '../scripts/utilities.ts');
    const utilitiesScriptsInAnonymizedFolder = path.join(anonymizeScriptContractFolder,
        'utilities.ts');

    const deployEverythingScripts = path.join(__dirname, '../scripts/deployEverything.ts');
    const anonymizedDeployEverythingScripts = path.join(anonymizeScriptContractFolder,
        'anonymizeDeployEverything.ts');

    const deployFunctionsScripts = path.join(__dirname, '../scripts/deployFunctions.ts');
    const anonymizedDeployFunctionsScripts = path.join(anonymizeScriptContractFolder,
        'deployFunctions.ts');

    const verifyScripts = path.join(__dirname, '../scripts/verifyContract.ts');
    const anonymizedVerifyScripts = path.join(anonymizeScriptContractFolder,
        'anonymizedVerifyContract.ts');

    console.log(`Removing scripts from folder: ${anonymizeScriptContractFolder}`);
    if (fs.existsSync(anonymizeScriptContractFolder)) {
        fs.rmdirSync(anonymizeScriptContractFolder, { recursive: true });
    }

    fs.mkdirSync(anonymizeScriptContractFolder);
    fs.copyFileSync(deployEverythingScripts, anonymizedDeployEverythingScripts);
    fs.copyFileSync(deployFunctionsScripts, anonymizedDeployFunctionsScripts);
    fs.copyFileSync(utilitiesScripts, utilitiesScriptsInAnonymizedFolder);
    fs.copyFileSync(verifyScripts, anonymizedVerifyScripts);
    replaceContractPrefixInFile(anonymizedDeployEverythingScripts);
    replaceContractPrefixInFile(anonymizedDeployFunctionsScripts);
    replaceContractPrefixInFile(anonymizedVerifyScripts);
    //patchFUsdtInDeployFunctions(anonymizedDeployFunctionsScripts)

    console.log("Built scripts for anonymized contract deploy....!");
}

async function anonymizedContractsManagement(contractsFolder: string, anonymizeContractFolder: string) {
    console.log(`Removing contracts from folder: ${anonymizeContractFolder}`);
    if (fs.existsSync(anonymizeContractFolder)) {
        fs.rmdirSync(anonymizeContractFolder, { recursive: true });
    }
    await copyRecursiveSync(contractsFolder, anonymizeContractFolder);
    // walk(contractsFolder).forEach(sourceFilename => {
    //     let destFilename = sourceFilename.replace("contracts", "anonymized-contracts").replace("LuciDao", newPrefix);
    //     let dirName = path.dirname(destFilename);
    //     if (!fs.existsSync(dirName)) {
    //         fs.mkdirSync(dirName, { recursive: true });
    //     }
    //     fs.copyFileSync(sourceFilename, destFilename);
    // });

    walk(anonymizeContractFolder).forEach(destFilename => {
        replaceContractPrefixInFile(destFilename);
    });
    console.log("Contracts anonymization done....!");
}

async function main() {
    const contractsFolder = path.join(__dirname, '../contracts');
    const anonymizeContractFolder = path.join(__dirname, '../anonymized-contracts');
    const anonymizeScriptContractFolder = path.join(__dirname, '../anonymized-scripts');

    await anonymizedContractsManagement(contractsFolder, anonymizeContractFolder);
    await anonymizedScriptsManagement(anonymizeScriptContractFolder);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
