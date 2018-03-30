'use strict';
var AWS = require('aws-sdk');
 /**
  * This sample demonstrates an implementation of the Lex Code Hook Interface
  * in order to serve a sample bot which manages orders for flowers.
  * Bot, Intent, and Slot models which are compatible with this sample can be found in the Lex Console
  * as part of the 'OrderFlowers' template.
  *
  * For instructions on how to set up and test this bot, as well as additional samples,
  *  visit the Lex Getting Started documentation.
  */


 // --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}



function sendMessageToSqs(location,cuisine,numberOfPeople,date,time,phone){
    // Load the AWS SDK for Node.js
    var QUEUE_URL='https://sqs.us-east-1.amazonaws.com/889429743747/myQueue';
    // Set the region 

    // Create an SQS service object
    var sqs = new AWS.SQS({region : 'us-east-1'});
    var params = {
         DelaySeconds: 10,
         MessageAttributes: {
            "Location": {
                DataType: "String",
                StringValue: location
            },
            "Cuision": {
                DataType: "String",
                StringValue: cuisine
            },
            "NumberOfPeople": {
                DataType: "Number",
                StringValue: numberOfPeople
            },
            "Date": {
                DataType: "String",
                StringValue: date
            },
            "Time": {
                DataType: "String",
                StringValue: time
            },
            "Phone": {
                DataType: "String",
                StringValue: phone
            }
        },
        MessageBody: "Dining information.",
        QueueUrl: QUEUE_URL
    };

    sqs.sendMessage(params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.MessageId);
        }
    });
}
// --------------- Functions that control the bot's behavior -----------------------

/**
 * Performs dialog management and fulfillment for ordering flowers.
 *
 * Beyond fulfillment, the implementation of this intent demonstrates the use of the elicitSlot dialog action
 * in slot validation and re-prompting.
 *
 */
 
function diningSuggestions(intentRequest, callback) {
    const location = intentRequest.currentIntent.slots.city;
    const cuisine = intentRequest.currentIntent.slots.cuisine;
    const numberOfPeople = intentRequest.currentIntent.slots.numberOfPeople;
    const date = intentRequest.currentIntent.slots.date;
    const time = intentRequest.currentIntent.slots.time;
    const phone = intentRequest.currentIntent.slots.phone;
    const source = intentRequest.invocationSource;

    sendMessageToSqs(location,cuisine,numberOfPeople,date,time,phone);
    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: 'You’re all set! Expect my recommendations shortly! Have a good day.' }));
}

 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'DiningSuggestionsIntent') {
        return diningSuggestions(intentRequest, callback);
    }
    
    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired Lex bot or
         * bot version.
         */
        /*
        if (event.bot.name !== 'OrderFlowers') {
             callback('Invalid Bot Name');
        }
        */
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};
