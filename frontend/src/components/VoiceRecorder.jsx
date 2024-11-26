import React, { useState, useRef } from 'react';
import axios from 'axios';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    setError('');
    setTranscription('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone.');
      console.error(err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        try {
          const response = await axios.post('http://localhost:4000/api/record', {
            audioData: base64Audio,
          });
          setTranscription(response.data.transcription);
        } catch (err) {
          setError('Failed to transcribe audio.');
          console.error(err);
        }
      };
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Audio Recorder & Transcription
        </h1>
        <div className="flex flex-col items-center space-y-4">
          {isRecording && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-red-500 animate-pulse"></div>
              <p className="text-sm font-semibold text-red-500">
                Recording in progress...
              </p>
            </div>
          )}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="bg-red-600 text-white py-2 px-4 rounded-lg shadow hover:bg-red-700"
            >
              Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700"
            >
              Start Recording
            </button>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {transcription && (
            <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full">
              <h3 className="text-lg font-bold text-gray-700">Transcription:</h3>
              <p className="text-gray-600 mt-2">{transcription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;



