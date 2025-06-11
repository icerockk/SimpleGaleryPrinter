const express = require('express');
const path = require('path');
const fs = require('fs');
const moment = require('moment'); // Import moment.js for date formatting

const app = express();
const PORT = 3000;

// Network path to the CaptureResult folder
const NETWORK_PATH = path.join('C:', 'Put', 'your', 'directory', 'here'); // Double backslashes for UNC paths
/* change directory depend on the location of your galery */

// Serve images directly from the network path
app.use('/images', express.static(NETWORK_PATH));

// Endpoint to get paginated image data with sorted dates
app.get('/api/images', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;

    // Read the network directory
    fs.readdir(NETWORK_PATH, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read images directory. Check the network path and permissions.' });
        }

        // Filter image files and sort by modification date (latest first)
        const imageFiles = files
            .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .map(file => {
                const fullPath = path.join(NETWORK_PATH, file);
                const stats = fs.statSync(fullPath);
                return { file, mtime: stats.mtime };
            })
            .sort((a, b) => b.mtime - a.mtime); // Sort by descending modification time

        // Paginate
        const totalImages = imageFiles.length;
        const totalPages = Math.ceil(totalImages / pageSize);
        const startIndex = (page - 1) * pageSize;
        const paginatedImages = imageFiles.slice(startIndex, startIndex + pageSize);
            

        // Create response
        const imageData = paginatedImages.map(({ file, mtime }) => ({
            url: `/images/${file}`,
            date: moment(mtime).format('YYYY-MM-DD HH:mm:ss'), // Format the date and time
        }));

        res.json({
            images: imageData,
            page,
            totalPages,
            totalImages,
        });
    });
});

// Serve the main index.html file for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

