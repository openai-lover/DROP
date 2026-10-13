// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface TestVm {
    struct Log {
        bytes32[] topics;
        bytes data;
        address emitter;
    }
    function addr(uint256 privateKey) external returns (address);
    function sign(uint256 privateKey, bytes32 digest) external returns (uint8 v, bytes32 r, bytes32 s);
    function prank(address sender) external;
    function startPrank(address sender) external;
    function stopPrank() external;
    function warp(uint256 timestamp) external;
    function chainId(uint256 id) external;
    function expectRevert(bytes4 revertData) external;
    function expectRevert(bytes calldata revertData) external;
    function expectRevert() external;
    function recordLogs() external;
    function getRecordedLogs() external returns (Log[] memory logs);
}

abstract contract Assertions {
    TestVm internal constant vm = TestVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertEq(uint256 actual, uint256 expected) internal pure {
        require(actual == expected, "uint equality");
    }

    function assertEq(address actual, address expected) internal pure {
        require(actual == expected, "address equality");
    }

    function assertTrue(bool value) internal pure {
        require(value, "expected true");
    }

    function assertFalse(bool value) internal pure {
        require(!value, "expected false");
    }

    function assertLe(uint256 actual, uint256 maximum) internal pure {
        require(actual <= maximum, "above maximum");
    }
}

/// @notice Local test token. It is never represented as Circle USDC or used in the production deploy script.
contract MockUSDC is ERC20 {
    bool public failTransfers;
    bool public chargeFee;
    address public callback;
    bytes public callbackData;
    bool public callbackRejected;
    bytes public callbackRevertData;

    constructor() ERC20("Local test token", "MOCK") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setFailure(bool value) external {
        failTransfers = value;
    }

    function setFee(bool value) external {
        chargeFee = value;
    }

    function setCallback(address to, bytes calldata data) external {
        callback = to;
        callbackData = data;
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
            require(!failTransfers, "token transfer unavailable");
            if (callback != address(0)) {
                address target = callback;
                callback = address(0);
                (bool ok, bytes memory data) = target.call(callbackData);
                callbackRejected = !ok;
                callbackRevertData = data;
            }
            if (chargeFee && amount > 0) {
                super._update(from, address(0), 1);
                super._update(from, to, amount - 1);
                return;
            }
        }
        super._update(from, to, amount);
    }
}

contract WrongDecimalsToken is ERC20 {
    constructor() ERC20("Wrong decimals", "WRONG") {}
}
