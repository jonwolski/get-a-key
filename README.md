# get-a-key
single page app to get a PPSK from HMNG service. This App can use AzureAD or ADFS (soon) to authenticate users.

## Install
This Reference APP is built over NodeJS. To use is, you will have to
* Install NodeJS LTS: https://nodejs.org/en/download/
* Clone this repo
* Configure the API paramerts, in the `/config.js` file. You will find an example in `/config_example`, and you will have to alreday have an account on the Aerohive Developper Portal https://developer.aerohive.com/
* install node modules (`npm install`from the project folder)
* install bower dependencies (`bower install`from the project folder)
* Start the APP with from `/bin/www`.

## Requirements
* This App is using mongoDB to store the configuration and customization. You will have to configure the mongoDB location in the `/config.js`file.
* This App has to be reachable through HTTPS to use OAuth (required to configure the App and to use AzureAD OAuth for users authentication). 

## What will come next
* ADFS integration
* Docker version