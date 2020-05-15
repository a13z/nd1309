pragma solidity ^0.5.11;

import "node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    // Num Airlines to start Multi party consensus
    uint8 private constant MULTI_PARTY_CONSENSUS_MIN = 4;

    struct Airline {
        address airlineAddress;
        bool isRegistered;
        bool isFunded;
        uint256 amountFunded;
        // address[] backers; // airlines 
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        string code; // Flight code, e.g. AY2030
    }

    // smart contract variables
    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedContracts;               // Authorized addresses to call this contract

    // airlines
    mapping(address => Airline) private airlines;   // airlines mapping address to Airline struct
    mapping(address => address[]) private voters;   // New Airline mapping to an array of airline voters 

    uint256 public numAirlines;                     // number of airlines, registered or unregistered
    uint256 public numRegisteredAirlines;           // number of registered airlines
    uint256 public numFundedAirlines;               // number of funded airlines

    // flights
    mapping(bytes32 => Flight) private flights;

    // total amount of funds deposited by Airlines. Used to pay insurance.
    uint256 private totalFunds;                     // total funds available

    // passengers
    mapping(bytes32 => uint256) private insurance;     // passenger and flightkey hash map to insurance amount paid by a passenger
    mapping(address => uint256) private payouts;       // amount credited to a passenger
    mapping(bytes32 => address[]) private passengers;  // list of passengers for a flightkey hash

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    event AirlineSentFunds(address airline, uint256 amount, uint256 totalsent);
    event AirlineRegistered(address airline);
    event AirlineFunded(address airline);

    event FlightRegistered(address airline, string code, uint256 timestamp, bytes32 key);
    event InsuranceBought(address passenger, string code, bytes32 flightKey, uint amount);
    event PayableInsurance(address passenger, string code, uint amount);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address _airline) public
    {
        contractOwner = msg.sender;

        Airline memory newAirline = Airline({airlineAddress: _airline, isRegistered: true, isFunded: false, amountFunded: 0});
        airlines[_airline] = newAirline;

        numAirlines = numAirlines.add(1);
        numRegisteredAirlines = numRegisteredAirlines.add(1);
        emit AirlineRegistered(_airline);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the app contract(s) to be the caller
    */
    modifier requireAuthorizedCaller()
    {
        require(authorizedContracts[msg.sender], "Caller is not authorized");
        _;
    }

    /**
    * @dev Modifier that requires the function caller be a registered airline
    */
    modifier requireRegisteredAirline(address _airline)
    {
        require(airlines[_airline].isRegistered, "Caller is not a registered airline");
        _;
    }

    /**
    * @dev Modifier that requires the function caller be a registered airline and paid a fee
    */
    modifier requireFundedAirline(address _airline)
    {
        require(airlines[_airline].isFunded, "Caller is not a funded airline");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns(bool)
    {
        return operational;
    }


    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner
    {
        operational = mode;
    }

    /**
     * @dev Check if an Airline has voted for a particular airline 
     */

    function hasVoted(address _airlineVoting, address _airline) public view requireAuthorizedCaller() returns (bool)
    {
        address[] memory voted = voters[_airline];

        for (uint index = 0; index < voted.length; index++) {
            if (_airlineVoting == voted[index]) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev number of votes an applicant airline has
     */

    function numVotes(address _airline) public view requireAuthorizedCaller() returns (uint256)
    {
        return voters[_airline].length;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


    /********************************************************************************************/
    /*                                    Airlines                                              */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(
                                address _registrantAirline,     
                                address _newAirline
                            )
        external
        requireIsOperational()
        requireAuthorizedCaller()
        returns (bool, uint256)
        {
            // fail fast condition. 
            require(airlines[_registrantAirline].isFunded, "Airline must be funded to add or vote for an Airline");

            // with fewer than four registered airlines, an existing funded airline can add
            // the new airline
            if (numRegisteredAirlines < MULTI_PARTY_CONSENSUS_MIN) {
                require(!airlines[_newAirline].isRegistered, "Airline is already registered");

                Airline memory newAirline = Airline({airlineAddress: _newAirline, isRegistered: true, isFunded: false, amountFunded: 0});
                airlines[_newAirline] = newAirline;
                numAirlines = numAirlines.add(1);
                numRegisteredAirlines = numRegisteredAirlines.add(1);
                emit AirlineRegistered(_newAirline);
                return (true, 0);
            }
        
            // Multi party consensus
            // Only airlines backed up majority can be registered
            if (airlines[_newAirline].airlineAddress != _newAirline ) {
                Airline memory newAirline = Airline({airlineAddress: _newAirline, isRegistered: false, isFunded: false, amountFunded:0});
                airlines[_newAirline] = newAirline;
                numAirlines = numAirlines.add(1);
                voters[_newAirline].push(_registrantAirline);
            }
            else {
                require(!hasVoted(_registrantAirline, _newAirline), "Registant airline has already voted for this airline");
                voters[_newAirline].push(_registrantAirline);
            }

            uint256 totalVotes = numVotes(_newAirline);
            // Multi party consensus voting approval to register a new airline
            if (numFundedAirlines.div(2) <= totalVotes) {
                airlines[_newAirline].isRegistered = true;
                numRegisteredAirlines = numRegisteredAirlines.add(1);
                delete voters[_newAirline];
                emit AirlineRegistered(_newAirline);
                return (true, 0);
            }

            return (false, totalVotes);
        }

    /**
     * @dev Is the airline registered?  Returns (true or false, number of airlines)
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function isAirlineRegistered(address _airline) external view requireAuthorizedCaller() returns (bool)
        {
            return (airlines[_airline].isRegistered);
        }

    /**
     * @dev Is the airline funded?  Returns (true or false, number of funded airlines)
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function isAirlineFunded(address _airline) external view requireAuthorizedCaller() returns (bool)
        {
            return (airlines[_airline].isFunded);
        }
        
    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund(address _airline, uint256 _amount) external payable
        requireIsOperational()
        requireAuthorizedCaller()
        requireRegisteredAirline(_airline)
        returns (bool)
        {
            require(_amount > 0, "Amount must be higher than 0.");

            airlines[_airline].amountFunded = airlines[_airline].amountFunded.add(_amount);
            totalFunds = totalFunds.add(_amount);
            emit AirlineSentFunds(_airline, _amount, airlines[_airline].amountFunded);
            if (airlines[_airline].amountFunded >= 10 ether) {
                airlines[_airline].isFunded = true;
                numFundedAirlines = numFundedAirlines.add(1);
                emit AirlineFunded(_airline);
            }

            return airlines[_airline].isFunded;
        }

    /**
     *  @dev Payout to eligible passengers with insurance
     */
    function creditInsurees(
                            address _airline, 
                            string calldata _flight, 
                            uint256 _timestamp)
            external
            requireIsOperational()
            requireAuthorizedCaller()
        {
            bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);
            require(flights[flightKey].statusCode == STATUS_CODE_LATE_AIRLINE, "Flight must be late because of the Airline fault");

            address[] memory passengersTemp = passengers[flightKey];

            for (uint index = 0; index < passengersTemp.length; index++) {
                bytes32 flightInsuranceKey = getFlightInsuranceKey(passengersTemp[index], flightKey);
                if (insurance[flightInsuranceKey] > 0) {
                    uint refund = insurance[flightInsuranceKey].mul(3).div(2);
                    // It could be we run out of funds
                    require(totalFunds > 0, "There are not enough funds in the pot");
                    totalFunds = totalFunds.sub(refund);
                    payouts[passengersTemp[index]] = payouts[passengersTemp[index]].add(refund);
                    // after we payout a passenger we delete his/her insurance
                    insurance[flightInsuranceKey] = 0;
                    emit PayableInsurance(passengersTemp[index], _flight, payouts[passengersTemp[index]]);
                }
            }
            // delete passengers who used that flight
            passengers[flightKey] = new address[](0);
        }

    /********************************************************************************************/
    /*                                    Flights                                               */
    /********************************************************************************************/

   /**
    * @dev Returns the registered status of a flight.
    *
    */  
    function isFlightRegistered(bytes32 _flightKey) 
        external
        view
        returns(bool)
        {
            return flights[_flightKey].isRegistered;
        }

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight(
                            address _airline, 
                            string calldata _flight, 
                            uint256 _timestamp
                            )
        external
        requireIsOperational()
        requireAuthorizedCaller()
        requireFundedAirline(_airline)
        returns (bytes32)
        {
            bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);

            if (flights[flightKey].isRegistered) {
                // nothing to do, already registered and has no flight data
                return flightKey;
            }

            Flight memory newFlight = Flight({code: _flight, isRegistered: true, statusCode: 0, updatedTimestamp: _timestamp, airline: _airline});
           
            flights[flightKey] = newFlight;

            // no passengers right now
            passengers[flightKey] = new address[](0);

            emit FlightRegistered(_airline, _flight, _timestamp, flightKey);

            return flightKey;
        }

    function processFlightStatus(address _airline, string calldata _flight, uint256 _timestamp, uint8 _statusCode)
        external
        requireIsOperational()
        requireAuthorizedCaller()
        {
            bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);
            flights[flightKey].statusCode = _statusCode;
        }

    function getFlightStatus(address _airline, string calldata _flight, uint256 _timestamp)
        external view returns (uint8)
        {
            bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);

            return flights[flightKey].statusCode;
        }

    /**
     * @dev getFlightKey creates hash from airline, flight and timestamp. 
     *      returns the hash
     *
     */
    function getFlightKey(address _airline, string memory _flight, uint256 _timestamp)
        internal
        pure
        returns(bytes32)
        {
            return keccak256(abi.encodePacked(_airline, _flight, _timestamp));
        }


    /**
     * @dev getFlightInsuranceKey creates hash from passenger and flightKey. 
     *      returns the hash
     *
     */
    function getFlightInsuranceKey(address _passenger, bytes32 flightKey)
        internal
        pure
        returns(bytes32)
        {
            return keccak256(abi.encodePacked(_passenger, flightKey));
        }
      
  
    /********************************************************************************************/
    /*                                    Passengers                                            */
    /********************************************************************************************/

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buyInsurance(address _passenger, uint _amount, address _airline, string calldata _flight, uint256 _timestamp)
        external
        requireIsOperational()
        requireAuthorizedCaller()
        requireFundedAirline(_airline)
        returns (bool)
        {
            bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);
            require(flights[flightKey].isRegistered, "Flight cannot be insured. Either is not registered or has already landed");

            bytes32 flightInsuranceKey = getFlightInsuranceKey(_passenger, flightKey);
            require(insurance[flightInsuranceKey] == 0, "Already bought insurance");

            insurance[flightInsuranceKey] = _amount;
            passengers[flightKey].push(_passenger);

            emit InsuranceBought(_passenger, _flight, flightKey, _amount);

            return true;
        }

    function insuredAmount(address _passenger, address _airline, string calldata _flight, uint256 _timestamp)
        external
        view
        requireIsOperational()
        requireAuthorizedCaller()
        returns (uint)
        {
            bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);
            bytes32 flightInsuranceKey = getFlightInsuranceKey(_passenger, flightKey);
            return insurance[flightInsuranceKey];
        }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay(address payable _passenger)
        external
        requireIsOperational()
        requireAuthorizedCaller()
        {
            uint payment = payouts[_passenger];
            if (payment > 0) {
                payouts[_passenger] = 0;
                _passenger.transfer(payment);
            }
        }


    /********************************************************************************************/
    /*                                    Control functions                                     */
    /********************************************************************************************/
    /**
     * @dev Add an app contract that can call into this contract
     */

    function authorizeCaller(address _contract) external requireContractOwner
    {
        authorizedContracts[_contract] = true;
    }

    /**
     * @dev Add an app contract that can call into this contract
     */
    function deauthorizeCaller(address _contract) external requireContractOwner
    {
        delete authorizedContracts[_contract];
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable
    {

    }
}
