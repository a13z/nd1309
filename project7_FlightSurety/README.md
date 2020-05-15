# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

Start Ganache first:
`ganache-cli -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" -a 50`
Run tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate --reset`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## How To Use the DAPP
The DAAP interface is a simple HTML form with all the fields needed to perform some operations and interact with the smart contract.
The DAPP interface has 4 buttons which trigger 7 smart contract calls. Through the DAPP interface we can:
- Register an Airline. An airline picked from the HTML will be registered and funded.
- Buy an Insurance for a Flight. This will also Register a Flight prior buy passenger's insurance.
- Withdraw funds. This will run credit insurees smart contract function prior paying a passenger.

Depending on the actions the workflow would be:
To buy an insurance for a flight
1. Select a passenger from the list
2. Select an Airlie from the combo. `Note:` The first one from the list is already registered and funded. To use a different Airline we need to register first.
3. Type a flight number
4. Type a time
5. Type the amount insure
5. Click in the Buy Insurance button.

To check the status of a flight:
1. Go to the flight textbox at the bottom of the page
2. Type the flight number
3. Click in the Submit to Oracles button

To register an airline"
1. Select an Airline from the combo except the first one which is already registerd and funded
2. Click in the Register Airline button

## Screenshots and logs

There is a folder in this repository with some screenshots and log with smart contract events showing how it works
[Image description](https://github.com/dramagods/nd1309/project7_FlightSurety/screenshots_logs)

## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)