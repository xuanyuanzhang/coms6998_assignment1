var util = require('util')
var http = require('http')
var AWS = require("aws-sdk")
var lexruntime = new AWS.LexRuntime()
var myId = "myBot"

exports.handler = (event, context, callback) => {
    // TODO implement
    // console.log(util.inspect(event, false, null))
    // console.log(util.inspect(context, false, null))
    var msg = event["messages"][0]["unstructured"]["text"]
    // var msg = event.messages.unstructured.text
    var sessionAttributes = {}
    var res = {}
    const callLex = (res) => {
      return new Promise((resolve, reject) => {
        var params = {
          botAlias: '$LATEST', /* required */
          botName: 'DiningBot', /* required */
          inputText: msg, /* required */
          userId: myId, /* required */
          sessionAttributes: sessionAttributes
        };
        
        lexruntime.postText(params, function(err, data) {
          // console.log(data);
          if (err) {
            reject(err);
            // console.log(err, err.stack);
          }
          else {
            resolve(data); // successful response
            // console.log(data);
          }
        });
      });
    };
    
    callLex(res)
      .then((lexResponse) => {
        /* VALID RESPONSE */
        var response =    {
                          "messages": [
                            {
                              "type": "string",
                              "unstructured": {
                                "id": "bot",
                                "text": lexResponse.message,
                                "timestamp": new Date()
                                // "timestamp": "2016-01-01"
                              }
                            }
                          ]
                        }
        console.log(lexResponse.message)
        callback(null, response); // this is the Lambda callback
      })
      .catch((error) => {
        /* SOMETHING WENT WRONG */
        console.log(error)
        callback(error); // this is the Lambda callback
      });
    
};