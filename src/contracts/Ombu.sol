//SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ISemaphore} from "./ISemaphore.sol";
import {ISemaphoreGroups} from "./ISemaphoreGroups.sol";
import {OmbuPost} from "./structs.sol";

// Contract to manage the Ombu data e interoperate with Semaphore.

contract Ombu {
    // semaphore arbitrum sepolia address:0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
    ISemaphore public semaphore;
    uint256 public groupCounter;
    address public admin;

    // couter for the number of posts created, so we can follow an incremental id for posts.
    mapping(uint256 groupId => uint256 postIDCounter) public groupPostCounters;
    mapping(uint256 groupId => mapping(uint256 postIDCounter => uint256 subPostIDCounter)) public groupSubPostCounters;

    // groups ids created in semaphore.
    uint256[] public groups;

    //mapping to save a name for each group. starting from groupId 0.
    mapping(uint256 groupId => string name) public groupNames;

    // mapping to save posts for group.
    mapping(uint256 groupId => mapping(uint256 ombuPostId => OmbuPost post)) public groupPosts;

    //mapping to save subPost for each Post.
    mapping(uint256 groupId => mapping(uint256 ombuPostId => mapping(uint256 subPostId => OmbuPost subPost))) public
        postSubPosts;

    // mapping to save the user's vote in any main post.
    mapping(uint256 identityCommitment => mapping(uint256 groupId => mapping(uint256 postId => bool hasVoted))) public
        userPostVotes;
    // mapping to save the user's vote in any sub post.
    mapping(
        uint256 identityCommitment
            => mapping(uint256 groupId => mapping(uint256 postId => mapping(uint256 subPostId => bool hasVoted)))
    ) public userSubPostVotes;

    //Only Adming Guard.
    modifier onlyAdmin() {
        _onlyAdmin();
        _;
    }

    function _onlyAdmin() internal view {
        require(msg.sender == admin, "Not Allowed");
    }

    event change_Admin(address _newAdmin);

    constructor(address _semaphoreAddress) {
        semaphore = ISemaphore(_semaphoreAddress);
        admin = msg.sender;
        uint256 groupId = semaphore.createGroup();
        groupCounter++;
        // save the groups ids for later reference.
        groups.push(groupId);
        groupNames[groupId] = "Invisible Garden";
    }

    /****** Functions to Manage Post *****/
    // Function to create a main post in a group, another function will create subposts.
    function createMainPost(
        uint256 _groupId,
        uint256 _merkleTreeDepth,
        uint256 _merkleTreeRoot,
        uint256 _nullifier,
        uint256 _feedback,
        string calldata _title,
        string calldata _content,
        uint256[8] calldata _points
    ) external {
        // Create Semaphore proof struct using positional arguments (matching ISemaphore interface)
        // The _feedback parameter must match exactly what was used when generating the proof on the client side
        ISemaphore.SemaphoreProof memory proof =
            ISemaphore.SemaphoreProof(_merkleTreeDepth, _merkleTreeRoot, _nullifier, _feedback, _groupId, _points);

        // Validate the proof - this will revert if proof is invalid
        semaphore.validateProof(_groupId, proof);

        // If proof is valid, create the post

        OmbuPost memory newPost =
            OmbuPost({title: _title, content: _content, timestamp: uint32(block.timestamp), upvotes: 0, downvotes: 0});
        // post counter starts from 1, while groups ID can start from 0, because semaphore starts from group ID = 0.
        uint256 postIDCounter = groupPostCounters[_groupId];
        postIDCounter++;
        groupPostCounters[_groupId] = postIDCounter;
        // save the post in the mapping.
        groupPosts[_groupId][postIDCounter] = newPost;
    }

    // function to create subPosts, attached to a main post.
    function createSubPost(
        uint256 _groupId,
        uint256 _mainPostId,
        uint256 _merkleTreeDepth,
        uint256 _merkleTreeRoot,
        uint256 _nullifier,
        uint256 _feedback,
        string calldata _title,
        string calldata _content,
        uint256[8] calldata _points
    ) external {
        // Create Semaphore proof struct using positional arguments (matching ISemaphore interface)
        // The _feedback parameter must match exactly what was used when generating the proof on the client side
        ISemaphore.SemaphoreProof memory proof =
            ISemaphore.SemaphoreProof(_merkleTreeDepth, _merkleTreeRoot, _nullifier, _feedback, _groupId, _points);

        // Validate the proof - this will revert if proof is invalid
        semaphore.validateProof(_groupId, proof);

        // If proof is valid, create the post
        // OmbuPost memory post = groupPosts[_groupId][_mainPostId];
        require(groupPosts[_groupId][_mainPostId].timestamp != 0, "Main Post does not exist");

        uint256 subPostCounter = groupSubPostCounters[_groupId][_mainPostId];
        subPostCounter++;
        groupSubPostCounters[_groupId][_mainPostId] = subPostCounter;
        postSubPosts[_groupId][_mainPostId][subPostCounter] =
            OmbuPost({title: _title, content: _content, timestamp: uint32(block.timestamp), upvotes: 0, downvotes: 0});
    }

    // Function to vote on a main post.
    function voteOnPost(uint256 _groupId, uint256 _postId, bool _isUpvote, uint256 _identityCommitment) external {
        bool isAllowed = ISemaphoreGroups(address(semaphore)).hasMember(_groupId, _identityCommitment);
        require(isAllowed, "User is not a member of the group");

        OmbuPost storage post = groupPosts[_groupId][_postId];
        require(post.timestamp != 0, "Post does not exist");

        bool hasVoted = userPostVotes[_identityCommitment][_groupId][_postId];
        require(!hasVoted, "User has already voted on this post");

        if (_isUpvote) {
            post.upvotes += 1;
        } else {
            post.downvotes += 1;
        }
        userPostVotes[_identityCommitment][_groupId][_postId] = true;
    }

    // Function to vote on a sub post.
    function voteOnSubPost(
        uint256 _groupId,
        uint256 _postId,
        uint256 _subPostId,
        bool _isUpvote,
        uint256 _identityCommitment
    ) external {
        bool isAllowed = ISemaphoreGroups(address(semaphore)).hasMember(_groupId, _identityCommitment);
        require(isAllowed, "User is not a member of the group");

        OmbuPost storage subPost = postSubPosts[_groupId][_postId][_subPostId];
        require(subPost.timestamp != 0, "SubPost does not exist");

        bool hasVoted = userSubPostVotes[_identityCommitment][_groupId][_postId][_subPostId];
        require(!hasVoted, "User has already voted on this subpost");

        if (_isUpvote) {
            subPost.upvotes += 1;
        } else {
            subPost.downvotes += 1;
        }
        userSubPostVotes[_identityCommitment][_groupId][_postId][_subPostId] = true;
    }

    // function to delete a vote on post.
    function deleteVoteOnPost(uint256 _groupId, uint256 _postId, bool _isUpvote, uint256 _identityCommitment) external {
        bool isAllowed = ISemaphoreGroups(address(semaphore)).hasMember(_groupId, _identityCommitment);
        require(isAllowed, "User is not a member of the group");

        OmbuPost storage post = groupPosts[_groupId][_postId];
        require(post.timestamp != 0, "Post does not exist");

        bool hasVoted = userPostVotes[_identityCommitment][_groupId][_postId];
        require(hasVoted, "User has not voted on this post");

        if (_isUpvote) {
            post.upvotes--;
        } else {
            post.downvotes--;
        }
        userPostVotes[_identityCommitment][_groupId][_postId] = false;
    }

    // Function to delete a vote on sub post.
    function deleteVoteOnSubPost(
        uint256 _groupId,
        uint256 _postId,
        uint256 _subPostId,
        bool _isUpvote,
        uint256 _identityCommitment
    ) external {
        bool isAllowed = ISemaphoreGroups(address(semaphore)).hasMember(_groupId, _identityCommitment);
        require(isAllowed, "User is not a member of the group");

        OmbuPost storage subPost = postSubPosts[_groupId][_postId][_subPostId];
        require(subPost.timestamp != 0, "SubPost does not exist");

        bool hasVoted = userSubPostVotes[_identityCommitment][_groupId][_postId][_subPostId];
        require(hasVoted, "User has not voted on this subpost");

        if (_isUpvote) {
            subPost.upvotes--;
        } else {
            subPost.downvotes--;
        }
        userSubPostVotes[_identityCommitment][_groupId][_postId][_subPostId] = false;
    }

    /****** Functions to Manage Groups *****/

    // Create a new group in Semaphore.
    function createGroup(string calldata _name) external onlyAdmin returns (uint256) {
        uint256 groupId = semaphore.createGroup();
        groupNames[groupId] = _name;
        groupCounter++;
        // save the groups ids
        groups.push(groupId);
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

    // function to update the contract admin.
    function changeAdmin(address _newAdmin) external onlyAdmin {
        admin = _newAdmin;
        emit change_Admin(_newAdmin);
    }

    /// @notice Initiates a group admin update in Semaphore. Current group admin must call this.
    /// @dev Wraps Semaphore's updateGroupAdmin. The new admin must later call acceptGroupAdmin.
    function changeGroupAdmin(uint256 _groupId, address _newAdmin) external {
        // Forward to Semaphore. Access control is enforced by Semaphore itself (caller must be current admin).
        semaphore.updateGroupAdmin(_groupId, _newAdmin);
    }

    function acceptGroupAdmin(uint256 _groupId) external {
        // call semaphore to accept the group admin role.
        semaphore.acceptGroupAdmin(_groupId);
    }

    /// function to check if an identity commitment is member of a group.
    /// @notice Returns true if the identity commitment exists in the Semaphore group.
    /// @param _groupId The group id in Semaphore.
    /// @param _identityCommitment The identity commitment to check.
    /// @return True if the member exists, false otherwise.
    function isGroupMember(uint256 _groupId, uint256 _identityCommitment) external view returns (bool) {
        // The deployed Semaphore contract also exposes the ISemaphoreGroups view.
        // Cast to ISemaphoreGroups to call hasMember.
        return ISemaphoreGroups(address(semaphore)).hasMember(_groupId, _identityCommitment);
    }
}
