const https   = require('https');
const path    = require('path');
const request = require('request');
const Discord = require('discord.js');
const express = require('express');
const app     = express();
const aws     = require('aws-sdk');
const bot     = new Discord.Client();
const bucket  = new aws.S3({params: {Bucket: 'cena-bot'}});

const DEFAULT_HELLO = 'media/hello.ogg';
const DEFAULT_BYE   = 'media/bye.mp3';
const JOHN_KEYWORD  = 'john!';

const playFileInChannel = (vch, key, v = 0.5) => {
  if (!vch) {
    console.log(`error="voiceChannel is null"`);
    return;
  }

  bot.joinVoiceChannel(vch, (err, voiceConnection) => {
    if (err) {
      console.log(`error="${err}"`);
    }
    let url = bucket.getSignedUrl('getObject', {Key: key});
    console.log(`action=play_song channel="${voiceConnection.server.name}" key="${key} url="${url}"`);
    voiceConnection.playRawStream(request(url), {volume: v}, (error, streamIntent) => {
      if (error) {
        console.log(`error=${error}`);
        return;
      }

      streamIntent.on('error', (error) => {
        console.log(`error=${error}`);
      });

      streamIntent.on('end', () => {
        bot.leaveVoiceChannel(vch);
      });
    });
  });
};

const resetThemeSong = (msg) => {
  let key = `songs/${msg.author.id}`;
  console.log(`action=reset_song key=${key}`);
  bucket.deleteObject({Key: key}, (err) => {
    if (err) {
      console.log(`error=${err}`);
      return;
    }
  });
};

const uploadThemeSong = (msg) => {
  let url = msg.attachments[0].url;
  let ext = url.substring(url.lastIndexOf('.') + 1);

  if (!['mp3', 'wav', 'ogg'].includes(ext.toLowerCase())) {
    bot.reply(msg, `I can't play ${ext} files, bro!`);
    return;
  }

  console.log(`action=upload_song user="${msg.author.username}" url="${msg.attachments[0].url}"`);
  https.get(msg.attachments[0].url, (data) => {
    let key = `songs/${msg.author.id}`;

    bucket.upload({Body: data, Key: key}, (err) => {
      if (err) {
        console.log(`error=${err}`);
        return;
      }

      bot.reply(msg, `Damn, that's a fine theme song!`);
      playFileInChannel(msg.author.voiceChannel, key);
    });
  });
};

const hasTrigger = (msg) => {
  return msg.content.match(/john/gi);
}

bot.on('ready', () => {
  console.log(`action=login user=${bot.user.username}#${bot.user.id}`);
  bot.setPlayingGame(`WWE SMACKDOWN RAW 2016`);
});

bot.on('voiceJoin', (vch, user) => {
  if (!vch) {
    return;
  }
  if (user.username === bot.user.username) {
    return;
  }
  if (vch.users.has('id', bot.user.id)) {
    return;
  }

  console.log(`action=join_channel user=${user.username}`);

  let key = `songs/${user.id}`;
  bucket.headObject({Key: key}, (err, data) => {
    console.log(`action=fetch_song key=${key} exists=${!err}`);
    if (err) {
      playFileInChannel(vch, DEFAULT_HELLO);
    } else {
      playFileInChannel(vch, key);
    }
  });
});

bot.on('voiceLeave', (vch, user) => {
  if (!vch) {
    return;
  }
  if (user.username === bot.user.username) {
    return;
  }
  if (typeof bot.voiceConnection !== 'undefined' && bot.voiceConnection.playing) {
    console.log(`action=bail reason="bot is already playing something. I should add it to a queue instead."`)
    return;
  }

  console.log(`action=leave_channel user=${user.username}`);
  playFileInChannel(vch, DEFAULT_BYE);
});

bot.on('message', (msg) => {
  if (msg.attachments.length > 0 && msg.content.match(/(theme\ssong)|song|theme/gi)) {
    uploadThemeSong(msg);
    bot.reply(msg, `Damn straight! My theme song is way better!`);
    return;
  }

  if (!hasTrigger(msg)) {
    return;
  }

  if (msg.content.match(/(?=.*reset)(?=.*song)/gi)) {
    resetThemeSong(msg);
    bot.reply(msg, `Damn straight! My theme song is way better!`);
  } else {
    bot.reply(msg, 'WHAT??!');
  }
});

bot.on('error', (err) => {
  console.log(`fatal_error=${err}`);
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
