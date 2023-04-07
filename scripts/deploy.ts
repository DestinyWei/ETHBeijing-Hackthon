
import { ethers,upgrades } from "hardhat"
import { readAddressList, storeAddressList } from "./helper";

async function main() {

    // 部署AD3合约
    const AD3 = await ethers.getContractFactory("AD3");
    console.log("Deploying AD3...");
    const ad3 = await AD3.deploy();
    await ad3.deployed();
    console.log("AD3 address: ", ad3.address);

    // 部署ERC5489合约
    const ERC5489 = await ethers.getContractFactory("ERC5489");
    console.log("Deploying ERC5489...");
    const erc5489 = await ERC5489.deploy();
    await erc5489.deployed();
    console.log("ERC5489 address: ", erc5489.address);

    // 部署Auction合约
    const Auction = await ethers.getContractFactory("Auction");
    console.log("Deploying Auction...");
    const auction = await Auction.deploy(ad3.address);
    await auction.deployed();
    console.log("Auction address: ", auction.address);

    const addressList = readAddressList();

    addressList['AD3'] = ad3.address;
    addressList['ERC5489'] = erc5489.address;
    addressList['Auction'] = auction.address;
    storeAddressList(addressList);

}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
