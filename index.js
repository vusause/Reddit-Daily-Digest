'use strict';

// Import packages
var Snoocore = require('snoocore');
var postmark = require("postmark");
var async = require('async');
var hn = require('hack-news');


// profiles emulate noSQL db using hash properties of JS objects
// objects inserted should be of format {email: string, subreddits: array of strings, posts: integer, sort: string, hackernews: bool}
var profiles = {};
// this would be an insertion into db
profiles['1'] = {email: "mikevu123@gmail.com", subreddits: ["leagueoflegends", "uwaterloo", "nba"], posts: 3, sort: "hot", hackernews: true};
profiles['2'] = {email: "vusause@hotmail.com", subreddits: ["anime", "TheRedPill"], posts: 5, sort: "new", hackernews: false};

// Admin Email Client
var client = new postmark.Client("");

// Authentication for reddit API
var reddit = new Snoocore({
  userAgent: '',
  oauth: { 
    type: '',
    key: '', 
    secret: '',
    username: '',
    password: '',
    // make sure to set all the scopes you need
    scope: [ 'read' ]
  }
});

// used for basic mailer
var message = "<ul>";

// when called sends an email to with a list of posts and URls
function mailer(to, posts) {
    posts.forEach(function(post) {
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
        "To": to,
        "Subject": "Daily Digest", 
        "HtmlBody": message,
        "TextBody": "Uh, oh something went wrong with this message!"
    });
            
    message = "<ul>";
}

// not working mailer using postmarks templates
function mailerTemplate(to, posts) {
    
    var attach = [];
    
    posts.forEach(function(post) {
        attach.push({
            'url': post.url,
            'title': post.title,
            'attachment_size': "blank",
            'attachment_type': "blank"
        });
    });
    
    console.log(attach);
    
    client.sendEmailWithTemplate({
        "From": "mdhvu@uwaterloo.ca",
        "To": to,
        "TemplateId": ,
        "TemplateModel": {
        "body": "Daily Digest",
        "attachment_details": attach,
        "commenter_name": "Mike's Daily Digest",
        "timestamp": "timestamp_Value",
        "action_url": "action_url_Value",
        "notifications_url": "notifications_url_Value"
    }
});
}

// Called when want to get stories from hacker news also invokes mailer internally
function addStories(ids, store, end, to) {
    
    var temp = store;
    
    async.each(ids, function(id, callback) {
        hn.storyWithId(id).then(story => {
            temp.push({
                title: story.title,
                url: story.url,
            });
            callback();
        });
    }, function (err) {
        if (err) {
            console.log("Uh, oh an error occurred");
        }
        mailer(to, temp);
        console.log("reaches here");
        end();
    })
}

// gets subrreddit posts from profile and mails to user
function getSubPosts(prof, callback) {
    
    var temp = [];
    
    async.each(prof.subreddits, function(sub, callback) {
        reddit("/r/" + sub + "/" + prof.sort).listing({limit: prof.posts}).then(function(slice) {
            slice.children.forEach(function(child) {
                temp.push({
                    title: child.data.title,
                    url: child.data.url,
                });
            });
            callback();
        });
    }, function (err) {
        if (err) {
            console.log("Uh, oh an error occurred");
        } else {
            if (prof.hackernews) {
                hn.numberOfNewStories(prof.posts).then(stories => {
                    addStories(stories, temp, callback, prof.email);
                });
            } else {
                mailer(prof.email, temp);
                callback();
            }
        }
    });
}

// Handler
exports.handler = (event, context, callback) => {

  async.each(profiles, getSubPosts, function (err) {
      
      if (err) {
          console.log("Uh, oh an error occurred");
      } 
    }
  );

  callback(null, { message: 'Digest Ran!', event });
};
