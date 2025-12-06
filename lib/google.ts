import { google } from 'googleapis';
import { prisma } from './prisma';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export async function getDriveClient(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user?.googleRefreshToken) {
        throw new Error('User not connected to Google Drive');
    }

    oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken,
        access_token: user.googleAccessToken || undefined,
    });

    // Refresh token if needed (simplified)
    // In a real app, you'd check expiry and refresh, then save new tokens.

    return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function listDriveFolders(userId: string) {
    try {
        const drive = await getDriveClient(userId);
        const response = await drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name)',
            pageSize: 50,
        });
        return response.data.files || [];
    } catch (error) {
        console.error('Error listing drive folders:', error);
        return [];
    }
}

export async function listVideoFiles(userId: string, folderId?: string) {
    try {
        const drive = await getDriveClient(userId);
        let query = "mimeType contains 'video/' and trashed = false";
        if (folderId) {
            query += ` and '${folderId}' in parents`;
        }

        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, size, thumbnailLink, webContentLink)',
            pageSize: 20,
        });
        return response.data.files || [];
    } catch (error) {
        console.error('Error listing drive files:', error);
        // Return mock data if no connection or error, for dev purposes
        return [
            { id: '1', name: 'demo_video_1.mp4', mimeType: 'video/mp4', size: '1024000' },
            { id: '2', name: 'demo_video_2.mp4', mimeType: 'video/mp4', size: '2048000' },
        ];
    }
}

export async function downloadVideoFile(userId: string, fileId: string): Promise<Buffer> {
    try {
        const drive = await getDriveClient(userId);

        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
        );

        return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
        console.error('Error downloading video:', error);
        throw error;
    }
}

export async function getPublicVideoUrl(userId: string, fileId: string): Promise<string> {
    try {
        const drive = await getDriveClient(userId);

        // Make file publicly accessible temporarily
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Get the web content link
        const file = await drive.files.get({
            fileId,
            fields: 'webContentLink',
        });

        return file.data.webContentLink || '';
    } catch (error) {
        console.error('Error getting public URL:', error);
        throw error;
    }
}
