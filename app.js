const express = require('express');
const ytdl = require('node-ytdl-core');
const archiver = require('archiver');
const fs = require('fs');
const PORT = process.env.PORT || 3000;
const app = express();
const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/download', async (req, res) => {
  const { youtubeLink } = req.query;

  if (!youtubeLink) {
    return res.status(400).send('Missing YouTube link');
  }

  try {
    const video = ytdl(youtubeLink, { quality: 'highest' });
    const output = fs.createWriteStream('video.mp4');

    video.pipe(output);

    output.on('finish', () => {
      const archive = archiver('zip');
      const zipOutput = fs.createWriteStream('video.zip');

      archive.pipe(zipOutput);
      archive.file('video.mp4', { name: 'video.mp4' });
      archive.finalize();

      zipOutput.on('close', () => {
        res.download('video.zip', 'video.zip', (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error generating zip file');
          }
          fs.unlinkSync('video.mp4');
          fs.unlinkSync('video.zip');
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
