var Discord = require('discord.js');
var fs = require('fs');
var http = require("http");
var express = require('express');
var app = express();
var bot = new Discord.Client();
var media = "media/hello.ogg";
var mediaBye = "media/bye.mp3";

bot.on("ready", function() {
  console.log("Logged in as: " + bot.user.username + " - (" + bot.user.id + ")");
	bot.setPlayingGame("WWE SMACKDOWN RAW 2016");
});

bot.on("voiceJoin", function(vch, User){
  if(vch == null) return;
  if(User.username == bot.user.username) return;

  console.log(User.username + ' joined!!');

  bot.joinVoiceChannel(vch, function(err, voiceConnection){
    console.log("Errors: " + err);
    console.log("Joined channel" + voiceConnection.server.name);
    voiceConnection.playFile(media, { volume: 0.1 }, function (error, streamIntent) {
      streamIntent.on("error", function (error) {
        console.log("error " + error);
      });

      streamIntent.on("end", function () {
        bot.leaveVoiceChannel(vch);
      });
    });
  });
});


bot.on("voiceLeave", function(vch, User){
  if(vch == null) return;
  if(User.username == bot.user.username) return;

  console.log(User.username + ' joined!!');

  bot.joinVoiceChannel(vch, function(err, voiceConnection){
    console.log("Errors: " + err);
    console.log("Joined channel" + voiceConnection.server.name);
    voiceConnection.playFile(mediaBye, { volume: 1 }, function (error, streamIntent) {
      streamIntent.on("error", function (error) {
        console.log("error " + error);
      });

      streamIntent.on("end", function () {
        bot.leaveVoiceChannel(vch);
      });
    });
  });
});

bot.on("error", function(err){
	console.log("FATAL ERROR!: " + err);
});

app.use('/', express.static(__dirname + '/public'));

const server_port = process.env.PORT || 4000;
app.listen(server_port, function () {
  console.log(`cena-bot-web running on ${server_port}`);
  bot.loginWithToken(
    process.env.DISCORD_CLIENT_SECRET
  );
});
