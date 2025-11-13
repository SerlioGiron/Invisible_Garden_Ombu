//! Ombu Contract - Arbitrum Stylus Implementation
//!
//! This contract manages anonymous posts and voting using Semaphore zero-knowledge proofs.
//! Converted from Solidity to Rust using the Arbitrum Stylus SDK.

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use alloy_primitives::{Address, U256};
use alloy_sol_types::sol;
use stylus_sdk::{
    alloy_primitives::FixedBytes,
    evm,
    msg,
    prelude::*,
    storage::{StorageAddress, StorageArray, StorageMap, StorageString, StorageU256, StorageU32, StorageVec},
};

// Define the OmbuPost structure
sol_storage! {
    pub struct OmbuPost {
        string content;
        uint32 timestamp;
        uint32 upvotes;
        uint32 downvotes;
    }
}

// Define events
sol! {
    event ChangeAdmin(address indexed newAdmin);
    event PostCreated(uint256 indexed groupId, uint256 indexed postId, uint32 timestamp);
    event SubPostCreated(uint256 indexed groupId, uint256 indexed postId, uint256 indexed subPostId, uint32 timestamp);
    event VoteCast(uint256 indexed groupId, uint256 indexed postId, address indexed voter, bool isUpvote);
    event SubPostVoteCast(uint256 indexed groupId, uint256 indexed postId, uint256 indexed subPostId, address voter, bool isUpvote);
}

// Define Semaphore Proof structure to match ISemaphore interface
sol! {
    struct SemaphoreProof {
        uint256 merkleTreeDepth;
        uint256 merkleTreeRoot;
        uint256 nullifier;
        uint256 feedback;
        uint256 groupId;
        uint256[8] points;
    }
}

// Define Semaphore interface for external calls
sol_interface! {
    interface ISemaphore {
        function createGroup() external returns (uint256);
        function addMember(uint256 groupId, uint256 identityCommitment) external;
        function removeMember(uint256 groupId, uint256 identityCommitment, uint256[] calldata merkleProofSiblings) external;
        function validateProof(uint256 groupId, SemaphoreProof calldata proof) external view;
        function updateGroupAdmin(uint256 groupId, address newAdmin) external;
        function acceptGroupAdmin(uint256 groupId) external;
    }

    interface ISemaphoreGroups {
        function hasMember(uint256 groupId, uint256 identityCommitment) external view returns (bool);
    }
}

// Custom errors
sol! {
    error NotAllowed();
    error PostDoesNotExist();
    error MainPostDoesNotExist();
    error UserNotGroupMember();
    error AlreadyVoted();
    error HasNotVoted();
}

// Main contract storage
sol_storage! {
    #[entrypoint]
    pub struct Ombu {
        address semaphore;
        uint256 group_counter;
        address admin;

        // Mapping: groupId => postIDCounter
        mapping(uint256 => uint256) group_post_counters;

        // Array of group IDs
        uint256[] groups;

        // Mapping: groupId => name
        mapping(uint256 => string) group_names;

        // Mapping: groupId => postId => OmbuPost
        mapping(uint256 => mapping(uint256 => OmbuPost)) group_posts;

        // Mapping: groupId => postId => subPostId => OmbuPost
        mapping(uint256 => mapping(uint256 => mapping(uint256 => OmbuPost))) post_sub_posts;

        // Mapping: user => groupId => postId => hasVoted
        mapping(address => mapping(uint256 => mapping(uint256 => bool))) user_post_votes;

        // Mapping: user => groupId => postId => subPostId => hasVoted
        mapping(address => mapping(uint256 => mapping(uint256 => mapping(uint256 => bool)))) user_sub_post_votes;
    }
}

