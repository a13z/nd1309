import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {
        console.log(contract);
        let flights = contract.flights;
        let airlines = contract.airlines;
        let passengers = contract.passengers;

        populateData(airlines, 'airlines');
        populateData(passengers, 'passengers');

        contract.flightSuretyApp.events.FlightStatusInfo({
        }, function(error, result) {
            if (error) console.log(error)
            else {
                display('Oracles', 'Trigger oracles', [{ label: 'Fetch Flight Status', error: error, value: result + ' ' + result.args.flight + ' ' + result.args.timestamp }]);

            }
        });

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        // register Airline
        DOM.elid('registerAirline').addEventListener('click', () => {
            let airline = DOM.elid('airlines').value;
            contract.registerAirline(airline, (error, result) => {
                display('Register Airline', 'Register Airline', [{ label: 'Register Airline', error: error, value: result }]);
            });
        })

        // purchase insurance for flight
        DOM.elid('buyInsurance').addEventListener('click', () => {
            let airline = DOM.elid('airlines').value;
            let flight = DOM.elid('flightNumber').value;
            let amount = DOM.elid('amount').value;
            let passenger = DOM.elid('passengers').value;
            let timestamp = DOM.elid('flightTime').value;

            // Register Flight so Passenger can buy insurance
            contract.registerFlight(airline, flight, timestamp, (error, result) => {
                display('Register Flight', 'Register Flight', [{ label: 'Register Flight', error: error, value: result }]);
            });

            // buy Insurance
            contract.buyInsurance(airline, flight, passenger, amount, timestamp, (error, result) => {
                display('Insurance', 'Purchase Insurance', [{ label: 'Purchase Insurance', error: error, value: result }]);
            });
        })

        // credit and pay passenger for flight
        DOM.elid('payCustomer').addEventListener('click', () => {
            let airline = DOM.elid('airlines').value;
            let flight = DOM.elid('flightNumber').value;
            let passenger = DOM.elid('passengers').value;
            let timestamp = DOM.elid('flightTime').value;

            contract.creditInsurees(airline, flight, timestamp, (error, result) => {
                display('Credit Insurees', 'Credit Insurees', [{ label: 'Credit Insurees', error: error, value: result }]);
            });

            contract.payPassenger(passenger, (error, result) => {
                display('Pay Passenger', 'Pay Passenger', [{ label: 'Pay Passenger', error: error, value: result }]);
            });
        })

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            let airline = DOM.elid('airlines').value;
            let timestamp = DOM.elid('flightTime').value;

            // fetch Flight status
            contract.fetchFlightStatus(airline, flight, timestamp, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
    
    });
    

})();

function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function populateData(data, elid) {
    var list = document.getElementById(elid);
    list.innerHTML = "";
    data.forEach((d) => {
        var option = document.createElement("option");
        option.text = d;
        list.add(option);

    })
}

function displayInsuranceForm(flights)
{
    $("#insurance-flights").find("option").remove().end().append($("<option />").val("-1").text("Select Flight..."));
    for (let flight of flights) {
        $("#insurance-flights").append($("<option />").val(flight).text(`${flight}`));
    }
}