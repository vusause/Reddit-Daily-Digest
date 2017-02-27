'use strict';

// Import packages
var Snoocore = require('snoocore');
var postmark = require("postmark");
// get this package before running
var async = require('async');


// profiles emulate noSQL db using hash properties of JS objects
// objects inserted should be of format {email: string, subreddits: array of strings, length: integer}
var profiles = {};
// this would be an insertion into db
profiles[1] = {email: "mikevu123@gmail.com", subreddits: ["leagueoflegends", "uwaterloo", "nba"], length: 3};
profiles[2] = {email: "vusause@hotmail.com", subreddits: ["anime", "redpill"], length: 5};

// Admin Email Client
var client = new postmark.Client("");

// Authentication for reddit API
var reddit = new Snoocore({
  userAgent: 'testing',
  oauth: { 
    type: 'script',
    key: '', 
    secret: '',
    username: 'DankSeeEssMemer',
    password: '',
    // make sure to set all the scopes you need
    scope: [ 'read' ]
  }
});

var subreddits = [];

var message = "<ul>";

subreddits.push("leagueoflegends");
subreddits.push("uwaterloo");


// reddit data used here temporarily
// Similar to profiles should emulate noSQL db
var redditData = [];

function getSubPosts(sub, callback) {
    
    reddit("/r/" + sub + "/hot").listing({limit: 3}).then(function(slice) {
        slice.children.forEach(function(child) {
            redditData.push({
                title: child.data.title,
                url: child.data.url,
            });
        });
        console.log(redditData);
        callback();
    });
}

exports.handler = (event, context, callback) => {

  async.each(profiles, getSubPosts, function (err) {
      
      if (err) {
          console.log("Uh, oh an error occurred");
      } else {
      
      redditData.forEach(function(post) {
        message += "<li><a href='";
        message += post.url;
        message += "'>";
        message += post.title;
        message += "</a></li>";
      });
        
        message += "</ul>";
  
        console.log(message);

        client.sendEmail({
            "From": "mdhvu@uwaterloo.ca",
            "To": "mikevu123@gmail.com",
            "Subject": "Daily Digest", 
            "HtmlBody": message,
            "TextBody": "Uh, oh something went wrong with this message!"
        });
      }
    }
  );

  callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};