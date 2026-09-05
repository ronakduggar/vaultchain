import { createClient } from "redis";

const inMemoryRevoked = new Set();
let isRedisConnected = false;

export const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redisClient.on("error", (error) => {
    // Only log if previously connected
    if (isRedisConnected) {
        console.error("Redis error:", error.message);
    }
});

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            isRedisConnected = true;
            console.log("Redis Connected Successfully");
        }
    } catch (err) {
        console.warn("Redis unavailable, using memory fallback for token revocation");
        isRedisConnected = false;
    }
};

export const revokeToken = async (tokenId, expiresAt) => {
    if (isRedisConnected && redisClient.isOpen) {
        try {
            const seconds = Math.max(1, Math.ceil(expiresAt - Date.now() / 1000));
            await redisClient.set(`vaultchain:revoked:${tokenId}`, "1", { EX: seconds });
            return;
        } catch (e) {
            // fallback
        }
    }
    inMemoryRevoked.add(tokenId);
};

export const isTokenRevoked = async (tokenId) => {
    if (isRedisConnected && redisClient.isOpen) {
        try {
            return Boolean(await redisClient.get(`vaultchain:revoked:${tokenId}`));
        } catch (e) {
            // fallback
        }
    }
    return inMemoryRevoked.has(tokenId);
};