// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC5489.sol";

contract Auction is Ownable{

    IERC20 public AD3;
    IERC5489 public hNFT;
    // 开始时间
    uint256 public startTime;
    // 当前的最高出价者
    address public latestBidder;
    // latest bid successful time
    uint256 public latestBidTime;
    // tokenId => the latest successful bid price
    mapping(uint256 => uint256) public tokenId2Price;
    // tokenId => the latest slot manager
    mapping(uint256 => address) public tokenId2Address;

    // this event emits when the slot on `tokenId` is bid successfully
    event BidSuccessed(address bidder, uint256 amount);

    constructor(IERC20 _AD3, IERC5489 _hNFT) {
        AD3 = _AD3;
        hNFT = _hNFT;
        startTime = block.timestamp;
    }

    // 是否为默认价格(即0)
    function _isDefaultBalance() private returns(bool) {
        return AD3.balanceOf(address(this)) == 0;
    }

    // 是否超出120%
    function _isMore120Percent(uint num1, uint num2) private returns(bool) {
        uint result = num1 * 12 / 10;
        return num2 >= result;
    }

    function bid(uint256 tokenId, uint256 fragment) public payable {
        // tokenId是否存在
        require(hNFT.ownerOf(tokenId) != address(0), "hNFT doesn't exist");
        // 检查余额是否充足
        require(AD3.balanceOf(_msgSender()) >= fragment, "balance not enough");
        // 不为默认价格时检查是否大于120%
        if(!_isDefaultBalance()) {
            require(_isMore120Percent(AD3.balanceOf(address(this)), fragment), "The bid is less than 120%");
            // 将上一个竞价成功者的剩余余额返还
            AD3.transfer(latestBidder, AD3.balanceOf(address(this)));
        }

        // 更新状态变量
        latestBidder = _msgSender();
        latestBidTime = block.timestamp;
        tokenId2Price[tokenId] = fragment;
        tokenId2Address[tokenId] = _msgSender();

        // 转账
        AD3.transferFrom(_msgSender(), address(this), fragment);

        // 触发Bid成功事件
        emit BidSuccessed(_msgSender(), fragment);
    }

    // 广告主取消投放广告
    // function withdraw() public onlyOwner {
    // }
}
