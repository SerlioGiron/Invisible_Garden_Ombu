//SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./ISemaphore.sol";

// Contract to manage the Ombu data e interoperate with Semaphore.

contract Ombu {
    // semaphore arbitrum sepolia address:0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
    ISemaphore public semaphore;
    uint256 public groupCounter;
    address public admin;

    //mapping to save a name for each group. starting from groupId 0.
    mapping(uint256 groupId => string name) public groupNames;

    // mapping to save posts for group.
    mapping(uint256 groupId => OmbuPost[] post) public groupPosts;

    //mapping para linkear posts y subposts.
    mapping(uint64 ombuPostId => OmbuPost[] subPost) public postSubPosts;

    // Data structure to hold Ombu posts.
    struct OmbuPost {
        uint64 id;
        address author;
        string content;
        uint32 timestamp;
        uint32 upvotes;
        uint32 downvotes;
    }

    //maybe user struct

    //Only Adming Guard.
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not Allowed");
        _;
    }

    constructor(address _semaphoreAddress, address _ombuAdmin) {
        semaphore = ISemaphore(_semaphoreAddress);
        admin = _ombuAdmin;
        // semaphore inicia con Id 0 = Invisible Garden.
        uint256 groupId = semaphore.createGroup();
        groupCounter++;
        groupNames[groupId] = "Invisible Garden";
    }

    // Create a new group in Semaphore.
    function createGroup(string calldata _name) external onlyAdmin returns (uint256) {
        uint256 groupId = semaphore.createGroup();
        groupNames[groupId] = _name;
        groupCounter++;
        return groupId;
    }

    // Add member to a group.
    // For now anyone can add members, so the user can be add in the same Tx they created their identity commitment.
    function addMember(uint256 _groupId, uint256 _identityCommitment) external {
        semaphore.addMember(_groupId, _identityCommitment);
    }

    // function to remove member from a group.
    function removeMember(uint256 _groupId, uint256 _identityCommitment, uint256[] calldata _merkleProofSiblings)
        external
        onlyAdmin
    {
        semaphore.removeMember(_groupId, _identityCommitment, _merkleProofSiblings);
    }
}
