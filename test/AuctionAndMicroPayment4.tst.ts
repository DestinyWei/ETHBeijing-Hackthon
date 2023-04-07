import {Contract} from "ethers";
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuctionAndMicroPayment Test", function () {
    let owner: any, bidder1: any, bidder2: any, payoutAddress: any;
    let AuctionAndMicroPayment: Contract;
    let auctionAndMicroPayment: Contract;
    let erc5489: Contract;
    let ad3: Contract;

    beforeEach(async function () {
        // Deploy ERC5489 (NFT) and ERC20 (Token) mock contracts
        const ERC5489 = await ethers.getContractFactory("ERC5489");
        erc5489 = await ERC5489.deploy();
        await erc5489.deployed();
        const AD3 = await ethers.getContractFactory("AD3");
        ad3 = await AD3.deploy();
        await ad3.deployed();

        // Deploy AuctionAndMicroPayment contract
        AuctionAndMicroPayment = await ethers.getContractFactory("AuctionAndMicroPayment");
        auctionAndMicroPayment = await AuctionAndMicroPayment.deploy();
        await auctionAndMicroPayment.deployed();

        [owner, bidder1, bidder2, payoutAddress] = await ethers.getSigners();

        // Mint tokens and approve the contract
        await ad3.mint(bidder1.address, ethers.utils.parseEther("100"));
        await ad3.connect(bidder1).approve(auctionAndMicroPayment.address, ethers.utils.parseEther("100"));
        await ad3.mint(bidder2.address, ethers.utils.parseEther("100"));
        await ad3.connect(bidder2).approve(auctionAndMicroPayment.address, ethers.utils.parseEther("100"));

        await erc5489.connect(owner).mint("aaaa");
        await erc5489.connect(owner).setApprovalForAll(auctionAndMicroPayment.address, true);
    });

    describe("Bid", function () {
        it("Should place a new bid successfully", async function () {
            const hNFTId = 1;
            const fragmentAmount = ethers.utils.parseEther("10");

            await expect(auctionAndMicroPayment.connect(bidder1).bid(hNFTId, erc5489.address, ad3.address, fragmentAmount, "slotUri1"))
                .to.emit(auctionAndMicroPayment, "BidSuccessed");
        });

        it("Should fail when the bid amount is less than or equal to the current highest bid amount", async function () {
            const hNFTId = 1;
            const fragmentAmount1 = ethers.utils.parseEther("10");
            const fragmentAmount2 = ethers.utils.parseEther("11");

            await auctionAndMicroPayment.connect(bidder1).bid(hNFTId, erc5489.address, ad3.address, fragmentAmount1, "slotUri1");
            await expect(auctionAndMicroPayment.connect(bidder2).bid(hNFTId, erc5489.address, ad3.address, fragmentAmount2, "slotUri2"))
                .to.be.revertedWith("The bid is less than 120%");
        });

        it("Should replace the highest bid successfully", async function () {
            const hNFTId = 1;
            const fragmentAmount1 = ethers.utils.parseEther("10");
            const fragmentAmount2 = ethers.utils.parseEther("12");

            await auctionAndMicroPayment.connect(bidder1).bid(hNFTId, erc5489.address, ad3.address, fragmentAmount1, "slotUri1");
            await expect(auctionAndMicroPayment.connect(bidder2).bid(hNFTId, erc5489.address, ad3.address, fragmentAmount2, "slotUri2"))
                .to.emit(auctionAndMicroPayment, "RefundPreviousBidIncreased")
                .to.emit(auctionAndMicroPayment, "BidSuccessed");
        });
    });

    it("Should successfully payout the fragment amount", async function () {
        const hNFTId = 1;
        const fragmentAmount = ethers.utils.parseEther("10");
        const payoutAmount = ethers.utils.parseEther("2");

        await auctionAndMicroPayment.connect(bidder1).bid(hNFTId, erc5489.address, ad3.address, fragmentAmount, "slotUri1");

        const bid = await auctionAndMicroPayment.highestBid(hNFTId);

        await expect(auctionAndMicroPayment.connect(payoutAddress).payout(bid.bidId, hNFTId, payoutAmount))
            .to.emit(auctionAndMicroPayment, "PayOutIncreased")
            .withArgs(bid.bidId, hNFTId, payoutAddress.address, payoutAmount);

        const updatedBid = await auctionAndMicroPayment.highestBid(hNFTId);
        expect(updatedBid.amount).to.equal(fragmentAmount.sub(payoutAmount));
    });

    it("Should fail when the bidId does not match the highest bid", async function () {
        const hNFTId = 1;
        const fragmentAmount = ethers.utils.parseEther("10");
        const payoutAmount = ethers.utils.parseEther("2");

        await auctionAndMicroPayment.connect(bidder1).bid(hNFTId, erc5489.address, ad3.address, fragmentAmount, "slotUri1");

        const invalidBidId = 12345;
        await expect(auctionAndMicroPayment.connect(payoutAddress).payout(invalidBidId, hNFTId, payoutAmount))
            .to.be.revertedWith("The bidId is not match.");
    });

    it("Should fail when the payout amount is greater than the remaining balance", async function () {
        const hNFTId = 1;
        const fragmentAmount = ethers.utils.parseEther("10");
        const payoutAmount = ethers.utils.parseEther("12");

        await auctionAndMicroPayment.connect(bidder1).bid(hNFTId, erc5489.address, ad3.address, fragmentAmount, "slotUri1");

        const bid = await auctionAndMicroPayment.highestBid(hNFTId);

        await expect(auctionAndMicroPayment.connect(payoutAddress).payout(bid.bidId, hNFTId, payoutAmount))
            .to.be.revertedWith("The advertising sponsor is credit balance is insufficient.");
    });
});
