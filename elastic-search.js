const AWS = require('aws-sdk');
const QUEUE_URL='https://sqs.us-east-1.amazonaws.com/889429743747/myQueue';
const yelp = require('yelp-fusion');

function receiveMessages(callback) {
    var sqs = new AWS.SQS({region : 'us-east-1'});
    var text=" ";
    var params = {
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 1,
        MessageAttributeNames:['Location','Cuision','NumberOfPeople','Date','Time','Phone']
    };
    sqs.receiveMessage(params, function(err, data) {
        if (err) {
            console.error(err, err.stack);
        } else if (data.Messages!=null){
            var attributes=data.Messages[0].MessageAttributes;
            var city=attributes.Location.StringValue;
            var cuision=attributes.Cuision.StringValue;
            var number=attributes.NumberOfPeople.StringValue;
            var time=attributes.Date.StringValue+' '+attributes.Time.StringValue;
            var timestamp=Date.parse(new Date(time))/1000;
            var phone=attributes.Phone.StringValue;
            text=text+`Hello!These are my ${cuision} restaurants suggestions for ${number} people at ${time}:\n`;
            const apiKey = '9vtYsnrnuloHZebPKWQBWE1aN9Mtx-oulkFfW3FzWmpq1MmIQa1mvoZC7ooXMAcL3waDvcCxmNXFVQTW0ek0FjYr46n8kQN2K3QK5kzAX2kuJ_dvj2ALoag66Lm1WnYx';
            const searchRequest = {
                limit:3,
                term:'restaurants,food,'+cuision,
                location:city,
                category:'Restaurant',
                open_at:timestamp
            };
            const client = yelp.client(apiKey);

            client.search(searchRequest).then(response => {
                var num=response.jsonBody.total;
                var result;
                text=text+'1. '+response.jsonBody.businesses[0].name+',location at: '+response.jsonBody.businesses[0].location.address1+' ';
                if (response.jsonBody.businesses[0].location.address2!=null) text=text+response.jsonBody.businesses[0].location.address2+' ';
                text=text+',category is:'+response.jsonBody.businesses[0].categories[0].title +',price:'+response.jsonBody.businesses[0].price+'\n';
                text=text+'2. '+response.jsonBody.businesses[1].name+',location at: '+response.jsonBody.businesses[1].location.address1+' ';
                if (response.jsonBody.businesses[1].location.address2!=null) text=text+response.jsonBody.businesses[1].location.address2+' ';
                text=text+',category is:'+response.jsonBody.businesses[1].categories[0].title +',price:'+response.jsonBody.businesses[1].price+'\n';
                text=text+'3. '+response.jsonBody.businesses[2].name+',location at: '+response.jsonBody.businesses[2].location.address1+' ';
                if (response.jsonBody.businesses[2].location.address2!=null) text=text+response.jsonBody.businesses[2].location.address2+' ';
                text=text+',category is:'+response.jsonBody.businesses[2].categories[0].title +',price:'+response.jsonBody.businesses[2].price;
                text=text+"\nEnjor your meal!"
                sendTextMessage(text,phone);
            }).catch(e => {
                console.log(e);
            });
            var deleteParams = {
                QueueUrl:  QUEUE_URL,
                ReceiptHandle: data.Messages[0].ReceiptHandle
            };
            sqs.deleteMessage(deleteParams, function(err, data) {
                if (err) {
                    console.log("Delete Error", err);
                } else {
                    console.log("Message Deleted", data);
                }
            });

            callback(null,"succeed");
            
        }
    });
}

function sendTextMessage(text,phone){
    var sns = new AWS.SNS();
    const params = {
        PhoneNumber: '+1 '+phone,
        Message: text
    };
    sns.publish(params, function(err, data){

        if (err) console.log(err, err.stack);
        else console.log('sent a message to ' + params.PhoneNumber.toString() );

    });

}

exports.handler = (event, context, callback) => {
    // TODO implement
    receiveMessages(callback);
    
};