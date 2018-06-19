import config from './config.json'; /* #TODO copy config-example.json, name it config.json and add your Google Storage bucket name and Twilio auth token inside the file */
import twilio from 'twilio';
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const projectId = process.env.GCLOUD_PROJECT;
const region = 'us-central1';
export const pathname = 'handleCall';

export function isValidRequest (req, res, pathname) {
  let isValid = true;

  // validate that the request was sent by Twilio
  if (process.env.NODE_ENV === 'production') {
    isValid = twilio.validateExpressRequest(req, config.TWILIO_AUTH_TOKEN, {
      url: `https://${region}-${projectId}.cloudfunctions.net/${pathname}`
    });
  }

  // Halt early if the request was not sent from Twilio
  if (!isValid) {
    res
      .type('text/plain')
      .status(403)
      .send('Twilio Request Validation Failed.')
      .end();
  }

  return isValid;
}

export function handleCall (req, res) {
  if (!isValidRequest(req, res, pathname)) {
    return;
  }

  const recordingStatusCallbackUrl = `https://${region}-${projectId}.cloudfunctions.net/getRecording`;

  // Prepare a response to the voice call
  const response = new VoiceResponse();

  // Prompt the user to leave a message
  response.say('Hello from Cloud Functions. Please leave a message after the beep.');

  console.log('Recording message.');

  // Record the user's message
  response.record({
    // Limit the recording to 60 seconds
    maxLength: 60,
    // Give Twilio the deployed url of the other function for when the recorded
    // audio is available
    recordingStatusCallback: eecordingStatusCallbackUrl
  });

  // End the call
  response.hangup();

  // Send the response
  res
    .status(200)
    .type('text/xml')
    .send(response.toString())
    .end();
};

export function getRecording (req, res) {
  if (!isValidRequest(req, res, 'getRecording')) {
    return;
  }

  const got = require('got');
  const path = require('path');
  const storage = require('@google-cloud/storage')();

  const filename = `recordings/${path.parse(req.body.RecordingUrl).name}/audio.wav`;
  const file = storage
    .bucket(config.RESULTS_BUCKET)
    .file(filename);

  console.log(`Saving recording to: ${filename}`);

  got.stream(req.body.RecordingUrl)
    .pipe(file.createWriteStream({
      metadata: {
        contentType: 'audio/x-wav'
      }
    }))
    .on('error', (err) => {
      console.error(err);
      res
        .status(500)
        .send(err)
        .end();
    })
    .on('finish', () => {
      res
        .status(200)
        .end();
    });
};

export function analyzeRecording (event) {
  const object = event.data;

  if (object.resourceState === 'not_exists') {
    // Ignore file deletions
    return true;
  } else if (!/^recordings\/\S+\/audio\.wav$/.test(object.name)) {
    // Ignore changes to non-audio files
    return true;
  }

  console.log(`Analyzing gs://${object.bucket}/${object.name}`);

  // Import the Google Cloud client libraries
  const gl = require('@google-cloud/language');
  const nl = new gl.LanguageServiceClient();
  const gs = require('@google-cloud/speech');
  const speech = new gs.SpeechClient();
  const storage = require('@google-cloud/storage')();

  const bucket = storage.bucket(object.bucket);
  const dir = require('path').parse(object.name).dir;

  // Configure audio settings for Twilio voice recordings
  const audioConfig = {
    sampleRateHertz: 8000,
    encoding: 'LINEAR16',
    languageCode: 'en-US'
  };

  const audio = {
    // content: bucket.file(object.name)
    uri: `gs://${object.bucket}/${object.name}`
  };

  const request = {
    audio,
    config: audioConfig
  };

  // Transcribe the audio file
  return speech.recognize(request)
    // Perform Sentiment, Entity, and Syntax analysis on the transcription
    .then(data => {
      const results = data[0]
            .results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

      console.log(`Results: ${results}`);

      return nl.annotateText({
        document: {
          type: 1,
          content: results
        },
        features: {
          extractSyntax: true,
          extractEntities: true,
          extractDocumentSentiment: true,
          extractEntitySentiment: true,
          classifyText: true
        }
      })
    })
    // Finally, save the analysis
    .then(data => {
      const filename = `analyses/analysis+${Date.now()}.json`;
      console.log(`Saving gs://${object.bucket}/${filename}`);

      return bucket
        .file(filename)
        .save(JSON.stringify(data[0], null, 2));
    });
};
