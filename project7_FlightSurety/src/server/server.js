import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

// Flight status codees
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const ORACLES_COUNT = 30;
const STATUSCODES = [STATUS_CODE_ON_TIME, STATUS_CODE_LATE_AIRLINE, STATUS_CODE_LATE_WEATHER, STATUS_CODE_LATE_TECHNICAL, STATUS_CODE_LATE_OTHER];

// Track all registered oracles
// key value pair in which the key is the oracle index and the value is an array of addresses which has that index
// easy to find and then iterate
var oracles = {};

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

web3.eth.getAccounts().then((accounts) => {
  console.log("length :" + accounts.length);

  flightSuretyData.methods.authorizeCaller(config.appAddress)
      .send({ from: accounts[0] })
      .then(result => {
          console.log("FlightSuretyApp with address" + config.appAddress + " registered as the authorized contract of FlightSuretyData with address " + config.dataAddress);
      })
      .catch(error => {
          console.log("Error in authorizing appcontract. " + error);
      });

  flightSuretyApp.methods.REGISTRATION_FEE().call().then(fee => {
      for (let a = 20; a < ORACLES_COUNT; a++) {
          flightSuretyApp.methods.registerOracle()
              .send({ from: accounts[a], value: fee, gas: config.gas })
              .then(result => {
                  flightSuretyApp.methods.getMyIndexes().call({ from: accounts[a] })
                      .then(indices => {
                          for (var index in indices) {
                              console.log("index " + index)
                              if (oracles[indices[index]] == null){
                                  oracles[indices[index]] = [];
                              }
                              oracles[indices[index]].push(accounts[a]);
                              console.log("Oracles for index " + indices[index] + " are " + oracles[indices[index]]);
                          }
                        //   oracles[accounts[a]] = indices;
                          console.log("Oracle registered: " + accounts[a] + " indices:" + indices);
                      })
              })
              .catch(error => {
                  console.log("Error while registering oracles: " + accounts[a] + " Error: " + error);
              });
      }
  })

});


flightSuretyApp.events.OracleReport({
    fromBlock: 0
  }, function(error, event) {
    if (error) console.log(error)
    else {
  
        console.log("Received OracleReport event:  " + JSON.stringify(event));
    }
  
  
  });

flightSuretyApp.events.FlightStatusInfo({
  fromBlock: 0
}, function(error, event) {
  if (error) console.log(error)
  else {

      console.log("Received flightstatusInfo event:  " + JSON.stringify(event));
  }

});

flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function(error, event) {
  if (error) console.log(error)
  else {
      console.log(event);
      const index = event.returnValues.index;
      const airline = event.returnValues.airline;
      const flight = event.returnValues.flight;
      const timestamp = event.returnValues.timestamp;

      let oraclesToRespond = oracles[index];
      console.log(oraclesToRespond);
      for (let oracle in oraclesToRespond) {
        console.log("Oracle responding " + oraclesToRespond[oracle]);

        // Uncomment this line to use random STATUSCODES
        // let randomstatusCode = STATUSCODES[Math.floor(Math.random()*STATUSCODES.length)];
        
        // Choose this STATUS_CODE to force Airlines to pay insurance to passengers
        let randomstatusCode = STATUS_CODE_LATE_AIRLINE;

        console.log('Random status code ' + randomstatusCode);
        flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, randomstatusCode)
            .send({ from: oraclesToRespond[oracle], gas: config.gas })
            .then(result => {
                console.log("Oracle " + oraclesToRespond[oracle] + " index " + index + " response sent with statuscode: " + randomstatusCode + " for " + flight + " and index:" + index);
            })
            .catch(error => {
                console.log("Error while sending Oracle key " + oraclesToRespond[oracle] + " index " + index + " response  for " + flight + " Error:" + error)
            });

      }
      console.log(event);

  }

});

flightSuretyData.events.allEvents({
  fromBlock: 0
}, function(error, event) {
  if (error) console.log(error)
  else {
      console.log("Received flightSuretyData event....");
      console.log(event);
      const flightKey = event.returnValues.flightKey;
      const airline = event.returnValues.airline;
      const flight = event.returnValues.flight;
      const timestamp = event.returnValues.timestamp;
  }
});

const app = express();
app.get('/api', (req, res) => {
  res.send({
      message: 'An API for use with your Dapp!'
  })
})


export default app;