//post function
var insertView = require('../../database/viewInsertion');

//config
var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-1'});
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

var queueURL = 'https://sqs.us-west-1.amazonaws.com/608151570921/viewQ';

var params = {
  AttributeNames: [
    'SentTimestamp'
  ],
  MaxNumberOfMessages: 1,
  MessageAttributeNames: [
    'All'
  ],
  QueueUrl: queueURL,
  VisibilityTimeout: 0,
  WaitTimeSeconds: 1
};

var receiveMessageLoop = function() {

  sqs.receiveMessage(params, function (err, data) {
    if (err) {
      setTimeout(receiveMessage, 1);
    } else if (data.Messages) {
      console.log('message is: ', data.Messages[0]);
      insertView(data.Messages[0].MessageAttributes.ViewId.StringValue, data.Messages[0].MessageAttributes.HostId.StringValue)
        .then(function() {
          var deleteParams = {
            QueueUrl: queueURL,
            ReceiptHandle: data.Messages[0].ReceiptHandle
          };
          sqs.deleteMessage(deleteParams, function (err, data) {
            if (err) {
              console.log('Delete Error', err);
            } else {
              console.log('Message Deleted', data);
              receiveMessage();
            }
          });
        })
        .catch(function() {
          console.log('error in receivemessage');
        }
        );
    }
  });
};

module.exports = receiveMessageLoop;