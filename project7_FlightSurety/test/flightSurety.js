var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let newAirline = accounts[10];

      let reverted = false;
      try 
      {
          // await config.flightSurety.setTestingMode(true);
          await config.flightSuretyApp.registerAirline.call(newAirline, { from: config.firstAirline });

      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) sends 6 ether to the smart contract using fund() it is less than 10 ether so it is not funded', async () => {

    // ACT
    try {
        await config.flightSuretyApp.fund({from: config.firstAirline, value: web3.utils.toWei("6", "ether")});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isAirlineFunded(config.firstAirline); 
    let numberAirlines = await config.flightSuretyApp.numAirlines(); 
    let numberRegisteredAirlines = await config.flightSuretyApp.numRegisteredAirlines(); 
    let numberFundedRegistered = await config.flightSuretyApp.numFundedAirlines(); 

    // ASSERT
    assert.equal(result, false, "Airline sent less than 10 ether and it is not funded");
    assert.equal(numberAirlines, 1);
    assert.equal(numberRegisteredAirlines, 1);
    assert.equal(numberFundedRegistered, 0);

  });


//   it('(airline) add 6 more ether to the smart contract using fund() it sent more than 10 ether so it is funded', async () => {

//     // ACT
//     try {
//         await config.flightSuretyApp.fund({from: config.firstAirline, value: web3.utils.toWei("10", "ether")});
//     }
//     catch(e) {

//     }
//     let result = await config.flightSuretyApp.isAirlineFunded(config.firstAirline); 
//     let numberAirlines = await config.flightSuretyApp.numAirlines(); 
//     let numberRegisteredAirlines = await config.flightSuretyApp.numRegisteredAirlines(); 
//     let numberFundedRegistered = await config.flightSuretyApp.numFundedAirlines(); 

//     // ASSERT
//     assert.equal(result, true, "Airline sent more than 10 ether and it is funded");
//     assert.equal(numberAirlines, 1);
//     assert.equal(numberRegisteredAirlines, 1);
//     assert.equal(numberFundedRegistered, 1);

//   });


  it('(airline) can register an Airline using registerAirline() if it is funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.fund({from: config.firstAirline, value: web3.utils.toWei("10", "ether")});
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isAirlineRegistered(newAirline); 
    let numberAirlines = await config.flightSuretyApp.numAirlines(); 
    let numberRegisteredAirlines = await config.flightSuretyApp.numRegisteredAirlines(); 
    let numberFundedRegistered = await config.flightSuretyApp.numFundedAirlines(); 

    // ASSERT
    assert.equal(result, true, "Airline registered");
    assert.equal(numberAirlines, 2);
    assert.equal(numberRegisteredAirlines, 2);
    assert.equal(numberFundedRegistered, 1);


  });

  it('Another (airline) can register an Airline using registerAirline() if it is funded', async () => {
    
    // ARRANGE
    let registrantAirline = accounts[2];
    let newAirline = accounts[3];

    // ACT
    try {
        await config.flightSuretyApp.fund({from: registrantAirline, value: web3.utils.toWei("10", "ether")});
        await config.flightSuretyApp.registerAirline(newAirline, {from: registrantAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isAirlineRegistered(newAirline); 
    let numberAirlines = await config.flightSuretyApp.numAirlines(); 
    let numberRegisteredAirlines = await config.flightSuretyApp.numRegisteredAirlines(); 
    let numberFundedRegistered = await config.flightSuretyApp.numFundedAirlines(); 

    // ASSERT
    assert.equal(result, true, "Airline registered by latest funded airline");
    assert.equal(numberAirlines, 3);
    assert.equal(numberRegisteredAirlines, 3);
    assert.equal(numberFundedRegistered, 2);


  });

  it('Another (airline) can register an Airline using registerAirline() if it is funded before multiparty consensus limit', async () => {
    
    // ARRANGE
    let registrantAirline = accounts[3];
    let newAirline = accounts[4];

    // ACT
    try {
        await config.flightSuretyApp.fund({from: registrantAirline, value: web3.utils.toWei("10", "ether")});
        await config.flightSuretyApp.registerAirline(newAirline, {from: registrantAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isAirlineRegistered(newAirline); 
    let numberAirlines = await config.flightSuretyApp.numAirlines(); 
    let numberRegisteredAirlines = await config.flightSuretyApp.numRegisteredAirlines(); 
    let numberFundedRegistered = await config.flightSuretyApp.numFundedAirlines(); 

    // ASSERT
    assert.equal(result, true, "Airline registered by latest funded airline");
    assert.equal(numberAirlines, 4);
    assert.equal(numberRegisteredAirlines, 4);
    assert.equal(numberFundedRegistered, 3);


  });

  it('(multiparty) airline votes for an Airline using registerAirline() but it is not registered until consensus reached', async () => {
    
    // ARRANGE
    let registrantAirline = accounts[4];
    let newAirline = accounts[5];

    // ACT
    try {
        await config.flightSuretyApp.fund({from: registrantAirline, value: web3.utils.toWei("10", "ether")});
        await config.flightSuretyApp.registerAirline(newAirline, {from: registrantAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isAirlineRegistered(newAirline); 
    let numberAirlines = await config.flightSuretyApp.numAirlines(); 
    let numberRegisteredAirlines = await config.flightSuretyApp.numRegisteredAirlines(); 
    let numberFundedRegistered = await config.flightSuretyApp.numFundedAirlines(); 

    // ASSERT
    assert.equal(result, false, "Airline needs to received min number of votes before being registered");
    assert.equal(numberAirlines, 5);
    assert.equal(numberRegisteredAirlines, 4);
    assert.equal(numberFundedRegistered, 4);

  });

  it('(multiparty) second (airline) propose an Airline using registerAirline() and reached consensus so it is registered', async () => {
    
    // ARRANGE
    let newAirline = accounts[5];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isAirlineRegistered(newAirline); 
    let numberAirlines = await config.flightSuretyApp.numAirlines(); 
    let numberRegisteredAirlines = await config.flightSuretyApp.numRegisteredAirlines(); 
    let numberFundedRegistered = await config.flightSuretyApp.numFundedAirlines(); 

    // ASSERT
    assert.equal(result, true, "Airline registered after reaching min votes");
    assert.equal(numberAirlines, 5);
    assert.equal(numberRegisteredAirlines, 5);
    assert.equal(numberFundedRegistered, 4);

  });

  it('(airline) cannot register a flight using registerFlight() if is not funded', async () => {
    
    // ARRANGE
    let passenger = accounts[6];
    let newFlight = 'IB7733';
    let timestamp = 1589999800;
    let airline = accounts[5];
    let reverted = false;

    // ACT
    try {
        await config.flightSuretyApp.registerFlight(airline, newFlight, timestamp, {from: airline});
    }
    catch(e) {
        reverted = true;
    }
    assert.equal(reverted, true, "Airline not funded can't register a flight");      

  });

  it('(airline) can register a flight using registerFlight()', async () => {
    
    // ARRANGE
    let passenger = accounts[6];
    let newFlight = 'IB7733';
    let timestamp = 1589999800;
    let flightKey = '0xe95738fa3f46b3aad8030d103584a1b7e55a72971b78e6d5e4db053a6440e8f9';

    // ACT
    try {
        let flightKeyResult = await config.flightSuretyApp.registerFlight(config.firstAirline, newFlight, timestamp, {from: config.firstAirline});
        result = await config.flightSuretyApp.isFlightRegistered(flightKey); 

    }
    catch(e) {
        console.log(e);
    }

    // ASSERT
    assert.equal(result, true, "Flight registered");

  });
});
