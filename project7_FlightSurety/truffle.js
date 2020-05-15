const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";


module.exports = {
  networks: {
    development: {
        // provider: function() {
        //     return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
        // },
        network_id: '*',
        host: 'localhost',
        port: 8545,
        gas: 6721975,
        gasPrice: 20000000000
    }
  },  

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
        version: "0.5.11",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    }
}
}