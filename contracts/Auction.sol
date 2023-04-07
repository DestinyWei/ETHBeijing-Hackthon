// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC5489.sol";

contract Auction is Ownable{

    IERC20 public AD3;
    // tokenId => the latest successful bid price
    mapping(uint256 => uint256) public tokenId2Price;
    // tokenId => the latest slot manager
    mapping(uint256 => address) public tokenId2Address;

    // this event emits when the slot on `tokenId` is bid successfully
    event BidSuccessed(address bidder, uint256 amount);

    constructor(IERC20 _AD3) {
        AD3 = _AD3;
    }

    // 是否为默认价格(即0)
    function _isDefaultBalance() private view returns(bool) {
        return AD3.balanceOf(address(this)) == 0;
    }

    // 是否超出120%
    function _isMore120Percent(uint num1, uint num2) private pure returns(bool) {
        uint result = num1 * 12 / 10;
        return num2 >= result;
    }

    function bid(uint256 tokenId, address hNFTContractAddr, uint256 fractionAmount, string memory slotUri) public payable {

        IERC5489 hNFT = IERC5489(hNFTContractAddr);
        // tokenId是否存在
        require(hNFT.totalSupply() >= tokenId, "hNFT doesn't exist");
        // 检查余额是否充足
        require(AD3.balanceOf(_msgSender()) >= fractionAmount, "balance not enough");
        // 检查授权额度是否充足
        require(AD3.allowance(_msgSender()) >= fractionAmount, "allowance not enough");
        // 不为默认价格时检查是否大于120%
        if(!_isDefaultBalance()) {
            require(_isMore120Percent(AD3.balanceOf(address(this)), fractionAmount), "The bid is less than 120%");
            // 将上一个竞价成功者的剩余余额返还
            AD3.transfer(tokenId2Address[tokenId], AD3.balanceOf(address(this)));
        }

        // 更新状态变量
        tokenId2Price[tokenId] = fractionAmount;
        tokenId2Address[tokenId] = _msgSender();

        // 转账
        AD3.transferFrom(_msgSender(), address(this), fractionAmount);

        // 这里不做授权,即广告主想要修改uri时需要再投钱进去

        // 设置uri
        hNFT.setSlotUri(tokenId, slotUri);

        // 触发Bid成功事件
        emit BidSuccessed(_msgSender(), fractionAmount);
    }
}
