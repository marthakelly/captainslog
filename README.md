# Captain's Log

## record the audio memo (attempt 1)
* iOS, get Google Drive app from the app store
* create a new folder in Google Drive
* use 'Voice Memos' app on iOS
* save the memo
* then click the 'share' icon and copy it to Drive

## SETUP
* Get a Twilio number
* Create a new project in the GCP Console https://console.cloud.google.com/
* Activate free trial to get $300
* Enable Google Cloud Functions API
* Enable Cloud Speech API
* Enable Cloud Natural Language API
* Create a Cloud Storage bucket https://cloud.google.com/storage/docs/quickstart-console (captainslogstorage)
* Install Google Cloud SDK https://cloud.google.com/sdk/
* set up account
*  set up project name, login, set project ID
* Install beta components (?)
* gcloud components install beta
* Once you have a phone number, click Manage Numbers and then click on your phone number.
* Manage numbers: https://www.twilio.com/console/phone-numbers/incoming
* Click 'Voice'
* Under Voice:
* Set Configure with to Webhooks/TwiML.
* Set A Call Comes In to Webhook and enter the following URL:
* https://us-central1-[YOUR_PROJECT_ID].cloudfunctions.net/handleCall
* Replace [YOUR_PROJECT_ID] with your Google Cloud Platform project ID.
* Click Save.
* return to Twilio account settings https://www.twilio.com/console/account/settings
* and take note of the Auth Token for your Live Credentials. You will need it later in this tutorial
* npm init
* npm install --save twilio got @google-cloud/speech @google-cloud/language @google-cloud/storage
* Create a file named config.json with the following contents: 
* {
*   "RESULTS_BUCKET": "[RESULTS_BUCKET]",
*   "TWILIO_AUTH_TOKEN": "[YOUR_TWILIO_AUTH_TOKEN]"
* }
* gcloud beta functions deploy handleCall --trigger-http --stage-bucket=captainslogstorage
* deploy handleCall
* gcloud beta functions deploy handleCall --trigger-http --stage-bucket=[YOUR_STAGE_BUCKET]
* deploy getRecording
* gcloud beta functions deploy getRecording --trigger-http --stage-bucket=[YOUR_STAGE_BUCKET]
* deploy analyzeRecording
* gcloud beta functions deploy analyzeRecording --trigger-bucket=[RESULTS_BUCKET] --stage-bucket=[YOUR_STAGE_BUCKET] --timeout=240


# TODO
* upgrade twilio
* custom message when twilio picks up!
