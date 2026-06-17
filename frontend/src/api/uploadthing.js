import { generateUploadButton, generateUploadDropzone, generateReactHelpers  } from '@uploadthing/react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const UPLOAD_URL = `${BACKEND_URL}/api/uploadthing`;
export const UploadButton = generateUploadButton({ url: UPLOAD_URL });
export const UploadDropzone = generateUploadDropzone({ url: UPLOAD_URL });
export const { useUploadThing } = generateReactHelpers({ url: UPLOAD_URL });