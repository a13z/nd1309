# Udacity Blockchain Capstone

The capstone will build upon the knowledge you have gained in the course in order to build a decentralized housing product. 

## Install dependencies

This repository contains Smart Contract code in Solidity (using Truffle) and tests (also using Truffle). This code requires
some library dependencies to work and which we need install first.

To install dependencies, first clone this repo and run the following command to install the dependencies:

`npm install`

## Compile the Smart Contracts
Change directory where the smart contracts are:
`cd eth-contracts`

To compile the smart contracts run the following command:
`truffle compile`

## Run tests

Tests are located in the test folder inside the eth-folder. To run truffle tests we need to run a local blockchain first, in this case, ganache-cli:

To start Ganache-cli run the following command:
`ganache-cli -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" -a 10`

There are three type of tests, divided on what the are testing, to run them execute the following command:

`truffle test ./test/TestERC721Mintable.js`  Test the ERC721Mintable token in this case the RealEstateToken
`truffle test ./test/TestSquareVerifier.js`  Test the Verifier smart contract created by ZoKrates
`truffle test ./test/TestSolnSquareVerifier.js`  Test the ERC721Mintable and Verifier integration in a smart contract named SolnSquareVerifier

To run all tests:
``truffle test`

## Deploy to Rinkeby

To deploy the code into the Rinkeby network, you need to have an Infura account since the deployment is done through their nodes.
Then you need to fill in the InfuraKey in `truffle-config.js` and have you mnemonic secret stored in a file `.secret` inside eth-contracts. 

To deploy the contracts to Rinkeby run the following command:
`truffle migrate --network rinkeby`

### Rinkeby deployment details

The project and smart contracts are deployed to Rinkeby and these are the details:

Verifier address:
```
   > contract address:    0xd7c062397A401A353FFB77934F510142C19018B9
   https://rinkeby.etherscan.io/address/0xd7c062397A401A353FFB77934F510142C19018B9
```

SolnSquareVerifier address:
```
   > contract address:    0x92a7caCE0a3701B37cc32Eb7eAb6173568360cc5
   > https://rinkeby.etherscan.io/token/0x92a7caCE0a3701B37cc32Eb7eAb6173568360cc5
```

Deployment/Owner address: `0x3e9a8e5Fc9246eC11ce56Ec5b727e6168C6F808e`

# Minting tokens

To mint tokens you can use MyEtherWallet (MEW) inteface using the SolnSqareVerifier smart contract deployment address and the ABI of the contract which can be found in root folder of this repository named `SolnSquareVerifier.abi`.

Here is the URL to interact with the smart contract https://www.myetherwallet.com/interface/interact-with-contract

# Opensea storefront

The opensea storefron in Rinkeby is:
`https://rinkeby.opensea.io/assets/real-estate-token-v9`

And the activity of selling properties can be found here:
`https://rinkeby.opensea.io/activity/real-estate-token-v9`

# Project Resources

* [Remix - Solidity IDE](https://remix.ethereum.org/)
* [Visual Studio Code](https://code.visualstudio.com/)
* [Truffle Framework](https://truffleframework.com/)
* [Ganache - One Click Blockchain](https://truffleframework.com/ganache)
* [Open Zeppelin ](https://openzeppelin.org/)
* [Interactive zero knowledge 3-colorability demonstration](http://web.mit.edu/~ezyang/Public/graph/svg.html)
* [Docker](https://docs.docker.com/install/)
* [ZoKrates](https://github.com/Zokrates/ZoKrates)