#[public]
impl Ombu {
    /// Initialize the contract with Semaphore address
    pub fn init(&mut self, semaphore_address: Address) -> Result<(), Vec<u8>> {
        self.semaphore.set(semaphore_address);
        self.admin.set(msg::sender());

        // Create initial group
        let semaphore = ISemaphore::new(*self.semaphore);
        let config = Call::new();
        let group_id = semaphore.create_group(config)?;

        self.group_counter.set(U256::from(1));
        self.groups.push(group_id);
        self.group_names.setter(group_id).set_str("Invisible Garden");

        Ok(())
    }

    /****** Functions to Manage Posts *****/

    /// Create a main post in a group with Semaphore proof verification
    #[allow(clippy::too_many_arguments)]
    pub fn create_main_post(
        &mut self,
        group_id: U256,
        merkle_tree_depth: U256,
        merkle_tree_root: U256,
        nullifier: U256,
        feedback: U256,
        content: String,
        points: [U256; 8],
    ) -> Result<(), Vec<u8>> {
        // Create Semaphore proof
        let proof = SemaphoreProof {
            merkleTreeDepth: merkle_tree_depth,
            merkleTreeRoot: merkle_tree_root,
            nullifier,
            feedback,
            groupId: group_id,
            points,
        };

        // Validate the proof via external call to Semaphore
        let semaphore = ISemaphore::new(*self.semaphore);
        let config = Call::new();
        semaphore.validate_proof(config, group_id, proof)?;

        // Get current timestamp
        let timestamp = U256::from(evm::block_timestamp());
        let timestamp_u32 = timestamp.to::<u32>();

        // Create new post
        let mut post_counter = self.group_post_counters.get(group_id);
        post_counter += U256::from(1);
        self.group_post_counters.setter(group_id).set(post_counter);

        // Save the post
        let mut post = self.group_posts.setter(group_id).setter(post_counter);
        post.content.set_str(&content);
        post.timestamp.set(timestamp_u32);
        post.upvotes.set(0);
        post.downvotes.set(0);

        // Emit event
        evm::log(PostCreated {
            groupId: group_id,
            postId: post_counter,
            timestamp: timestamp_u32,
        });

        Ok(())
    }

    /// Create a sub-post attached to a main post
    #[allow(clippy::too_many_arguments)]
    pub fn create_sub_post(
        &mut self,
        group_id: U256,
        main_post_id: U256,
        merkle_tree_depth: U256,
        merkle_tree_root: U256,
        nullifier: U256,
        feedback: U256,
        content: String,
        points: [U256; 8],
    ) -> Result<(), Vec<u8>> {
        // Create Semaphore proof
        let proof = SemaphoreProof {
            merkleTreeDepth: merkle_tree_depth,
            merkleTreeRoot: merkle_tree_root,
            nullifier,
            feedback,
            groupId: group_id,
            points,
        };

        // Validate the proof via external call to Semaphore
        let semaphore = ISemaphore::new(*self.semaphore);
        let config = Call::new();
        semaphore.validate_proof(config, group_id, proof)?;

        // Check that main post exists
        let main_post = self.group_posts.getter(group_id).get(main_post_id);
        if main_post.timestamp.get() == 0 {
            return Err(MainPostDoesNotExist {}.encode());
        }

        // Get current timestamp
        let timestamp = U256::from(evm::block_timestamp());
        let timestamp_u32 = timestamp.to::<u32>();

        // Create new sub-post (starting from ID 1)
        let sub_post_id = U256::from(1);
        let mut sub_post = self
            .post_sub_posts
            .setter(group_id)
            .setter(main_post_id)
            .setter(sub_post_id);

        sub_post.content.set_str(&content);
        sub_post.timestamp.set(timestamp_u32);
        sub_post.upvotes.set(0);
        sub_post.downvotes.set(0);

        // Emit event
        evm::log(SubPostCreated {
            groupId: group_id,
            postId: main_post_id,
            subPostId: sub_post_id,
            timestamp: timestamp_u32,
        });

        Ok(())
    }

