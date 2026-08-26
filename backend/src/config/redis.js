import { createClient } from "redis";

export const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redisClient.on("error", (error) => console.error("Redis error:", error.message));

export const connectRedis = async () => {
    if (!redisClient.isOpen) await redisClient.connect();
};

export const revokeToken = async (tokenId, expiresAt) => {
    const seconds = Math.max(1, Math.ceil(expiresAt - Date.now() / 1000));
    await redisClient.set(`vaultchain:revoked:${tokenId}`, "1", { EX: seconds });
};

export const isTokenRevoked = async (tokenId) =>
    Boolean(await redisClient.get(`vaultchain:revoked:${tokenId}`));