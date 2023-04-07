require("@nomicfoundation/hardhat-toolbox");
import "hardhat-deploy";
import '@openzeppelin/hardhat-upgrades';
require("@nomiclabs/hardhat-etherscan");

// @ts-ignore
import * as dotenv from "dotenv";
dotenv.config();

// import "./tasks";

// const { mnemonic } = require('./secrets.json');

module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // Default network when you don't specify "--network {network_name}"
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://localhost:8545",
    },
    goerli: {
      url: "https://goerli.infura.io/v3/" + process.env.INFURA_KEY,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      // {
      //  mnemonic: process.env.MNEMONIC,
      //  count: 20,
      //}
    },
    // testnet: {
    //   url: process.env.QUICK_NODE,
    //   accounts: {mnemonic: mnemonic},
    // }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://bscscan.com/
    apiKey: process.env.API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 20000,
  },
};
