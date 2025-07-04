// utils/multer.ts or similar

import multer from 'multer';

const storage = multer.memoryStorage(); // Store file in memory (buffer)
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single('profile_image'); // Accept only one file with this field name
