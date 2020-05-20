// Test if a new solution can be added for contract - SolnSquareVerifier
// Test if an ERC721 token can be minted for contract - SolnSquareVerifier
const fs = require('fs');

var Verifier = artifacts.require('Verifier');
var SolnSquareVerifier = artifacts.require('SolnSquareVerifier');

contract('SolnSquareVerifier', accounts => {

    const account_one = accounts[0];
    const account_three = accounts[2];

    describe('SolnSquareVerifier', function () {
        beforeEach(async function () { 
            this.verifier = await Verifier.new({from: account_one});
            this.contract = await SolnSquareVerifier.new(this.verifier.address, 'Real Estate Token', 'RET', {from: account_one});
        })

        it('solution cannot be added for a contract if it is not verified', async function () { 
            // ARRANGE
            let tokenId = 3;
            let tokenOwner = account_three;
            let proof = JSON.parse(fs.readFileSync(__dirname + '/../../zokrates/code/proof_3_wrong.json'));
            let solutionHash = web3.utils.keccak256(proof['proof']['a'], proof['proof']['b'], proof['proof']['c'], proof['inputs']);

            // ACT
            let result = await this.contract.addSolution.call(tokenOwner, proof['proof']['a'], proof['proof']['b'], proof['proof']['c'], proof['inputs']);

            // ASSERT
            assert.equal(result, false, "Solution not added");
            // assert.equal(uniqueSolutionAdded, tokenOwner, "Token owner added solution")
        })

        it('solution can be added for a contract', async function () { 
            // ARRANGE
            let tokenId = 3;
            let tokenOwner = account_three;
            let proof = JSON.parse(fs.readFileSync(__dirname + '/../../zokrates/code/proof_3.json'));

            // ACT
            let result = await this.contract.addSolution.call(tokenOwner, proof['proof']['a'], proof['proof']['b'], proof['proof']['c'], proof['inputs']);

            // ASSERT
            assert.equal(result, true, "Solution added");
        })


        it('can mint ERC721 token if proof is valid', async function () { 
            // ARRANGE
            let tokenId = 3;
            let tokenOwner = account_three;
            let proof = JSON.parse(fs.readFileSync(__dirname + '/../../zokrates/code/proof_3.json'));
            let solutionHash = web3.utils.keccak256(proof['proof']['a'], proof['proof']['b'], proof['proof']['c'], proof['inputs']);

            // ACT
            let result = await this.contract.mintNFT.call(tokenOwner, tokenId, proof['proof']['a'], proof['proof']['b'], proof['proof']['c'], proof['inputs'], {from: account_one});

            // ASSERT
            assert.equal(result, true, "Token minted");
        })

        it('cannot mint ERC721 token if proof is invalid', async function () { 
            // ARRANGE
            let tokenId = 3;
            let tokenOwner = account_three;
            let proof = JSON.parse(fs.readFileSync(__dirname + '/../../zokrates/code/proof_3_wrong.json'));
            let solutionHash = web3.utils.keccak256(proof['proof']['a'], proof['proof']['b'], proof['proof']['c'], proof['inputs']);

            // ACT
            let result = await this.contract.mintNFT.call(tokenOwner, tokenId, proof['proof']['a'], proof['proof']['b'], proof['proof']['c'], proof['inputs'], {from: account_one});

            // ASSERT
            assert.equal(result, false, "Token minted");
        })
    });
})