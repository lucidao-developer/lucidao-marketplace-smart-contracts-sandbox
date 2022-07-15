import { getOrDeployFakeUsd } from "./deployFunctions";

async function main() {
    await getOrDeployFakeUsd();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });