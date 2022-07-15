<h2 align="center">Lucidao Marketplace</h3>

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

<p align="center"> Collection of smart contracts, scripts and tests for the management of the Lucidao Marketplace platform.
    <br> 
</p>

---

### Setup
The repository uses Docker Compose.
Prior to conducting any action, you must start the **test_lucidao_marketplace_smart_contracts container**.

Follow the instructions to setup the repository for testing or deploying the Lucidao contracts:

- Install docker and docker-compose:

```
  $ cd docker/
  $ docker-compose -f docker-compose.yml up --build -d
```

### Testing
- Run a bash instance in the container:

```
    $ docker exec -it test_lucidao_marketplace_smart_contracts bash
```

- Prepare the contracts and run the tests from inside the container:

```
    $ npx hardhat typechain
    $ npm run test --silent
```

### Development
Setup the development environment by following the next instructions:

- Create an enviroment file named **.env.development** and fill it with the following enviroment variables:

```
    $ touch .env.development
```

- Add a **Mnemonic** (only first address will be used)

        MNEMONIC=""

- Add a **Ftmscan Api Key**

        FTMSCAN_API_KEY=""

- Run the container

```
    $ docker-compose -f docker-compose.development.yml up --build -d
```

- To deploy a contract, run the associated script:

```
    $ npx hardhat run scripts/_deployScriptName_.ts
```

### Integrations
The Lucidao Marketplace integrates with the [0x v4 NFT Protocol](https://docs.0x.org/nft-support/docs/introduction) and the [SwapSDK Hosted Orderbook](https://docs.swapsdk.xyz/) to provide a secure environment for managing non-custodial NFT listings.

### Documentation
| ![Lucidao Marketplace Use Case Diagram](https://storageapi.fleek.co/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/use-case-diagram.jpg) |
|:--:|
| <b>Lucidao Marketplace Smart Contracts Use Case Diagram</b>|

| ![Nft Collection Factory Activity Diagram](https://storageapi.fleek.co/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/nft-collection-factory-activity-diagram.jpg) |
|:--:|
| <b>Lucidao Marketplace Nft Collection Factory Activity Diagram</b>|

| ![Nft Collection Activity Diagram](https://storageapi.fleek.co/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/nft-collection-activity-diagram.jpg) |
|:--:|
| <b>Lucidao Marketplace Nft Collection Activity Diagram</b>|

| ![Nft Collateral Retriever Activity Diagram](https://storageapi.fleek.co/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/nft-collateral-retriever-activity-diagram.jpg) |
|:--:|
| <b>Lucidao Marketplace Nft Collateral Retriever Activity Diagram</b>|

| ![License Manager Activity Diagram](https://storageapi.fleek.co/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/license-manager-activity-diagram.jpg) |
|:--:|
| <b>Lucidao Marketplace License Manager Activity Diagram</b>|

| ![Fee Manager Activity Diagram](https://storageapi.fleek.co/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/fee-manager-activity-diagram.jpg) |
|:--:|
| <b>Lucidao Marketplace Fee Manager Activity Diagram</b>|