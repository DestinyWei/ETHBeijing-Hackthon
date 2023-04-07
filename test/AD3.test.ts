import { expect } from "chai";
import { ethers } from "hardhat"
import { Contract, BigNumber } from "ethers"

describe("AD3", function () {
    let account1: any, account2: any, account3: any;
    let ad3:Contract;
    let auctionAndMicroPayment:Contract;

    beforeEach(async function () {
        [account1, account2, account3] = await ethers.getSigners();

        const AD3 = await ethers.getContractFactory("AD3");
        ad3 = await AD3.deploy();
        await ad3.deployed();

        const AuctionAndMicroPayment = await ethers.getContractFactory("AuctionAndMicroPayment");
        auctionAndMicroPayment = await AuctionAndMicroPayment.deploy();
        await auctionAndMicroPayment.deployed();
    })

    describe("Minting", () => {
        it("mint function", async function () {
            await ad3.connect(account1).mint(account2.address, 100000);
            expect(await ad3.balanceOf(account2.address)).to.equal(BigNumber.from('100000'));

            await ad3.connect(account1).mint(account3.address, 100000);
            expect(await ad3.balanceOf(account3.address)).to.equal(BigNumber.from('100000'));
        })
    })

    describe("Approve", () => {
        it('approve function', async function () {
            await ad3.connect(account2).approve(auctionAndMicroPayment.address, 100000);
            expect(await ad3.allowance(account2.address, auctionAndMicroPayment.address)).to.equal(BigNumber.from('100000'));

            await ad3.connect(account3).approve(auctionAndMicroPayment.address, 100000);
            expect(await ad3.allowance(account3.address, auctionAndMicroPayment.address)).to.equal(BigNumber.from('100000'));
        });
    })
})
