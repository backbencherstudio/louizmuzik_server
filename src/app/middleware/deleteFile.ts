import  fs  from 'fs';
import  path  from 'path';

export const deleteFile = async (filePath: string) => {
    try {
        if (!filePath) {
            console.error('Error: File path is undefined or null.');
            return false;
        }
        const normalizedPath = path.normalize(filePath);
        if (fs.existsSync(normalizedPath)) {
            fs.unlinkSync(normalizedPath);
            return true;
        } else {
            console.warn(`File not found: ${normalizedPath}`);
            return false;
        }
    } catch (error) {
        console.error(`Error deleting file: ${error}`);
        return false;
    }
};
