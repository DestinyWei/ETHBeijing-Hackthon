import { expect } from "chai";
import { ethers } from "hardhat"
import {BigNumber, Contract} from "ethers"

describe("ERC5489", function () {
    let account1: any, account2: any, account3: any;
    let erc5489:Contract;
    let ad3:Contract;
    let auction:Contract;

    beforeEach(async function () {
        [account1, account2, account3] = await ethers.getSigners();

        const ERC5489 = await ethers.getContractFactory("ERC5489");
        erc5489 = await ERC5489.deploy();
        await erc5489.deployed();

        const AD3 = await ethers.getContractFactory("AD3");
        ad3 = await AD3.deploy();
        await ad3.deployed();

        const Auction = await ethers.getContractFactory("Auction");
        auction = await Auction.deploy(ad3.address);
        await auction.deployed();
    })

    describe("Bid", () => {
        it('account2 first bid', async function () {
            // AD3 mint function
            await ad3.connect(account1).mint(account2.address, 100000);
            expect(await ad3.balanceOf(account2.address)).to.equal(BigNumber.from('100000'));

            await ad3.connect(account1).mint(account3.address, 100000);
            expect(await ad3.balanceOf(account3.address)).to.equal(BigNumber.from('100000'));

            // AD3 approve function
            await ad3.connect(account2).approve(auction.address, 100000);
            expect(await ad3.allowance(account2.address, auction.address)).to.equal(BigNumber.from('100000'));

            await ad3.connect(account3).approve(auction.address, 100000);
            expect(await ad3.allowance(account3.address, auction.address)).to.equal(BigNumber.from('100000'));

            // ERC5489 mint function
            await erc5489.connect(account1).mint("aaaa");
            expect(await erc5489.ownerOf(1)).to.equal(account1.address);

            // ERC5489 approve function
            await erc5489.connect(account1).setApprovalForAll(auction.address, true);
            expect(await erc5489.isApprovedForAll(account1.address, auction.address)).to.true;

            // account2 first bid
            await auction.connect(account2).bid(1, erc5489.address, 1000, "bbbb");
            expect(await auction.tokenId2Address(1)).to.equal(account2.address);
            expect(await auction.tokenId2Price(1)).to.equal(1000);
            expect(await erc5489.getSlotUri(1, auction.address)).to.equal("bbbb");
        });

        it('account3 against bid', async function () {
            // AD3 mint function
            await ad3.connect(account1).mint(account2.address, 100000);
            expect(await ad3.balanceOf(account2.address)).to.equal(BigNumber.from('100000'));

            await ad3.connect(account1).mint(account3.address, 100000);
            expect(await ad3.balanceOf(account3.address)).to.equal(BigNumber.from('100000'));

            // AD3 approve function
            await ad3.connect(account2).approve(auction.address, 100000);
            expect(await ad3.allowance(account2.address, auction.address)).to.equal(BigNumber.from('100000'));

            await ad3.connect(account3).approve(auction.address, 100000);
            expect(await ad3.allowance(account3.address, auction.address)).to.equal(BigNumber.from('100000'));

            // ERC5489 mint function
            await erc5489.connect(account1).mint("aaaa");
            expect(await erc5489.ownerOf(1)).to.equal(account1.address);

            // ERC5489 approve function
            await erc5489.connect(account1).setApprovalForAll(auction.address, true);
            expect(await erc5489.isApprovedForAll(account1.address, auction.address)).to.true;

            // account2 first bid
            await auction.connect(account2).bid(1, erc5489.address, 1000, "bbbb");
            expect(await auction.tokenId2Address(1)).to.equal(account2.address);
            expect(await auction.tokenId2Price(1)).to.equal(1000);
            expect(await erc5489.getSlotUri(1, auction.address)).to.equal("bbbb");

            // account3 bid against
            // it would be failed when the fragment less than 1200
            await auction.connect(account3).bid(1, erc5489.address, 1200, "cccc");
            expect(await auction.tokenId2Address(1)).to.equal(account3.address);
            expect(await auction.tokenId2Price(1)).to.equal(1200);
            expect(await erc5489.getSlotUri(1, auction.address)).to.equal("cccc");
        });
    })
})
