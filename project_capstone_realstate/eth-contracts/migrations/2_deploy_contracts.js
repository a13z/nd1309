// migrating the appropriate contracts
// var RealEstateToken = artifacts.require("./RealEstateToken.sol");
var Verifier = artifacts.require("./Verifier.sol");
var SolnSquareVerifier = artifacts.require("./SolnSquareVerifier.sol");

module.exports = async (deployer) => {
  // await deployer.deploy(RealEstateToken, 'Real Estate Token', 'RET');

  await deployer.deploy(Verifier);
  let verifierDeployed = await Verifier.deployed();

  await deployer.deploy(SolnSquareVerifier, verifierDeployed.address, 'Real Estate Token', 'RET');
  let solnSquareVerifierDeployed = await SolnSquareVerifier.deployed();

  // let RealEstateTokenDeployed = RealEstateToken.deployed();
  // deployer.deploy(SolnSquareVerifier);
};