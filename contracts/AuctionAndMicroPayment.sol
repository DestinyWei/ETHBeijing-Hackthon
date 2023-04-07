// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC5489.sol";

contract AuctionAndMicroPayment is Ownable{

    struct Bid {
        uint256 amount; // 余额
        address bidder;
        address tokenContract;
        string  slotUri;
    }

    IERC20 public token;
    IERC5489 public hNFT;
    // hNFTId => Bid
    mapping(uint256 => Bid) public highestBid;

    // this event emits when the slot on `hNFTId` is bid successfully
    event BidSuccessed(address bidder, uint256 amount);
    event RefundPreviousBidIncreased(uint256 hNFTId, address tokenAddress, address refunder, uint256 amount);
    event PayOutIncreased(uint256 hNFTId, address payoutAddress, uint256 amount);

    constructor() {}

    function bid(
        uint256 hNFTId,
        address hNFTContractAddr,
        address tokenContractAddr,
        uint256 fractionAmount,
        string memory slotUri
    ) public payable {

        require(fractionAmount > 0, "Bid amount must be greater than 0.");
        require(hNFTContractAddr != address(0) && tokenContractAddr != address(0), "The hnft and token contract can not be address(0).");

        _bid(hNFTId, hNFTContractAddr, tokenContractAddr, fractionAmount, slotUri);

    }

    // --- Private Function ---

    // 是否为默认价格(即0)
    function _isDefaultBalance(uint256 hNFTId) private view returns(bool) {
        return highestBid[hNFTId].amount == 0;
    }

    // 是否超出120%
    function _isMore120Percent(uint num1, uint num2) internal pure returns(bool) {
        uint result = num1 * 12 / 10;
        return num2 >= result;
    }

    function _bid(
        uint256 hNFTId,
        address hNFTContractAddr,
        address tokenContractAddr,
        uint256 fractionAmount,
        string memory slotUri
    ) internal {

        hNFT = IERC5489(hNFTContractAddr);
        token = IERC20(tokenContractAddr);

        // hNFTId是否存在
        require(hNFT.totalSupply() >= hNFTId, "hNFTFT doesn't exist");
        // 检查余额是否充足
        require(token.balanceOf(_msgSender()) >= fractionAmount, "balance not enough");
        // 检查授权额度是否充足
        require(token.allowance(_msgSender(), address(this)) >= fractionAmount, "allowance not enough");

        if(!_isDefaultBalance(hNFTId)) {
            Bid memory previousBidder = highestBid[hNFTId];
            // 不为默认价格时检查是否大于120%
            require(_isMore120Percent(previousBidder.amount, fractionAmount), "The bid is less than 120%");
            // 将上一个竞价成功者的剩余余额返还
            token.transfer(previousBidder.bidder, previousBidder.amount);
            emit RefundPreviousBidIncreased(hNFTId, previousBidder.tokenContract, previousBidder.bidder, previousBidder.amount);
        }

        // 更新状态变量
        highestBid[hNFTId] = Bid(fractionAmount, _msgSender(), tokenContractAddr, slotUri);

        // 转账
        token.transferFrom(_msgSender(), address(this), fractionAmount);

        // 设置uri
        hNFT.setSlotUri(hNFTId, slotUri);

        // 触发Bid成功事件
        emit BidSuccessed(_msgSender(), fractionAmount);
    }

    function payout(uint256 hNFTId, address userAddresses, uint256 fragmentAmounts) public {

    }
}