    /// Vote on a main post
    pub fn vote_on_post(
        &mut self,
        group_id: U256,
        post_id: U256,
        is_upvote: bool,
        identity_commitment: U256,
    ) -> Result<(), Vec<u8>> {
        // Check if user is a group member
        let semaphore_groups = ISemaphoreGroups::new(*self.semaphore);
        let config = Call::new();
        let is_member = semaphore_groups.has_member(config, group_id, identity_commitment)?;

        if !is_member {
            return Err(UserNotGroupMember {}.encode());
        }

        // Check if post exists
        let post = self.group_posts.getter(group_id).get(post_id);
        if post.timestamp.get() == 0 {
            return Err(PostDoesNotExist {}.encode());
        }

        // Check if user has already voted
        let has_voted = self
            .user_post_votes
            .getter(msg::sender())
            .getter(group_id)
            .get(post_id);

        if has_voted {
            return Err(AlreadyVoted {}.encode());
        }

        // Cast vote
        let mut post_mut = self.group_posts.setter(group_id).setter(post_id);
        if is_upvote {
            let current_upvotes = post_mut.upvotes.get();
            post_mut.upvotes.set(current_upvotes + 1);
        } else {
            let current_downvotes = post_mut.downvotes.get();
            post_mut.downvotes.set(current_downvotes + 1);
        }

        // Mark as voted
        self.user_post_votes
            .setter(msg::sender())
            .setter(group_id)
            .setter(post_id)
            .set(true);

        // Emit event
        evm::log(VoteCast {
            groupId: group_id,
            postId: post_id,
            voter: msg::sender(),
            isUpvote: is_upvote,
        });

        Ok(())
    }

    /// Vote on a sub-post
    pub fn vote_on_sub_post(
        &mut self,
        group_id: U256,
        post_id: U256,
        sub_post_id: U256,
        is_upvote: bool,
        identity_commitment: U256,
    ) -> Result<(), Vec<u8>> {
        // Check if user is a group member
        let semaphore_groups = ISemaphoreGroups::new(*self.semaphore);
        let config = Call::new();
        let is_member = semaphore_groups.has_member(config, group_id, identity_commitment)?;

        if !is_member {
            return Err(UserNotGroupMember {}.encode());
        }

        // Check if sub-post exists
        let sub_post = self
            .post_sub_posts
            .getter(group_id)
            .getter(post_id)
            .get(sub_post_id);

        if sub_post.timestamp.get() == 0 {
            return Err(PostDoesNotExist {}.encode());
        }

        // Check if user has already voted
        let has_voted = self
            .user_sub_post_votes
            .getter(msg::sender())
            .getter(group_id)
            .getter(post_id)
            .get(sub_post_id);

        if has_voted {
            return Err(AlreadyVoted {}.encode());
        }

        // Cast vote
        let mut sub_post_mut = self
            .post_sub_posts
            .setter(group_id)
            .setter(post_id)
            .setter(sub_post_id);

        if is_upvote {
            let current_upvotes = sub_post_mut.upvotes.get();
            sub_post_mut.upvotes.set(current_upvotes + 1);
        } else {
            let current_downvotes = sub_post_mut.downvotes.get();
            sub_post_mut.downvotes.set(current_downvotes + 1);
        }

        // Mark as voted
        self.user_sub_post_votes
            .setter(msg::sender())
            .setter(group_id)
            .setter(post_id)
            .setter(sub_post_id)
            .set(true);

        // Emit event
        evm::log(SubPostVoteCast {
            groupId: group_id,
            postId: post_id,
            subPostId: sub_post_id,
            voter: msg::sender(),
            isUpvote: is_upvote,
        });

        Ok(())
    }

