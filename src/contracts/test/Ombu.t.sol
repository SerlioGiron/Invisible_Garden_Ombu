// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {Ombu} from "../src/Ombu.sol";
import {ISemaphoreGroups} from "../src/ISemaphoreGroups.sol";
import {OmbuPost} from "../src/structs.sol";

contract OmbuTest is Test {
    // semaphore arbitrum sepolia address:0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
    address constant semaphoreAddress = 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D;
    address public admin = address(1);
    address first_Admin = 0xB4E6E678Bc83875891671EC70337aD08E1dD66d7;
    Ombu public ombu;
    ISemaphoreGroups public semaphoreGroup;

    OmbuPost public post;

    function setUp() public {
        // Arbitrum Sepolia fork block:211876438 - Nov-04-2025 11:39:01 PM +UTC
        /* uint256 forkId = vm.createFork(ARBITRUM_SEPOLIA_RPC, 211876438);
        vm.selectFork(forkId); */

        ombu = new Ombu(semaphoreAddress, admin);
        semaphoreGroup = ISemaphoreGroups(semaphoreAddress);
    }

    function test_Ombu_Deployment() public view {
        address semaphore = address(ombu.semaphore());
        assertEq(semaphore, semaphoreAddress);
        assertEq(ombu.admin(), admin, "Wrong admin");
        assertEq(ombu.groupCounter(), 1, "wrong groupId");
    }

    function test_Admin_Create_Group() public {
        vm.prank(admin);
        uint256 newGroupId = ombu.createGroup("test group");
        assertEq(newGroupId, 2, "wrong new groupId");
    }

    function test_Add_Member() public {
        // al parecer alguien ejecuto pruebas en la blockchain directo porque ya existen el grupo 0,1
        uint256 groupId = 2;
        uint256 identityCommitment = 123456789;

        vm.prank(admin);
        uint256 newGroupId = ombu.createGroup("test group");
        address groupAdmin = semaphoreGroup.getGroupAdmin(groupId);
        console.log("Group 0 Admin:", groupAdmin);

        vm.prank(admin);
        ombu.addMember(groupId, identityCommitment);
        bool member_added = semaphoreGroup.hasMember(groupId, identityCommitment);
        assertTrue(member_added, "Member was not added");
    }

    function test_Remove_Member() public {
        uint256 groupId = 2;
        uint256 identityCommitment = 123456789;
        uint256[] memory merkleProofSiblings = new uint256[](0); // Placeholder, should be a valid proof.

        vm.prank(admin);
        uint256 newGroupId = ombu.createGroup("test group");
        /*
                vm.prank(admin);
                ombu.removeMember(groupId, identityCommitment, merkleProofSiblings);
                bool member_exists = semaphoreGroup.hasMember(groupId, identityCommitment);
                assertFalse(member_exists, "Member was not removed");
                */
    }

    // function to test the creation of posts.
    function test_OmbuPost() public {
        // Now just testing the register of the post on-chain, because to validate the proof, it has to be generated off-chain.
        uint256 groupId = 0;
        string memory content = "Hello, Ombu!";
        ombu.createMainPost(groupId, content);
        // groupID, ombuPostId
        (address author, string memory _content,, uint32 upvotes, uint32 downvotes) = ombu.groupPosts(groupId, 1);
        assertEq(author, address(this), "Wrong author");
        assertEq(_content, content, "Wrong content");
        assertEq(upvotes, 0);
        assertEq(downvotes, 0);

        // Test if a comment can be ou
    }

    // function to test the creation of subPosts.
    function test_OmbuSubPost() public {
        uint256 groupId = 0;
        uint256 parentPostId = 1;
        string memory content = "Ombu SubPost!";

        // first create a main post to have a parentPostId
        string memory postContent = "Hello, Ombu!";
        ombu.createMainPost(groupId, postContent);

        ombu.createSubPost(groupId, parentPostId, content);
        (address author, string memory _content,, uint32 upvotes, uint32 downvotes) =
            ombu.postSubPosts(groupId, parentPostId, 1);

        assertEq(author, address(this), "Wrong subpost author");
        assertEq(_content, content, "Wrong subpost content");
        assertEq(upvotes, 0);
        assertEq(downvotes, 0);
    }

    // function to test the upvotes mechanism (add and remove a upvote).
    function test_MainPost_Upvote_DownVote() public {
        // Test adding an upvote in a main post.
        uint256 groupId = 0;
        uint256 postId = 1;
        bool isUpvote = true;
        string memory content = "Hello, Ombu!";

        ombu.createMainPost(groupId, content);
        ombu.voteOnPost(groupId, postId, isUpvote);

        (bool hasVoted) = ombu.userPostVotes(address(this), groupId, postId);
        assertEq(hasVoted, true, "Upvote not registered");

        (,,, uint32 upvotes, uint32 downvotes) = ombu.groupPosts(groupId, 1);
        assertEq(upvotes, 1, "Upvote count incorrect");
        assertEq(downvotes, 0, "Downvote count incorrect");

        vm.expectRevert("User has already voted on this post");
        ombu.voteOnPost(groupId, postId, isUpvote);

        // Testing removing a vote in a main post.
        ombu.deleteVoteOnPost(groupId, postId, isUpvote);
        (,,, uint32 upvotes2, uint32 downvotes2) = ombu.groupPosts(groupId, 1);
        assertEq(upvotes2, 0, "Upvote wasn't removed");
        assertEq(downvotes2, 0, "Downvote count incorrect after removing upvote");
    }

    // function to test the downvotes mechanism (add and remove a downvote).
    function test_subPost_Down_Up_Vote() public {
        // Test adding a downvote in a sub post.
        uint256 groupId = 0;
        uint256 postId = 1;
        uint256 subPostId = 1;
        bool isUpvote = false;
        string memory content = "Hello, Ombu!";
        string memory content2 = "Ombu Sub Post!";

        ombu.createMainPost(groupId, content);
        ombu.createSubPost(groupId, postId, content2);
        ombu.voteOnSubPost(groupId, postId, subPostId, isUpvote);

        (bool hasVoted) = ombu.userSubPostVotes(address(this), groupId, postId, subPostId);
        assertEq(hasVoted, true, "Downvote not registered");

        (,,, uint32 upvotes, uint32 downvotes) = ombu.postSubPosts(groupId, postId, subPostId);
        assertEq(upvotes, 0, "Upvote count incorrect");
        assertEq(downvotes, 1, "Downvote count incorrect");

        vm.expectRevert("User has already voted on this subpost");
        ombu.voteOnSubPost(groupId, postId, subPostId, isUpvote);

        // Testing removing a vote in a sub post.
        ombu.deleteVoteOnSubPost(groupId, postId, subPostId, isUpvote);
        (,,, uint32 upvotes2, uint32 downvotes2) = ombu.postSubPosts(groupId, postId, subPostId);
        assertEq(upvotes2, 0, "Upvote count incorrect after removing downvote");
        assertEq(downvotes2, 0, "Downvote wasn't removed");
    }

    // function to test the edit of a post.
    function test_EditPost() public {}

    // function to tes edit of subPost.
    function test_EditSubPost() public {}

    //@note ¿Validar si se permitira eliminar posts?
}
