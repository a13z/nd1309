const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = async (deployer) => {

    let firstAirline = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';

    await deployer.deploy(FlightSuretyData, firstAirline);
    let flightSuretyDataDeployed = await FlightSuretyData.deployed();

    await deployer.deploy(FlightSuretyApp, flightSuretyDataDeployed.address);
    let flightSuretyAppDeployed = await FlightSuretyApp.deployed();

    await flightSuretyDataDeployed.authorizeCaller(flightSuretyAppDeployed.address);

    // fund first airline
    await flightSuretyAppDeployed.fund({from: firstAirline, value: 10000000000000000000});

    let config = {
        localhost: {
            url: 'http://localhost:8545',
            dataAddress: flightSuretyDataDeployed.address,
            appAddress: flightSuretyAppDeployed.address,
            firstAirline: firstAirline,
            gas: deployer.networks[deployer.network].gas,
        }
    };
    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');

};