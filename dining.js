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


// ---------------- Helper Functions --------------------------------------------------

function parseLocalDate(date, hh, mm, ss) {
    /**
     * Construct a date object in the local timezone by parsing the input date string, assuming a YYYY-MM-DD format.
     * Note that the Date(dateString) constructor is explicitly avoided as it may implicitly assume a UTC timezone.
     */
    const dateComponents = date.split(/\-/);
    return new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2], hh, mm, ss);
}

function isValidDate(date) {
    try {
        return !(isNaN(parseLocalDate(date, 23, 59, 59).getTime()));
    } catch (err) {
        return false;
    }
}

function isValidCity(city) {
    const validCities = ['new york', 'los angeles', 'chicago', 'houston', 'philadelphia', 'phoenix', 'san antonio',
                    'san diego', 'dallas', 'san jose', 'austin', 'jacksonville', 'san francisco', 'indianapolis',
                    'columbus', 'fort worth', 'charlotte', 'detroit', 'el paso', 'seattle', 'denver', 'washington dc',
                    'memphis', 'boston', 'nashville', 'baltimore', 'portland']
    return validCities.indexOf(city.toLowerCase()) != -1
}

function isValidCuisine(cuisine) {
    const cuisineTypes = ['chinese', 'japanese', 'american', 'indian', 'italian', 'thai'];
    return cuisineTypes.indexOf(cuisine.toLowerCase()) != -1
}



function buildValidationResult(isValid, violatedSlot, messageContent) {
    if (messageContent == null) {
        return {
            isValid,
            violatedSlot,
        };
    }
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

function validateDining(city, cuisine, numberOfPeople, date, time, phone) {
    
    if(city) {
        if(!isValidCity(city)) {
            return buildValidationResult(false, 'city', `We currently do not support ${city}.  Can you try a different city?`);
        }
    }
    if (cuisine) {
        if(!isValidCuisine(cuisine)) {
            return buildValidationResult(false, 'cuisine', `We do not have ${cuisine} food, would you like to try a different cuisine?  Our most popular flowers are Chinese`);
        }
    }
    
    if (numberOfPeople) {
        if(numberOfPeople<=0) {
            return buildValidationResult(false, 'numberOfPeople', 'I did not understand that, how many people are in your party?');
        }
    }

    if (date) {
        if (!isValidDate(date)) {
            return buildValidationResult(false, 'date', 'I did not understand that, what date would you like to dine?');
        }
        if (parseLocalDate(date, 23,59,59) < new Date()) {
            return buildValidationResult(false, 'date', 'You can choose from today onwards.  What day would you like to dine?');
        }
    }
    if (time) {
        if (time.length !== 5) {
            // Not a valid time; use a prompt defined on the build-time model.
            return buildValidationResult(false, 'time', null);
        }
        const hour = parseInt(time.substring(0, 2), 10);
        const minute = parseInt(time.substring(3), 10);
        if (isNaN(hour) || isNaN(minute)) {
            // Not a valid time; use a prompt defined on the build-time model.
            return buildValidationResult(false, 'time', null);
        }
        if (hour < 9 || hour > 23) {
            // Outside of business hours
            return buildValidationResult(false, 'time', 'The business hours are from 9AM to 11PM. Can you specify a time during this range?');
        }
        if (parseLocalDate(date, hour, minute, 0) < new Date()) {
            return buildValidationResult(false, 'time', 'Can you specify a time later than current time?');
        }
    }
    
    if (phone) {
        if (phone.length!=10) {
            return buildValidationResult(false, 'phone', 'The phone number seems incorrect. Can you give me your phone number again?');
        } 
    }
    return buildValidationResult(true, null, null);
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
     
    if (source === 'DialogCodeHook') {
        // Perform basic validation on the supplied input slots.  Use the elicitSlot dialog action to re-prompt for the first violation detected.
        const slots = intentRequest.currentIntent.slots;
        const validationResult = validateDining(location, cuisine, numberOfPeople, date, time, phone);
        if (!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }
    
    sendMessageToSqs(location,cuisine,numberOfPeople,date,time,phone);
    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: 'You’re all set. Expect my recommendations shortly! Have a good day.' }));
}

function greeting(intentRequest, callback) {
    const source = intentRequest.invocationSource;

    if (source === 'DialogCodeHook') {
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }

    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: 'Hi there, how can I help?' }));
}

function thankyou(intentRequest, callback) {
    const source = intentRequest.invocationSource;

    if (source === 'DialogCodeHook') {
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }

    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: 'You are welcome!' }));
}

 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'GreetingIntent') {
        return greeting(intentRequest, callback);
    }
    else if (intentName === 'ThankYouIntent') {
        return thankyou(intentRequest, callback);
    }
    else if (intentName === 'DiningSuggestionsIntent') {
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
