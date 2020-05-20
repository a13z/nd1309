pragma solidity >=0.4.21 <0.6.0;

import "./ERC721Mintable.sol";
import "./Verifier.sol";

contract SolnSquareVerifier is RealEstateToken {

    Verifier private verifierContract;

    constructor(address _verifierContract, string memory _name, string memory _symbol) RealEstateToken(_name, _symbol) public {
        verifierContract = Verifier(_verifierContract);
    }

    struct Solution {
        uint256 index;
        address tokenOwner;
    }
    uint256 private indexCounter = 0;

    mapping(bytes32 => Solution) private uniqueSolutions;

    event addedSolution(address tokenOwner, uint256 indexCounter);

    function addSolution(address tokenOwner, uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[2] memory input) public returns (bool)  {
        
        bytes32 solutionHash =  keccak256(abi.encodePacked(a, b, c, input));

        // require(uniqueSolutions[solutionHash].tokenOwner != address(0), 'SolnSquareVerifier: addSolution. Solution has been already submitted');
        require(uniqueSolutions[solutionHash].tokenOwner == address(0), 'SolnSquareVerifier: addSolution. Solution has been already submitted');

        // verify solution
        bool verified = verifierContract.verifyTx(a, b, c, input);
        if (verified) {
            uniqueSolutions[solutionHash].tokenOwner = tokenOwner;
            indexCounter += 1;
            uniqueSolutions[solutionHash].index = indexCounter;
            emit addedSolution(tokenOwner, indexCounter);
            return true;
        }
        else {
            return false;
        }

    }

    function mintNFT(address to, uint256 tokenId, uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[2] memory input) public returns (bool)  {
        require(msg.sender != address(0), 'SolnSquareVerifier: addSolution. Caller cannot be zero account');

        address tokenOwner = to;
        // verify solution
        bool isSolutionAdded = addSolution(tokenOwner, a, b, c, input);

        if (isSolutionAdded) {
            super._mint(tokenOwner, tokenId);
            return true;
        }
        else {
            return false;
        }

    }   
}


























