import axios from 'axios';
import { prisma } from './prisma';

export async function getInstagramProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user?.instagramAccessToken || !user?.instagramUserId) {
        throw new Error('Instagram not connected');
    }

    try {
        const response = await axios.get(
            `https://graph.instagram.com/${user.instagramUserId}`,
            {
                params: {
                    fields: 'id,username,account_type',
                    access_token: user.instagramAccessToken,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error fetching Instagram profile:', error);
        throw error;
    }
}

export async function publishReelToInstagram(
    userId: string,
    videoUrl: string,
    caption?: string
) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user?.instagramAccessToken || !user?.instagramUserId) {
        throw new Error('Instagram not connected');
    }

    try {
        // Step 1: Create container
        const containerResponse = await axios.post(
            `https://graph.instagram.com/v21.0/${user.instagramUserId}/media`,
            null,
            {
                params: {
                    media_type: 'REELS',
                    video_url: videoUrl,
                    caption: caption || '',
                    access_token: user.instagramAccessToken,
                },
            }
        );

        const containerId = containerResponse.data.id;

        // Step 2: Poll for container status
        let status = 'IN_PROGRESS';
        let attempts = 0;
        const maxAttempts = 30;

        while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

            const statusResponse = await axios.get(
                `https://graph.instagram.com/v21.0/${containerId}`,
                {
                    params: {
                        fields: 'status_code',
                        access_token: user.instagramAccessToken,
                    },
                }
            );

            status = statusResponse.data.status_code;
            attempts++;
        }

        if (status !== 'FINISHED') {
            throw new Error(`Container not ready. Status: ${status}`);
        }

        // Step 3: Publish container
        const publishResponse = await axios.post(
            `https://graph.instagram.com/v21.0/${user.instagramUserId}/media_publish`,
            null,
            {
                params: {
                    creation_id: containerId,
                    access_token: user.instagramAccessToken,
                },
            }
        );

        return {
            success: true,
            mediaId: publishResponse.data.id,
        };
    } catch (error: any) {
        console.error('Error publishing to Instagram:', error.response?.data || error);
        throw error;
    }
}

export async function refreshInstagramToken(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user?.instagramAccessToken) {
        throw new Error('No Instagram token to refresh');
    }

    try {
        const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
            params: {
                grant_type: 'ig_refresh_token',
                access_token: user.instagramAccessToken,
            },
        });

        const { access_token: newToken } = response.data;

        await prisma.user.update({
            where: { id: userId },
            data: { instagramAccessToken: newToken },
        });

        return newToken;
    } catch (error) {
        console.error('Error refreshing Instagram token:', error);
        throw error;
    }
}
