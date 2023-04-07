import { expect } from "chai";
import { ethers } from "hardhat"
import {Contract} from "ethers"

describe("AuctionAndMicroPayment", function () {
    let account1: any, account2: any, account3: any;
    let erc5489:Contract;
    let ad3:Contract;
    let auctionAndMicroPayment:Contract;

    beforeEach(async function () {
        [account1, account2, account3] = await ethers.getSigners();

        const ERC5489 = await ethers.getContractFactory("ERC5489");
        erc5489 = await ERC5489.deploy();
        await erc5489.deployed();

        const AD3 = await ethers.getContractFactory("AD3");
        ad3 = await AD3.deploy();
        await ad3.deployed();

        const AuctionAndMicroPayment = await ethers.getContractFactory("AuctionAndMicroPayment");
        auctionAndMicroPayment = await AuctionAndMicroPayment.deploy();
        await auctionAndMicroPayment.deployed();
    })

    describe("Two user bid the slot uri", () => {
        it('account2 first bid', async function () {
            // AD3 mint function
            await ad3.connect(account1).mint(account2.address, 100000);
            await ad3.connect(account1).mint(account3.address, 100000);

            // AD3 approve function
            await ad3.connect(account2).approve(auctionAndMicroPayment.address, 100000);
            await ad3.connect(account3).approve(auctionAndMicroPayment.address, 100000);

            // ERC5489 mint function
            await erc5489.connect(account1).mint("aaaa");

            // ERC5489 approve function
            await erc5489.connect(account1).setApprovalForAll(auctionAndMicroPayment.address, true);

            // account2 first bid
            await auctionAndMicroPayment.connect(account2).bid(1, erc5489.address, ad3.address, 1000, "bbbb");

            const highestBidResult = await auctionAndMicroPayment.highestBid(1);
            expect(highestBidResult .bidder).to.equal(account2.address);
            expect(highestBidResult .amount).to.equal(1000);
            expect(await erc5489.getSlotUri(1, auctionAndMicroPayment.address)).to.equal("bbbb");
        });

        it('account3 against bid', async function () {
            // AD3 mint function
            await ad3.connect(account1).mint(account2.address, 100000);
            await ad3.connect(account1).mint(account3.address, 100000);

            // AD3 approve function
            await ad3.connect(account2).approve(auctionAndMicroPayment.address, 100000);
            await ad3.connect(account3).approve(auctionAndMicroPayment.address, 100000);

            // ERC5489 mint function
            await erc5489.connect(account1).mint("aaaa");

            // ERC5489 approve function
            await erc5489.connect(account1).setApprovalForAll(auctionAndMicroPayment.address, true);

            // account2 first bid
            await auctionAndMicroPayment.connect(account2).bid(1, erc5489.address, ad3.address, 1000, "bbbb");

            // account3 bid against
            // it would be failed when the fragment less than 1200
            await expect(auctionAndMicroPayment.connect(account3).bid(1, erc5489.address, ad3.address, 1199, "cccc"))
                .to.be.rejectedWith("The bid is less than 120%");

            // account3 bid against successfully
            await auctionAndMicroPayment.connect(account3).bid(1, erc5489.address, ad3.address, 1200, "dddd");
            const highestBidResult = await auctionAndMicroPayment.highestBid(1);
            expect(highestBidResult .bidder).to.equal(account3.address);
            expect(highestBidResult .amount).to.equal(1200);
            expect(await erc5489.getSlotUri(1, auctionAndMicroPayment.address)).to.equal("dddd");
        });
    })
})
