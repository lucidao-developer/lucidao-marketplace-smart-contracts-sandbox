import { getOrDeployLicenseManager } from "./deployFunctions";

async function main() {
    // await getOrDeployLicenseManager();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
