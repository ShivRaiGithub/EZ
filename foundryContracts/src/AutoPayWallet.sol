// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AutoPayWallet
 * @notice Smart contract wallet for managing automated recurring payments
 * @dev Owner can fund wallet, add/cancel autopayments, and withdraw funds
 */
contract AutoPayWallet is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Owner of this wallet
    address public immutable owner;
    
    // USDC token
    IERC20 public immutable usdcToken;
    
    // Relayer address that can execute payments
    address public relayer;
    
    // AutoPayment structure
    struct AutoPayment {
        string id; // MongoDB ID for reference
        address recipient;
        uint256 amount;
        string frequency;
        string destinationChain;
        bool isActive;
        uint256 createdAt;
    }
    
    // Mapping from payment ID to AutoPayment
    mapping(string => AutoPayment) public autoPayments;
    
    // Array of all payment IDs
    string[] public paymentIds;
    
    // Events
    event Funded(address indexed funder, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed owner, uint256 amount, uint256 timestamp);
    event AutoPaymentAdded(string indexed id, address indexed recipient, uint256 amount, uint256 timestamp);
    event AutoPaymentCancelled(string indexed id, uint256 timestamp);
    event AutoPaymentExecuted(string indexed id, address indexed recipient, uint256 amount, uint256 timestamp);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Not the relayer");
        _;
    }
    
    constructor(address _owner, address _usdcToken) {
        require(_owner != address(0), "Invalid owner address");
        require(_usdcToken != address(0), "Invalid USDC address");
        
        owner = _owner;
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @notice Fund the wallet with USDC
     * @param amount Amount of USDC to deposit (in 6 decimals)
     */
    function fund(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        
        emit Funded(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @notice Withdraw USDC from the wallet (owner only)
     * @param amount Amount of USDC to withdraw
     */
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        
        usdcToken.safeTransfer(owner, amount);
        
        emit Withdrawn(owner, amount, block.timestamp);
    }
    
    /**
     * @notice Add a new autopayment
     * @param id MongoDB ID for this payment
     * @param recipient Address to receive payments
     * @param amount Amount to pay each period (in 6 decimals)
     * @param frequency Payment frequency (daily, weekly, monthly, yearly)
     * @param destinationChain Destination chain for payment
     */
    function addAutoPayment(
        string memory id,
        address recipient,
        uint256 amount,
        string memory frequency,
        string memory destinationChain
    ) external onlyOwner {
        require(bytes(id).length > 0, "Invalid ID");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(autoPayments[id].id).length == 0, "Payment ID already exists");
        
        AutoPayment memory newPayment = AutoPayment({
            id: id,
            recipient: recipient,
            amount: amount,
            frequency: frequency,
            destinationChain: destinationChain,
            isActive: true,
            createdAt: block.timestamp
        });
        
        autoPayments[id] = newPayment;
        paymentIds.push(id);
        
        emit AutoPaymentAdded(id, recipient, amount, block.timestamp);
    }
    
    /**
     * @notice Cancel an autopayment
     * @param id Payment ID to cancel
     */
    function cancelAutoPayment(string memory id) external onlyOwner {
        require(bytes(autoPayments[id].id).length > 0, "Payment does not exist");
        require(autoPayments[id].isActive, "Payment already cancelled");
        
        autoPayments[id].isActive = false;
        
        emit AutoPaymentCancelled(id, block.timestamp);
    }
    
    /**
     * @notice Execute an autopayment (relayer only)
     * @param id Payment ID to execute
     * @dev This approves the relayer to transfer USDC for cross-chain bridging
     */
    function executeAutoPayment(string memory id) external onlyRelayer nonReentrant {
        AutoPayment storage payment = autoPayments[id];
        
        require(bytes(payment.id).length > 0, "Payment does not exist");
        require(payment.isActive, "Payment is not active");
        
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance >= payment.amount, "Insufficient balance");
        
        // Transfer USDC to relayer for bridging
        usdcToken.safeTransfer(relayer, payment.amount);
        
        emit AutoPaymentExecuted(id, payment.recipient, payment.amount, block.timestamp);
    }
    
    /**
     * @notice Set relayer address (owner only)
     * @param _relayer New relayer address
     */
    function setRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "Invalid relayer address");
        
        address oldRelayer = relayer;
        relayer = _relayer;
        
        emit RelayerUpdated(oldRelayer, _relayer, block.timestamp);
    }
    
    /**
     * @notice Get wallet balance
     * @return USDC balance of this wallet
     */
    function getBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
    
    /**
     * @notice Get autopayment details
     * @param id Payment ID
     * @return AutoPayment struct
     */
    function getAutoPayment(string memory id) external view returns (AutoPayment memory) {
        return autoPayments[id];
    }
    
    /**
     * @notice Get total number of autopayments
     * @return Count of all autopayments (active and cancelled)
     */
    function getPaymentCount() external view returns (uint256) {
        return paymentIds.length;
    }
    
    /**
     * @notice Get payment ID by index
     * @param index Index in paymentIds array
     * @return Payment ID at given index
     */
    function getPaymentIdByIndex(uint256 index) external view returns (string memory) {
        require(index < paymentIds.length, "Index out of bounds");
        return paymentIds[index];
    }
}
