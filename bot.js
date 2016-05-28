var token = "Your telegram bot token here";

var request = require("request");
var cheerio = require("cheerio");
var util = require("util");
var TelegramBot = require('node-telegram-bot-api');
var bot = new TelegramBot(token, {polling: true});

bot.getMe().then(function (bot) {
  console.log("%s is now online!", bot.username);
});

var serverList = util.format("[1 = 横須賀]", "[2 = 呉]", "[3 = 佐世保]", "[4 = 舞鶴]", "[5 = 大湊]", "[6 = トラック]",
                              "[7 = リンガ]", "[8 = ラバウル]", "[9 = ショートランド]","[10 = ブイン]", "[11 = タウイタウイ]",
                              "[12 = パラオ]", "[13 = ブルネイ]", "[14 = 単冠湾]", "[15 = 幌筵]", "[16 = 宿毛湾]", "[17 = 鹿屋]",
                              "[18 = 岩川]", "[19 = 佐伯湾]", "[20 = 柱島]");

bot.onText(/\/echo (.+)/, function (msg, match) {
  var chatID = msg.from.id;
  var resp = match[1];
  bot.sendMessage(chatID, resp);
});

bot.onText(/\/500/, function(msg){
  var chatID = msg.chat.id;
  var username = msg.from.username;
  var opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: JSON.stringify({
      force_reply: true,
      selective: true
    }
  )};
  bot.sendMessage(chatID, "@" + username + "\nWhich server do you want to check?\n"+serverList, opts).then(function (sended){
    var messageID = sended.message_id;
    bot.onReplyToMessage(chatID, messageID, function(message){
      if (message.text.match(/^[1-9]$|^[1][0-9]$|^20$/)){
        bot.sendChatAction(chatID, "typing");
        var server = message.text
        check500(server, function(result){
          result = JSON.parse(result);
          var position = result.position;
          var lv = result.lv;
          var name = result.name;
          var rank = result.rank;
          var senka = result.senka;
          var readableString = util.format("順位 - ", position.trim(), "\n", "Lv. - ", lv, "\n", "提督名 - ", name, "\n", "階級 - ", rank, "\n", "戦果 - ", senka.trim());
          bot.sendMessage(chatID, readableString);
        });
      }else{
        bot.sendMessage(chatID, "Opps! Wrong input.");
      }
    });
  });
});

bot.onText(/\/server_top10/, function(msg){
  var chatID = msg.chat.id;
  var username = msg.from.username;
  var opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: JSON.stringify({
      force_reply: true,
      selective: true
    }
  )};
  bot.sendMessage(chatID, "@" + username + "\nWhich server do you want to check?\n"+serverList, opts).then(function (sended){
    var messageID = sended.message_id;
    bot.onReplyToMessage(chatID, messageID, function(message){
      if (message.text.match(/^[1-9]$|^[1][0-9]$|^20$/)){
        bot.sendChatAction(chatID, "typing");
        var server = message.text
        checkServerTop10(server, function(result){
          result = JSON.parse(result);
          var readableString = util.format("順位 - ", "Lv. - ", "提督名 - ", "階級 - ", "戦果", "\n");
          for(var i in result){
          var position = result[i].position;
          var lv = result[i].lv;
          var name = result[i].name;
          var rank = result[i].rank;
          var senka = result[i].senka;
          readableString += util.format(position, " - ", lv, " - ", name, " - ", rank, " - ", senka, "\n");
          }
          bot.sendMessage(chatID, readableString);
        });
      }else{
        bot.sendMessage(chatID, "Opps! Wrong input.");
      }
    });
  });
});

bot.onText(/\/all_servers_top10/, function(msg){
  var chatID = msg.chat.id;
  bot.sendChatAction(msg.chat.id, "typing");
  checkAllServersTop10(function(result){
    result = JSON.parse(result);
    var readableString = util.format("順位 - ", "サーバ - ", "提督名 - ", "コメント - ", "戦果", "\n", "================================", "\n");
    for(var i in result){
      var position = result[i].position;
      var server = result[i].server;
      var name = result[i].name;
      var comment = result[i].comment;
      var senka = result[i].senka;
      readableString += util.format(position," - ",server," - ", name," - ", comment," - ", senka, "\n");
    }
    bot.sendMessage(chatID, readableString);
  });
});

bot.onText(/\/help/, function(msg){
  var aboutMe = util.format("Hello there! You can use me to check 'Senka' from https:\/\/www.senka.me\n",
  "- use /500 to check 500線 of your server\n", "- use /server_top10 to check the top 10 player from specific server\n",
  "- use /all_servers_top10 to check the top 10 player from all servers\n", "- use /help to check what can I do for you\n",
  "- user /echo to make me speak whatever you want");
  bot.sendMessage(msg.chat.id,aboutMe);
});

//check 500 line
function check500(server, result){
  request("https://www.senka.me/server/" + server + "/ranking?page=3", function(error, response, body) {
    if (!error && response.statusCode == 200){
      var $ = cheerio.load(body);
      var teitoku = $("a#rank500").children();
      var position = $(teitoku).eq(0).text();
      var lv = $(teitoku).eq(2).text();
      var name = $(teitoku).eq(3).text();
      var rank = $(teitoku).eq(4).text();
      var senka = $(teitoku).eq(6).text();
      var metadata = {
        position: position,
        lv: lv,
        name: name,
        rank: rank,
        senka: senka
      }
      result(JSON.stringify(metadata));
    }else{
      console.log("Error: "+error);
    }
  });
}

//check top 10 player in specific server
function checkServerTop10(server, result){
  request("https://www.senka.me/server/" + server + "/ranking?page=1", function(error, response, body) {
    if (!error && response.statusCode == 200){
        var list = [];
        var $ = cheerio.load(body);
        $("a.tr").each(function(i, element){
          if (i>9){return}
          var teitoku = $(this).children();
          var position = $(teitoku).eq(0).text();
          var lv = $(teitoku).eq(2).text();
          var name = $(teitoku).eq(3).text();
          var rank = $(teitoku).eq(4).text();
          var senka = $(teitoku).eq(6).text();
          var metadata = {
            position: position,
            lv: lv,
            name: name,
            rank: rank,
            senka: senka
          }
          list.push(metadata);
        });
      result(JSON.stringify(list));
    }else{
      console.log("Error: "+error);
    }
  });
}

//check top 10 player from all servers
function checkAllServersTop10(result){
  request("https://www.senka.me", function(error, response, body){
    if (!error && response.statusCode == 200){
      var $ = cheerio.load(body);
      var list = [];
      $("div.table").first().children("a.tr").each(function(i, element){
        var teitoku = $(this).children();
        var position = $(teitoku).eq(0).text();
        var server = $(teitoku).eq(1).text();
        var name = $(teitoku).eq(2).text();
        var comment = $(teitoku).eq(3).text();
        var senka = $(teitoku).eq(4).text();
        var metadata = {
          position: position,
          server: server,
          name: name,
          comment: comment,
          senka: senka
        }
        list.push(metadata);
      });
      result(JSON.stringify(list));
    }else{
      console.log("Error: "+error);
    }
  });
}

/***** command list
500 - check 500線 of your server
server_top10 - check the top 10 player from specific server
all_servers_top10 - check the top 10 player from all servers
help - check what can I do for you
echo - make me speak whatever you want
******/
