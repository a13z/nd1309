var RealEstateToken = artifacts.require('RealEstateToken');

contract('RealEstateToken', accounts => {

    const account_one = accounts[0];
    const account_two = accounts[1];

    describe('match erc721 spec', function () {
        beforeEach(async function () { 
            this.contract = await RealEstateToken.new('Real Estate Token', 'RET', {from: account_one});

            // TODO: mint multiple tokens
            this.contract.mint(account_two, 1, {from: account_one});
            this.contract.mint(account_two, 2, {from: account_one});
            this.contract.mint(account_two, 3, {from: account_one});
            this.contract.mint(account_two, 4, {from: account_one});
            this.contract.mint(account_two, 5, {from: account_one});
        })

        it('should return total supply', async function () { 
            // ARRANGE

            // ACT
            let totalSupply = await this.contract.totalSupply();

            // ASSERT
            assert.equal(totalSupply, 5, "Numer of tokens minted");
        })

        it('should get token balance', async function () { 
            // ARRANGE

            // ACT
            let tokenBalance = await this.contract.balanceOf(account_two);

            // ASSERT
            assert.equal(tokenBalance, 5, "Numer of tokens owned by account_two");
        })

        // token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
        it('should return token uri', async function () { 
            // ARRANGE
            let tokenId = 1;

            // ACT
            let tokenURI = await this.contract.tokenURI(tokenId);

            // ASSERT
            assert.equal(tokenURI, 'https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1', "TokenURI for tokenId 1");
        })

        it('should transfer token from one owner to another', async function () { 
            // ARRANGE
            let tokenId = 1;
            let currentOwnerToken1 = await this.contract.ownerOf(tokenId);
            let newOwnerToken1 = accounts[2];

            // ACT
            await this.contract.safeTransferFrom(currentOwnerToken1, newOwnerToken1, tokenId, {from: currentOwnerToken1});
            let newOwnerOfToken1 = await this.contract.ownerOf(tokenId);

            // ASSERT
            assert.notEqual(currentOwnerToken1, newOwnerOfToken1, "current and new owners are different")
            assert.equal(newOwnerToken1, newOwnerOfToken1 , "current owner of token 1 is now account_one");
            
        })
    });

    describe('have ownership properties', function () {
        beforeEach(async function () { 
            this.contract = await RealEstateToken.new('Real Estate Token', 'RET', {from: account_one});
        })

        it('should fail when minting when address is not contract owner', async function () { 
            // ARRANGE
            let contractOwner = this.owner;
            let user = accounts[3];

            // ACT
            try {
                await this.contract.mint(user, {from: user});
            }
            catch(e) {
                reverted = true;
            }

            // ASSERT
            assert.equal(reverted, true, "user not owner can't mint a token");  
        })

        it('should return contract owner', async function () { 
            // ARRANGE
            let contractOwner = account_one;

            // ACT
            let owner =  await this.contract.owner();

            // ASSERT
            assert.notEqual(owner, '0x0', "owner is not 0x0 address")
            assert.equal(owner, contractOwner, "user not owner can't mint a token");  
            
        })

    });
})