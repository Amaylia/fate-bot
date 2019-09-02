/**
 * Created by jhelmuth on 8/7/16.
 */

var amqp = require('amqplib');
var config = require('./config');
var conn_url = config('amqp').url;

function passInterrupt() {
    process.kill(process.pid, 'SIGINT');
}

const rabbit = {
    enabled: false,
    connection: null,
    getConnection: function() {
        return rabbit.connection.then(function (conn) { return conn.createChannel(); });
    }
};

if (conn_url) {
    rabbit.enabled = true;
    rabbit.connection = amqp.connect(conn_url)
        .then(function (conn) {
            process.once('SIGINT', function () {
                conn.close().then(passInterrupt, passInterrupt);
            });
            return conn;
        });
}


module.exports = rabbit;
