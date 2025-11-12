import express from "express";
import {getIdentityCommitmentsByGroup, getIdentityCommitmentsInOrder} from "../utils/mongodb.js";

const router = express.Router();

/**
 * Admin endpoint to view members from database for a specific group
 * GET /api/admin/members/:groupId
 */
router.get("/members/:groupId", async (req, res) => {
    try {
        const {groupId} = req.params;
        const groupIdNum = parseInt(groupId);

        console.log(`📝 Admin: Retrieving members from database for group ${groupId}`);

        const members = await getIdentityCommitmentsByGroup(groupIdNum);

        return res.status(200).json({
            success: true,
            groupId: groupIdNum,
            memberCount: members.length,
            members: members,
        });
    } catch (error) {
        console.error("❌ Error retrieving members from database:", error);
        return res.status(500).json({
            error: "Failed to retrieve members from database",
            message: error.message,
        });
    }
});

/**
 * Admin endpoint to view all members from database
 * GET /api/admin/members
 */
router.get("/members", async (req, res) => {
    try {
        console.log(`📝 Admin: Retrieving all members from database`);

        const members = await getIdentityCommitmentsInOrder();

        return res.status(200).json({
            success: true,
            memberCount: members.length,
            members: members,
        });
    } catch (error) {
        console.error("❌ Error retrieving members from database:", error);
        return res.status(500).json({
            error: "Failed to retrieve members from database",
            message: error.message,
        });
    }
});

export default router;
