# Sportwatch_app
Welcome to sportwatch, a track meet management and data analytics mobile app

<h1>Building</h1>

This will be a short guide to building sportwatch on a new machine based on [this guide](https://cordova.apache.org/docs/en/latest/guide/cli/)

There is also no need to create a new project, as the config file is already present in this github.

First, [install npm](https://www.npmjs.com/get-npm)

then run install cordova

`npm install -g cordova`

clone the repository

```
git clone https://github.com/LawnmowerDave/Sportwatch_app
cd Sportwatch_app
```

NOTE: master is in the wrong directory, please clone navigator_rework using this command. <br>
`git clone --branch <branchname> <remote-repo>`

Add the platform of your choice, or both <br>
`cordova platform add android` <br>
`cordova platform add ios`

This should be installed automatically, but if not, run this command. <br>
`cordova plugin add cordova-sqlite-storage`

This command must be run before every deploy at least on android. This will take the changes from the www folder to the rest
of your platforms.<br>
`cordova prepare <platform> // ios or android`

For either android studio, go to the newly created android folder under platforms/ and import the project into android studio.
You should be able to build and deploy to a device of your choice. Either click on the grade file or android studio should just recognize it.

For XCode, do the exact same thing but with the XCodeproj file. Look for ios under platforms/ and import the project. 
To be honest, I'm not sure about the ios stuff, it's all wizard stuff to me, just follow [this guide](https://cordova.apache.org/docs/en/2.5.0/guide/getting-started/ios/)
