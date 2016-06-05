const https = require('https');
const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const express = require('express');
const app = express();
const bot = new Discord.Client();


const THEME_SONGS_PATH = './theme_songs/';
const MEDIA = 'media/hello.ogg';
const MEDIA_BYE = 'media/bye.mp3';
const JOHN_KEYWORD = 'john!';

let voiceChannel;

const playFileInChannel = (filepath, v = 1.0) => {
  if (!voiceChannel) {
    console.log('Error! voiceChannel is null.');
    return;
  }

  console.log(filepath);
  bot.joinVoiceChannel(voiceChannel, (err, voiceConnection) => {
    if (err) {
      console.log(`Errors: ${err}`);
    }
    console.log(`Joined channel ${voiceConnection.server.name}`);
    voiceConnection.playFile(filepath, {volume: v}, (error, streamIntent) => {
      streamIntent.on('error', (error) => {
        console.log(`error: ${error}`);
      });

      streamIntent.on('end', () => {
        bot.leaveVoiceChannel(voiceChannel);
      });
    });
  });
};

const uploadThemeSong = (msg) => {
  if (msg.content.toUpperCase() !== 'THEME SONG' || !msg.attachments) {
    return;
  }

  let url = msg.attachments[0].url;
  let ext = url.substring(url.lastIndexOf('.') + 1);

  if (!['mp3', 'wav', 'ogg'].includes(ext.toLowerCase())) {
    bot.reply(msg, `I can't play ${ext} files, bro!`);
    return;
  }
  console.log(`Theme song request from ${msg.author.username} for ${msg.attachments[0].url}`);

  https.get(msg.attachments[0].url, (data) => {
    let fileToSave = `${THEME_SONGS_PATH}${msg.author.id}.${ext}`;
    let file = fs.createWriteStream(fileToSave);
    data.pipe(file);

    file.on('finish', () => {
      file.close();
      bot.reply(msg, 'Damn, that\'s a fine theme song!');
      playFileInChannel(fileToSave);
    });
  });
};

const resetThemeSong = (userId) => {
  fs.readdirSync(THEME_SONGS_PATH).forEach((filename) => {
    if (filename.includes(userId)) {
      fs.unlinkSync(THEME_SONGS_PATH + filename);
    }
  });
};

Array.prototype.intersects = function (arr) {
  return this.filter((n) => {
    return arr.indexOf(n) > -1;
  });
};

Array.prototype.containsAll = function (arr) {
  return this.intersects(arr).length === arr.length;
};

bot.on('ready', () => {
  console.log(`Logged in as: ${bot.user.username} - (${bot.user.id})`);
  bot.setPlayingGame('WWE SMACKDOWN RAW 2016');

  voiceChannel = bot.channels.find((ch) => {
    return ch.type === 'voice' && ch.name === 'General';
  });
  console.log(`Found voice channel: ${voiceChannel.name}`);
});

bot.on('voiceJoin', (vch, User) => {
  if (vch === null) {
    return;
  }
  if (User.username === bot.user.username) {
    return;
  }

  console.log(`${User.username} joined!!`);

  let userThemeSong = fs.readdirSync(THEME_SONGS_PATH).find((filename) => {
    return filename.includes(User.id);
  });

  if (userThemeSong) {
    playFileInChannel(`${THEME_SONGS_PATH}${userThemeSong}`);
  } else {
    playFileInChannel(MEDIA, 0.2);
  }
});

bot.on('voiceLeave', (vch, User) => {
  if (!vch) {
    return;
  }
  if (User.username === bot.user.username) {
    return;
  }

  console.log(`${User.username} joined!!`);
  playFileInChannel(MEDIA_BYE);
});

bot.on('message', (msg) => {
  if (msg.attachments.length) {
    uploadThemeSong(msg);
    return;
  }

  // Process commands.
  let trigger = msg.content.toLowerCase().substring(0, JOHN_KEYWORD.length);
  let args = msg.content.toLowerCase().substring(JOHN_KEYWORD.length + 1).split(/[\s,\\.!]+/g);
  if (trigger === JOHN_KEYWORD) {
    if (args.containsAll(['reset', 'song'])) {
      resetThemeSong(msg.author.id);
      bot.reply(msg, `Damn straight! My theme song is way better!`);
      playFileInChannel(MEDIA, 0.2);
    } else {
      bot.reply(msg, 'WHAT??!');
    }
  }
});

bot.on('error', (err) => {
  console.log(`FATAL ERROR!: ${err}`);
});

app.use('/', express.static(path.join(__dirname, '/public')));

app.get('/ping', (req, res) => {
  res.send({status: 'ok'});
});

const SERVER_PORT = process.env.PORT || 4000;
app.listen(SERVER_PORT, () => {
  console.log(`cena-bot-web running on ${SERVER_PORT}`);

  bot.loginWithToken(
    process.env.DISCORD_CLIENT_SECRET
  );
});
