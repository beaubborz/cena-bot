#!/bin/env node

var Discord = require('discord.js');
var bot = new Discord.Client();
var voiceChannel = null;
var media = 'C:\\Users\\gab\\Documents\\My Projects\\dischordwwe\\media\\john_cena.ogg';


bot.on("ready", function(event) {
    console.log("Logged in as: " + bot.user.username + " - (" + bot.user.id + ")");
	bot.setPlayingGame("WWE SMACKDOWN RAW 2016", function(error){
	});

	voiceChannel = bot.channels.find(function(ch){
		return (ch.type == 'voice');
	});
    console.log("Found channel: " + voiceChannel.name);
});

bot.on("voiceJoin", function(VoiceChannel, User){
	if(VoiceChannel == null || User.username == "JOHN CENA")
		return;
	
	console.log(User.username + ' joined!!');
	
	bot.joinVoiceChannel(VoiceChannel, function(err, voice){
		console.log("Joined voice channel " + voiceChannel.name);
		voice.playFile(media,{volume:1},function(err){
			console.log("Playing file " + media + " on channel "+voice.server.name);
			console.log(err);
			});
	});
	
});

if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", function () {
  //graceful shutdown
  console.log('Logging out...');
  bot.logout();
  process.exit();
});

bot.login("discordwwe@gmail.com", "discordwwe2016");