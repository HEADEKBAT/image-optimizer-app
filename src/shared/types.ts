export interface ImageFile {
    originalPath: string;
    optimizedPath: string;
    format: 'webp' | 'jpeg' | 'png';
    size: number; // size in bytes
}

export interface OptimizationResult {
    success: boolean;
    message: string;
    files: ImageFile[];
}

export interface PathUpdate {
    oldPath: string;
    newPath: string;
}