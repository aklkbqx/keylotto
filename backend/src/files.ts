import { Elysia } from 'elysia';
import { join, extname, normalize, resolve } from 'path';
import { existsSync, statSync } from 'fs';

// MIME type mapping สำหรับไฟล์ต่างๆ
const mimeTypes: Record<string, string> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Text & Code
    '.txt': 'text/plain; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    
    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    
    // Video
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    
    // Fonts
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
};

// Cache control settings based on file type
const cacheSettings: Record<string, string> = {
    // Images - cache for 7 days
    '.jpg': 'public, max-age=604800, immutable',
    '.jpeg': 'public, max-age=604800, immutable',
    '.png': 'public, max-age=604800, immutable',
    '.gif': 'public, max-age=604800, immutable',
    '.webp': 'public, max-age=604800, immutable',
    '.svg': 'public, max-age=604800, immutable',
    '.ico': 'public, max-age=2592000, immutable', // 30 days for favicon
    
    // Static assets - cache for 7 days
    '.css': 'public, max-age=604800, immutable',
    '.js': 'public, max-age=604800, immutable',
    '.woff': 'public, max-age=2592000, immutable', // 30 days for fonts
    '.woff2': 'public, max-age=2592000, immutable',
    '.ttf': 'public, max-age=2592000, immutable',
    '.otf': 'public, max-age=2592000, immutable',
    
    // Documents - cache for 1 hour
    '.pdf': 'public, max-age=3600',
    '.doc': 'public, max-age=3600',
    '.docx': 'public, max-age=3600',
    
    // HTML files - no cache for dynamic content
    '.html': 'no-cache, no-store, must-revalidate',
    '.htm': 'no-cache, no-store, must-revalidate',
    
    // Default - cache for 1 hour
    'default': 'public, max-age=3600'
};

// Security: blocked file extensions
const blockedExtensions = new Set([
    '.env', '.key', '.pem', '.crt', '.p12', '.pfx',
    '.exe', '.bat', '.cmd', '.sh', '.ps1',
    '.php', '.asp', '.aspx', '.jsp'
]);

// Get MIME type for file extension
function getMimeType(ext: string): string {
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// Get cache control header for file extension
function getCacheControl(ext: string): string {
    return cacheSettings[ext.toLowerCase()] || cacheSettings.default;
}

// Validate and normalize file path to prevent directory traversal
function validateFilePath(requestedPath: string): { isValid: boolean; normalizedPath: string; fullPath: string } {
    try {
        // Remove leading slash and normalize
        const cleanPath = requestedPath.replace(/^\/+/, '');
        const normalizedPath = normalize(cleanPath);
        
        // Prevent directory traversal
        if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
            return { isValid: false, normalizedPath: '', fullPath: '' };
        }
        
        // Build full path
        const publicDir = resolve('./public');
        const fullPath = resolve(publicDir, normalizedPath);
        
        // Ensure the resolved path is still within public directory
        if (!fullPath.startsWith(publicDir)) {
            return { isValid: false, normalizedPath: '', fullPath: '' };
        }
        
        // Check if file extension is blocked
        const ext = extname(normalizedPath);
        if (blockedExtensions.has(ext.toLowerCase())) {
            return { isValid: false, normalizedPath: '', fullPath: '' };
        }
        
        return { isValid: true, normalizedPath, fullPath };
        
    } catch (error) {
        return { isValid: false, normalizedPath: '', fullPath: '' };
    }
}

// File serving with compression support
async function serveFile(filePath: string, headers: Record<string, string> = {}): Promise<Response> {
    try {
        const file = Bun.file(filePath);
        const stats = statSync(filePath);
        const ext = extname(filePath);
        
        // Set headers
        const responseHeaders: Record<string, string> = {
            'Content-Type': getMimeType(ext),
            'Cache-Control': getCacheControl(ext),
            'Last-Modified': stats.mtime.toUTCString(),
            'Content-Length': stats.size.toString(),
            'Accept-Ranges': 'bytes',
            'X-Content-Type-Options': 'nosniff',
            ...headers
        };
        
        // Add ETag for better caching
        const etag = `"${stats.mtime.getTime()}-${stats.size}"`;
        responseHeaders['ETag'] = etag;
        
        return new Response(file, {
            headers: responseHeaders
        });
        
    } catch (error) {
        console.error('Error serving file:', error);
        throw error;
    }
}

