import express from "express";
import {groupMembersCache} from "./join.js";

const router = express.Router();

/**
 * Admin endpoint to manually add a member to cache
 * This is useful for populating cache with existing members who joined before cache was implemented
 *
 * POST /api/admin/add-member
 * Body: { groupId: "4", identityCommitment: "12172...126" }
 */
router.post("/add-member", (req, res) => {
    try {
        const {groupId, identityCommitment} = req.body;

        if (!groupId || !identityCommitment) {
            return res.status(400).json({
                error: "Missing parameters",
                details: "Both groupId and identityCommitment are required",
            });
        }

        console.log(`📝 Admin: Adding member to cache`);
        console.log(`   Group ID: ${groupId}`);
        console.log(`   Identity Commitment: ${identityCommitment}`);

        // Add to cache
        if (!groupMembersCache.has(groupId)) {
            groupMembersCache.set(groupId, new Set());
        }
        groupMembersCache.get(groupId).add(identityCommitment);

        const cacheSize = groupMembersCache.get(groupId).size;
        console.log(`✅ Member added to cache. Cache now has ${cacheSize} members for group ${groupId}`);

        return res.status(200).json({
            success: true,
            groupId: parseInt(groupId),
            identityCommitment,
            cacheSize,
        });
    } catch (error) {
        console.error("❌ Error adding member to cache:", error);
        return res.status(500).json({
            error: "Failed to add member to cache",
            message: error.message,
        });
    }
});

/**
 * Admin endpoint to set the entire cache with ordered members
 * POST /api/admin/set-members
 * Body: { groupId: "4", members: ["commitment1", "commitment2", ...] }
 */
router.post("/set-members", (req, res) => {
    try {
        const {groupId, members} = req.body;

        if (!groupId || !Array.isArray(members)) {
            return res.status(400).json({
                error: "Invalid parameters",
                details: "groupId and members array are required",
            });
        }

        console.log(`📝 Admin: Setting ordered members for group ${groupId}`);
        console.log(`   ${members.length} members provided`);

        // Set cache with ordered array
        groupMembersCache.set(groupId, members);

        console.log(`✅ Cache set with ${members.length} members in order`);

        return res.status(200).json({
            success: true,
            groupId: parseInt(groupId),
            memberCount: members.length,
        });
    } catch (error) {
        console.error("❌ Error setting cache:", error);
        return res.status(500).json({
            error: "Failed to set cache",
            message: error.message,
        });
    }
});

/**
 * Admin endpoint to view cache contents
 * GET /api/admin/cache
 */
router.get("/cache", (req, res) => {
    try {
        const cacheContents = {};
        for (const [groupId, members] of groupMembersCache.entries()) {
            const memberArray = Array.isArray(members) ? members : Array.from(members);
            cacheContents[groupId] = {
                count: memberArray.length,
                members: memberArray,
            };
        }

        return res.status(200).json({
            cache: cacheContents,
        });
    } catch (error) {
        console.error("❌ Error reading cache:", error);
        return res.status(500).json({
            error: "Failed to read cache",
            message: error.message,
        });
    }
});

export default router;