    /// Delete a vote on a main post
    pub fn delete_vote_on_post(
        &mut self,
        group_id: U256,
        post_id: U256,
        is_upvote: bool,
        identity_commitment: U256,
    ) -> Result<(), Vec<u8>> {
        // Check if user is a group member
        let semaphore_groups = ISemaphoreGroups::new(*self.semaphore);
        let config = Call::new();
        let is_member = semaphore_groups.has_member(config, group_id, identity_commitment)?;

        if !is_member {
            return Err(UserNotGroupMember {}.encode());
        }

        // Check if post exists
        let post = self.group_posts.getter(group_id).get(post_id);
        if post.timestamp.get() == 0 {
            return Err(PostDoesNotExist {}.encode());
        }

        // Check if user has voted
        let has_voted = self
            .user_post_votes
            .getter(msg::sender())
            .getter(group_id)
            .get(post_id);

        if !has_voted {
            return Err(HasNotVoted {}.encode());
        }

        // Remove vote
        let mut post_mut = self.group_posts.setter(group_id).setter(post_id);
        if is_upvote {
            let current_upvotes = post_mut.upvotes.get();
            post_mut.upvotes.set(current_upvotes - 1);
        } else {
            let current_downvotes = post_mut.downvotes.get();
            post_mut.downvotes.set(current_downvotes - 1);
        }

        // Mark as not voted
        self.user_post_votes
            .setter(msg::sender())
            .setter(group_id)
            .setter(post_id)
            .set(false);

        Ok(())
    }

    /// Delete a vote on a sub-post
    pub fn delete_vote_on_sub_post(
        &mut self,
        group_id: U256,
        post_id: U256,
        sub_post_id: U256,
        is_upvote: bool,
        identity_commitment: U256,
    ) -> Result<(), Vec<u8>> {
        // Check if user is a group member
        let semaphore_groups = ISemaphoreGroups::new(*self.semaphore);
        let config = Call::new();
        let is_member = semaphore_groups.has_member(config, group_id, identity_commitment)?;

        if !is_member {
            return Err(UserNotGroupMember {}.encode());
        }

        // Check if sub-post exists
        let sub_post = self
            .post_sub_posts
            .getter(group_id)
            .getter(post_id)
            .get(sub_post_id);

        if sub_post.timestamp.get() == 0 {
            return Err(PostDoesNotExist {}.encode());
        }

        // Check if user has voted
        let has_voted = self
            .user_sub_post_votes
            .getter(msg::sender())
            .getter(group_id)
            .getter(post_id)
            .get(sub_post_id);

        if !has_voted {
            return Err(HasNotVoted {}.encode());
        }

        // Remove vote
        let mut sub_post_mut = self
            .post_sub_posts
            .setter(group_id)
            .setter(post_id)
            .setter(sub_post_id);

        if is_upvote {
            let current_upvotes = sub_post_mut.upvotes.get();
            sub_post_mut.upvotes.set(current_upvotes - 1);
        } else {
            let current_downvotes = sub_post_mut.downvotes.get();
            sub_post_mut.downvotes.set(current_downvotes - 1);
        }

        // Mark as not voted
        self.user_sub_post_votes
            .setter(msg::sender())
            .setter(group_id)
            .setter(post_id)
            .setter(sub_post_id)
            .set(false);

        Ok(())
    }

    /****** Functions to Manage Groups *****/

    /// Create a new group in Semaphore
    pub fn create_group(&mut self, name: String) -> Result<U256, Vec<u8>> {
        // Only admin can create groups
        if msg::sender() != *self.admin {
            return Err(NotAllowed {}.encode());
        }

        let semaphore = ISemaphore::new(*self.semaphore);
        let config = Call::new();
        let group_id = semaphore.create_group(config)?;

        self.group_names.setter(group_id).set_str(&name);

        let mut counter = self.group_counter.get();
        counter += U256::from(1);
        self.group_counter.set(counter);

        self.groups.push(group_id);

        Ok(group_id)
    }

    /// Add a member to a group
    pub fn add_member(&mut self, group_id: U256, identity_commitment: U256) -> Result<(), Vec<u8>> {
        let semaphore = ISemaphore::new(*self.semaphore);
        let config = Call::new();
        semaphore.add_member(config, group_id, identity_commitment)?;
        Ok(())
    }

