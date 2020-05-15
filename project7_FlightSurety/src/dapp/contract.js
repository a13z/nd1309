import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {
        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));        
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.gas = config.gas;
        this.firstAirline = config.firstAirline;
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accounts) => {

            console.log(accounts);
           
            this.owner = accounts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                // toLowerCase method used because I had the addresses turned with capital letters
                // hence failing in the transactions
                this.airlines.push(accounts[counter].toLowerCase());
                counter++;
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accounts[counter].toLowerCase());
                counter++;
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(airline, flight, timestamp, callback) {
        let self = this;
        let payload = {
            airline: airline.toString(),
            flight: flight.toString(),
            timestamp: timestamp
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: payload.airline}, (error, result) => {
                callback(error, payload);
            });
    }
    
    registerAirline(airline, callback) {
        let self = this;
        const airlineFee = self.web3.utils.toWei('10', 'ether');
        console.log("Register Airline...")
        console.log("airline " + airline);
        console.log("fee " + airlineFee);

        // Register Airline by the first funded airline
        self.flightSuretyApp.methods
        .registerAirline(airline.toString())
        .send({from: this.firstAirline}, (error, result) => {
            callback(error, result);
        });
        // Fund Airline
        self.flightSuretyApp.methods
        .fund()
        .send({from: airline.toString(), value: airlineFee}, (error, result) => {
            callback(error, result);
        });
    }

    registerFlight(airline, flight, timestamp, callback) {
        let self = this;
        console.log("Register Flight...")
        console.log("airline " + airline);
        console.log("flight " + flight);
        console.log("timestamp " + timestamp);
        
        // Register Flight
        self.flightSuretyApp.methods
        .registerFlight(flight.toString(), timestamp)
        .send({from: airline.toString(), gas: this.gas}, (error, result) => {
            callback(error, result);
        });
    }

    buyInsurance(airline, flight, passenger, amount, timestamp, callback) {
        let self = this;   
        console.log("Buy Insurance...")
        console.log("airline " + airline);
        console.log("flight " + flight);
        console.log("passenger " + passenger);
        console.log("amount " + amount);
        console.log("timestamp " + timestamp);

        const insuranceAmount = self.web3.utils.toWei(amount, "ether");  
        console.log(insuranceAmount) ; 

        self.flightSuretyApp.methods
        .buyInsurance(airline.toString(), flight.toString(), timestamp)
        .send({ from: passenger.toString(), value: insuranceAmount, gas: this.gas}, (error, result) => {
            callback(error, result);
        });
    }

    creditInsurees(airline, flight, timestamp, callback) {
        let self = this;   
        console.log("Credit Insurees...")
        console.log("airline " + airline);
        console.log("flight " + flight);
        console.log("timestamp " + timestamp);
        self.flightSuretyApp.methods.creditInsurees(airline.toString(), flight.toString(), timestamp)
        .send({ from: airline.toString(), gas: this.gas}, (error, result) => {
            callback(error, result);
        });
    }

    payPassenger(passenger, callback){
        let self = this;   
        console.log("Pay Passenger...")
        console.log("passenger " + passenger);

        self.flightSuretyApp.methods.payPassenger()
        .send({ from: passenger.toString(), gas: this.gas}, (error, result) => {
            callback(error, result);
        });
      
    }

}