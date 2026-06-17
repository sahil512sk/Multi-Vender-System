import { createUploadthing } from 'uploadthing/express';

const f = createUploadthing();

export const uploadRouter = {
    productImages: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
        .middleware(async ({ req }) => {
            const user = req.user;
            if (!user) throw new Error('Unauthorized');
            return { userId: user._id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log('Uploaded by userId:', metadata.userId);
            console.log('File URL:', file.ufsUrl);
            return { url: file.ufsUrl };
        }),
};