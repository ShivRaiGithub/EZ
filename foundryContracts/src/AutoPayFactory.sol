// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./AutoPayWallet.sol";

/**
 * @title AutoPayFactory
 * @notice Factory contract to deploy AutoPayWallet contracts for users
 * @dev Each user gets their own AutoPayWallet contract instance
 */
contract AutoPayFactory {
    // Mapping from user address to their AutoPayWallet contract
    mapping(address => address) public userWallets;
    
    // Array of all deployed wallets
    address[] public allWallets;
    
    // USDC token address on Arc Testnet
    address public constant usdcToken=0x3600000000000000000000000000000000000000;
    
    // Events
    event WalletCreated(address indexed user, address indexed wallet, uint256 timestamp);
    
    constructor() {}
    
    /**
     * @notice Create a new AutoPayWallet for the caller
     * @return wallet Address of the newly created wallet
     */
    function createWallet() external returns (address wallet) {
        require(userWallets[msg.sender] == address(0), "Wallet already exists");
        
        // Deploy new AutoPayWallet
        AutoPayWallet newWallet = new AutoPayWallet(msg.sender, usdcToken);
        wallet = address(newWallet);
        
        // Store wallet address
        userWallets[msg.sender] = wallet;
        allWallets.push(wallet);
        
        emit WalletCreated(msg.sender, wallet, block.timestamp);
        
        return wallet;
    }
    
    /**
     * @notice Get wallet address for a user
     * @param user Address of the user
     * @return Address of user's wallet (address(0) if doesn't exist)
     */
    function getWallet(address user) external view returns (address) {
        return userWallets[user];
    }
    
    /**
     * @notice Get total number of wallets created
     * @return Total count of wallets
     */
    function getWalletCount() external view returns (uint256) {
        return allWallets.length;
    }
    
    /**
     * @notice Get wallet address by index
     * @param index Index in the allWallets array
     * @return Address of wallet at given index
     */
    function getWalletByIndex(uint256 index) external view returns (address) {
        require(index < allWallets.length, "Index out of bounds");
        return allWallets[index];
    }
}
