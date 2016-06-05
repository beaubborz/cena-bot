var Discord = require('discord.js');
var https = require('https');
var fs = require('fs');
var express = require('express');
var app = express();
var bot = new Discord.Client();
var TSPath = './theme_songs/';
var media = 'media/hello.ogg';
var mediaBye = 'media/bye.mp3';

var voiceChannel;

bot.on("ready", function() {
  console.log(`Logged in as: ${bot.user.username} - (${bot.user.id})`);
	bot.setPlayingGame('WWE SMACKDOWN RAW 2016');

  voiceChannel = bot.channels.find(function(ch){
    return ch.type == 'voice' && ch.name == 'General';
  });
  console.log(`Found voice channel: ${voiceChannel.name}`);
});

bot.on("voiceJoin", function(vch, User){
  if(vch == null) return;
  if(User.username == bot.user.username) return;

  console.log(`${User.username} joined!!`);
  var user_theme_song = fs.readdirSync(TSPath).find(function(filename){
    return filename.includes(User.id);
  });
  if(user_theme_song)
    PlayFileInChannel(`${TSPath}${user_theme_song}`);
  else
    PlayFileInChannel(media, 0.2);
});


bot.on("voiceLeave", function(vch, User){
  if(!vch) return;
  if(User.username == bot.user.username) return;

  console.log(`${User.username} joined!!`);
  PlayFileInChannel(mediaBye);

});


bot.on('message', function(msg) {
   if(msg.content.toUpperCase() != 'THEME SONG' ||
      !msg.attachments)
      return;
   var url = msg.attachments[0].url;
   var ext = url.substring(url.lastIndexOf('.') + 1);
   if(!['mp3', 'wav', 'ogg'].includes(ext.toLowerCase()))
   {
      bot.reply(msg, `I can't play ${ext} files, bro!`);
      return;
   }
   console.log(`Theme song request from ${msg.author.username} for ${msg.attachments[0].url}`);

   https.get(msg.attachments[0].url, function(data) {
      var fileToSave = `${TSPath}${msg.author.id}.${ext}`;
      var file = fs.createWriteStream(fileToSave);
      data.pipe(file);
    file.on('finish', function() {
      file.close();
      bot.reply(msg, 'Damn, that\'s a fine theme song!');
      PlayFileInChannel(fileToSave);
    });
   });
});

bot.on("error", function(err){
	console.log(`FATAL ERROR!: ${err}`);
});

app.use('/', express.static(__dirname + '/public'));

const server_port = process.env.PORT || 4000;
app.listen(server_port, function () {
  console.log(`cena-bot-web running on ${server_port}`);
  bot.loginWithToken(
    process.env.DISCORD_CLIENT_SECRET
  );
});

var PlayFileInChannel = function(filepath, v = 1.0) {
  if(!voiceChannel)
  {
    console.log("Error! voiceChannel is null.");
    return;
  }
  console.log(filepath);
  bot.joinVoiceChannel(voiceChannel, function(err, voiceConnection) {
    if(err) console.log(`Errors: ${err}`);
    console.log(`Joined channel ${voiceConnection.server.name}`);
    voiceConnection.playFile(filepath, { volume: v}, function (error, streamIntent) {
      streamIntent.on('error', function (error) {
        console.log(`error: ${error}`);
      });

      streamIntent.on('end', function () {
        bot.leaveVoiceChannel(voiceChannel);
      });
    });
  });
}
