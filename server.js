var Discord = require('discord.js');
var bot = new Discord.Client();
var media = "media/john_cena.ogg";
var mediaBye = "media/bye.mp3";
var credentials = require('./credentials.json');

bot.on("ready", function() {
    console.log("Logged in as: " + bot.user.username + " - (" + bot.user.id + ")");
	bot.setPlayingGame("WWE SMACKDOWN RAW 2016");
});

bot.on("voiceJoin", function(vch, User){
   if(vch == null || 
      User.username == bot.user.username ||  
      User.username == "AIRHORN SOLUTIONS")
      return;
      
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
   if(vch == null || 
      User.username == "JOHN CENA" ||  
      User.username == "AIRHORN SOLUTIONS")
      return;
      
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


process.on("SIGINT", function () {
  //graceful shutdown
  bot.logout(function(err){
	console.log('Logging out...' + err);
	process.exit();
  });
  
});

bot.login(credentials.email, credentials.password);