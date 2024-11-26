const express = require('express');
const cors = require('cors');
const fs = require('fs');
const OpenAIApi = require('openai');
require('dotenv').config();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Adjust the limit as needed
app.use(express.urlencoded({ limit: '50mb', extended: true })); // For URL-encoded data


const openai = new OpenAIApi({apiKey: process.env.OPENAI_API_KEY});

// Route to handle audio recording upload and transcription
app.post('/api/record', async (req, res) => {
  try {
    const audioBuffer = Buffer.from(req.body.audioData, 'base64');
    const audioFilePath = `uploads/audio_${Date.now()}.mp3`;

    fs.writeFileSync(audioFilePath, audioBuffer);

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
      language: "de", // this is optional but helps the model
    });
  

    fs.unlinkSync(audioFilePath);

    res.status(200).json({ transcription: response.data.text });
  } catch (error) {
    console.error('Error during transcription:', error.response?.data || error.message);
    res.status(500).json({ error: 'Transcription failed', details: error.response?.data || error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});