const app = new Elysia({
    prefix: "/public"
})
    // Serve all files from public directory
    .get('/*', async ({ params, set, headers }) => {
        try {
            // Get the requested path from wildcard
            const requestedPath = (params as any)['*'] || '';
            
            // Validate file path
            const { isValid, fullPath, normalizedPath } = validateFilePath(requestedPath);
            
            if (!isValid) {
                set.status = 403;
                return {
                    success: false,
                    message: 'Access denied: Invalid file path'
                };
            }
            
            // Check if file exists
            if (!existsSync(fullPath)) {
                set.status = 404;
                return {
                    success: false,
                    message: 'File not found'
                };
            }
            
            // Check if it's a file (not directory)
            const stats = statSync(fullPath);
            if (!stats.isFile()) {
                set.status = 403;
                return {
                    success: false,
                    message: 'Directory listing not allowed'
                };
            }
            
            // Check conditional requests for better caching
            const etag = `"${stats.mtime.getTime()}-${stats.size}"`;
            const ifNoneMatch = headers['if-none-match'];
            const ifModifiedSince = headers['if-modified-since'];
            
            if (ifNoneMatch === etag) {
                set.status = 304;
                return new Response(null, {
                    headers: {
                        'ETag': etag,
                        'Cache-Control': getCacheControl(extname(fullPath))
                    }
                });
            }
            
            if (ifModifiedSince) {
                const clientDate = new Date(ifModifiedSince);
                const fileDate = new Date(stats.mtime);
                fileDate.setMilliseconds(0); // Remove milliseconds for comparison
                
                if (fileDate <= clientDate) {
                    set.status = 304;
                    return new Response(null, {
                        headers: {
                            'Last-Modified': stats.mtime.toUTCString(),
                            'Cache-Control': getCacheControl(extname(fullPath))
                        }
                    });
                }
            }
            
            // Serve the file
            const response = await serveFile(fullPath);
            return response;
            
        } catch (error) {
            console.error('File serving error:', error);
            set.status = 500;
            return {
                success: false,
                message: 'Internal server error'
            };
        }
    })
    
    // Health check endpoint for file service
    .get('/health', () => {
        return {
            success: true,
            message: 'File service is running',
            timestamp: new Date().toISOString(),
            publicDir: resolve('./public')
        };
    })
    
    // List directory contents (for development only)
    .get('/list/*', async ({ params, set }) => {
        if (process.env.NODE_ENV === 'production') {
            set.status = 403;
            return {
                success: false,
                message: 'Directory listing disabled in production'
            };
        }
        
        try {
            const requestedPath = (params as any)['*'] || '';
            const { isValid, fullPath } = validateFilePath(requestedPath);
            
            if (!isValid) {
                set.status = 403;
                return {
                    success: false,
                    message: 'Access denied: Invalid path'
                };
            }
            
            if (!existsSync(fullPath)) {
                set.status = 404;
                return {
                    success: false,
                    message: 'Directory not found'
                };
            }
            
            const stats = statSync(fullPath);
            if (!stats.isDirectory()) {
                set.status = 400;
                return {
                    success: false,
                    message: 'Path is not a directory'
                };
            }
            
            const fs = require('fs');
            const files = fs.readdirSync(fullPath);
            const fileList = files.map((file: string) => {
                const filePath = join(fullPath, file);
                const fileStats = statSync(filePath);
                return {
                    name: file,
                    type: fileStats.isDirectory() ? 'directory' : 'file',
                    size: fileStats.size,
                    modified: fileStats.mtime.toISOString(),
                    url: `/public${requestedPath ? '/' + requestedPath : ''}/${file}`
                };
            });
            
            return {
                success: true,
                path: requestedPath || '/',
                files: fileList
            };
            
        } catch (error) {
            console.error('Directory listing error:', error);
            set.status = 500;
            return {
                success: false,
                message: 'Internal server error'
            };
        }
    });

export default app;