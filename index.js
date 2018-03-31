var util = require('util')
var http = require('http')
var AWS = require("aws-sdk")
var lexruntime = new AWS.LexRuntime()



exports.handler = (event, context, callback) => {
    // TODO implement
    // console.log(util.inspect(event, false, null))
    // console.log(util.inspect(context, false, null))
    // var params = {
//   botAlias: 'STRING_VALUE', /* required */
//   botName: 'DiningBot', /* required */
//   inputText: 'STRING_VALUE', /* required */
//   userId: 'STRING_VALUE', /* required */
//   requestAttributes: {
//     '<String>': 'STRING_VALUE',
//     /* '<String>': ... */
//   },
//   sessionAttributes: {
//     '<String>': 'STRING_VALUE',
//     /* '<String>': ... */
//   }
// };
// lexruntime.postText(params, function(err, data) {
//   if (err) console.log(err, err.stack); // an error occurred
//   else     console.log(data);           // successful response
// });
    
    var msg = event["messages"][0]["unstructured"]["text"]
    var reply = ""
    if(msg=="Hello") {
      reply = "Hi, how can I help you?"
    }
    else if (msg=="Where should I travel?") {
      reply ="Go to hell!!"
    }
    else if(msg=="Thank you") {
      reply = "You are welcome!"
    }
    else {
      reply = "Sorry, I cannot help you with that."
    }
    var response =    {
                          "messages": [
                            {
                              "type": "string",
                              "unstructured": {
                                "id": "bot",
                                "text": reply,
                                "timestamp": new Date()
                              }
                            }
                          ]
                        }
    callback(null, response);
};