pragma solidity ^0.5.11;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "contracts/FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)
    using SafeMath for uint; 

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract
    FlightSuretyData flightSuretyDataContract; // Flight Surety Data contract address

 
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
         // Modify to call data contract's status
        require(true, "Contract is currently not operational");  
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

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
                                (
                                    address payable _flightSuretyDataAddress
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        flightSuretyDataContract = FlightSuretyData(_flightSuretyDataAddress);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() 
                            public 
                            pure 
                            returns(bool) 
    {
        return true;  // Modify to call data contract's status
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
    /********************************************************************************************/
    /*                                     Airlines                                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline
                            (   
                                address _newAirline
                            )
                            public
                            returns(bool success, uint256 votes)
    {
        
        return flightSuretyDataContract.registerAirline(msg.sender, _newAirline);
    }

    /**
     * @dev Fund an airline
     * Returns true if the airline is now funded (has received 10 ether).
     */
    function fund() public payable returns (bool)
    {
        bool funded = flightSuretyDataContract.fund(msg.sender, msg.value);
        address(flightSuretyDataContract).transfer(msg.value);

        return funded;
    }

    /**
     *  @dev Payout insurance to eligible passengers for a late flight
     */
    function creditInsurees(address _airline, string memory _flight, uint256 _timestamp)
        public
        {
            flightSuretyDataContract.creditInsurees(_airline, _flight, _timestamp);
        }

    function hasVoted(address _airline) public view returns (bool)
    {
        return flightSuretyDataContract.hasVoted(msg.sender, _airline);
    }

    function numVotes(address _airline) public view returns (uint256)
    {
        return flightSuretyDataContract.numVotes(_airline);
    }

    function numAirlines() public view returns (uint256)
    {
        return flightSuretyDataContract.numAirlines();
    }

    function numRegisteredAirlines() public view returns (uint256)
    {
        return flightSuretyDataContract.numRegisteredAirlines();
    }

    function numFundedAirlines() public view returns (uint256)
    {
        return flightSuretyDataContract.numFundedAirlines();
    }

    function isAirlineRegistered(address _airline) public view returns (bool)
    {
        return flightSuretyDataContract.isAirlineRegistered(_airline);
    }

    function isAirlineFunded(address _airline) public view returns (bool)
    {
        return flightSuretyDataContract.isAirlineFunded(_airline);
    }

    function isAirline(address _airline) public view returns (bool)
    {
        return (isAirlineRegistered(_airline) && isAirlineFunded(_airline));
    }

    /********************************************************************************************/
    /*                                    Flights                                               */
    /********************************************************************************************/

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
                                (
                                    string memory _flight,
                                    uint256 _timestamp
                                )
                                public
                                returns(bytes32)
    {
        return flightSuretyDataContract.registerFlight(msg.sender, _flight, _timestamp);
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
                                (
                                    address _airline,
                                    string memory _flight,
                                    uint256 _timestamp,
                                    uint8 _statusCode
                                )
                                internal
                                requireIsOperational
                                
    {
        flightSuretyDataContract.processFlightStatus(_airline, _flight, _timestamp, _statusCode);
    }

   /**
    * @dev Check status of a flight 
    *      it will emit an event to the blockchain which Oracles will respond to
    */ 
    function fetchFlightStatus
                        (
                            address airline,
                            string calldata flight,
                            uint256 timestamp                            
                        )
                        external
                        requireIsOperational
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 

    function getFlightStatus(address _airline, string calldata _flight, uint256 _timestamp)
        external 
        view 
        returns (uint8)
        {
            return flightSuretyDataContract.getFlightStatus(_airline, _flight, _timestamp);

        }

    function isFlightRegistered(bytes32 _flightKey) public view returns (bool)
    {
        return flightSuretyDataContract.isFlightRegistered(_flightKey);
    }

    /********************************************************************************************/
    /*                                     Passenger                                            */
    /********************************************************************************************/

    /**
    * @dev buy insurance function
    *      Passenger can buy an insurance for a registered flight up to 1 ether
    *      returns boolean with the result of the transaction
    */
    function buyInsurance(address _airline, string memory _flight, uint256 _timestamp) public payable returns (bool)
        {
            // Require to send value to buy insurance
            require(msg.value > 0, "Insurance amount is required");

            // is it more than it should be?
            uint amount = msg.value;
            uint refund = 0;

            if (amount > 1 ether) {
                amount = 1 ether;
                refund = msg.value.sub(1 ether);
            }

            bool boughtInsurance = flightSuretyDataContract.buyInsurance(msg.sender, amount, _airline, _flight, _timestamp);

            address(flightSuretyDataContract).transfer(amount);

            if (refund > 0) {
                msg.sender.transfer(refund);
            }

            return boughtInsurance;
        }

    /**
    * @dev Pay Passenger the insured eligible amount
    *      returns transaction to send amount to passenger
    */    
    function payPassenger() public
        {
            return flightSuretyDataContract.pay(msg.sender);
        }

// region ORACLE MANAGEMENT

    /********************************************************************************************/
    /*                                    Oracles                                               */
    /********************************************************************************************/


    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, _timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address oracle, address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3] memory)
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string calldata flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(msg.sender, airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address _airline,
                            string memory flight,
                            uint256 _timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(_airline, flight, _timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   