    /// Remove a member from a group (admin only)
    pub fn remove_member(
        &mut self,
        group_id: U256,
        identity_commitment: U256,
        merkle_proof_siblings: Vec<U256>,
    ) -> Result<(), Vec<u8>> {
        // Only admin can remove members
        if msg::sender() != *self.admin {
            return Err(NotAllowed {}.encode());
        }

        let semaphore = ISemaphore::new(*self.semaphore);
        let config = Call::new();
        semaphore.remove_member(config, group_id, identity_commitment, merkle_proof_siblings)?;
        Ok(())
    }

    /// Change the contract admin
    pub fn change_admin(&mut self, new_admin: Address) -> Result<(), Vec<u8>> {
        // Only admin can change admin
        if msg::sender() != *self.admin {
            return Err(NotAllowed {}.encode());
        }

        self.admin.set(new_admin);

        evm::log(ChangeAdmin {
            newAdmin: new_admin,
        });

        Ok(())
    }

    /// Initiate a group admin update in Semaphore
    pub fn change_group_admin(&mut self, group_id: U256, new_admin: Address) -> Result<(), Vec<u8>> {
        let semaphore = ISemaphore::new(*self.semaphore);
        let config = Call::new();
        semaphore.update_group_admin(config, group_id, new_admin)?;
        Ok(())
    }

    /// Accept group admin role
    pub fn accept_group_admin(&mut self, group_id: U256) -> Result<(), Vec<u8>> {
        let semaphore = ISemaphore::new(*self.semaphore);
        let config = Call::new();
        semaphore.accept_group_admin(config, group_id)?;
        Ok(())
    }

    /// Check if an identity commitment is a member of a group
    pub fn is_group_member(&self, group_id: U256, identity_commitment: U256) -> Result<bool, Vec<u8>> {
        let semaphore_groups = ISemaphoreGroups::new(*self.semaphore);
        let config = Call::new();
        let is_member = semaphore_groups.has_member(config, group_id, identity_commitment)?;
        Ok(is_member)
    }

    /****** View Functions *****/

    /// Get the Semaphore contract address
    pub fn get_semaphore(&self) -> Address {
        *self.semaphore
    }

    /// Get the group counter
    pub fn get_group_counter(&self) -> U256 {
        self.group_counter.get()
    }

    /// Get the admin address
    pub fn get_admin(&self) -> Address {
        *self.admin
    }

    /// Get post counter for a group
    pub fn get_group_post_counter(&self, group_id: U256) -> U256 {
        self.group_post_counters.get(group_id)
    }

    /// Get group name
    pub fn get_group_name(&self, group_id: U256) -> String {
        self.group_names.get(group_id).get_string()
    }

    /// Get a post
    pub fn get_post(&self, group_id: U256, post_id: U256) -> (String, u32, u32, u32) {
        let post = self.group_posts.getter(group_id).get(post_id);
        (
            post.content.get_string(),
            post.timestamp.get(),
            post.upvotes.get(),
            post.downvotes.get(),
        )
    }

    /// Get a sub-post
    pub fn get_sub_post(&self, group_id: U256, post_id: U256, sub_post_id: U256) -> (String, u32, u32, u32) {
        let sub_post = self
            .post_sub_posts
            .getter(group_id)
            .getter(post_id)
            .get(sub_post_id);
        (
            sub_post.content.get_string(),
            sub_post.timestamp.get(),
            sub_post.upvotes.get(),
            sub_post.downvotes.get(),
        )
    }

    /// Check if user has voted on a post
    pub fn has_user_voted_on_post(&self, user: Address, group_id: U256, post_id: U256) -> bool {
        self.user_post_votes
            .getter(user)
            .getter(group_id)
            .get(post_id)
    }

    /// Check if user has voted on a sub-post
    pub fn has_user_voted_on_sub_post(
        &self,
        user: Address,
        group_id: U256,
        post_id: U256,
        sub_post_id: U256,
    ) -> bool {
        self.user_sub_post_votes
            .getter(user)
            .getter(group_id)
            .getter(post_id)
            .get(sub_post_id)
    }
}
