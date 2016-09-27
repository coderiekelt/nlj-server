var http = require('http');
var fs = require('fs');
var ws = require('ws').Server, socket = new ws({port: 5201});

var version = '0.0.1';
var port = 5102;
var contPort = 5201;

var lastReset = null;
var currentPos = 0;

var videoFiles = [
    {
        file: 'test.mp4',
        duration: (4*60) + 36
    },
    {
        file: 'test1.mp4',
        duration: (20*60) + 56
    }
];

socket.broadcast = function broadcast(data) {
    socket.clients.forEach(function each(client) {
        client.send(data);
    });
};

console.log('NLJ Server version ' + version + ' starting on port ' + port + ' - ' + contPort);

var videoFile = 'test.mp4';

var metaData = {
    duration: videoFiles[0].duration,
    progress: 0
};

function createServer() {
    return http.createServer(function(request, response) {
        response.writeHead(200, {'Content-Type': 'video/mp4'});
        var rs = fs.createReadStream(videoFile);
        rs.pipe(response);
    });
}

function closeServer() {
    server.close();
}

function resetMetaData() {
    return { duration: videoFiles[0].duration, progress: 0};
}

function startTimer() {
    setTimeout(function() {
        var abort = false;

        if (metaData.progress >= metaData.duration) {
            metaData = resetMetaData();
            closeServer();

            currentPos++;

            if (currentPos === videoFiles.length) {
                currentPos = 0;
            }

            videoFile = videoFiles[currentPos].file;
            metaData.duration = videoFiles[currentPos].duration;
            metaData.progress = 0;

            server = createServer();
            server.listen(port);

            socket.broadcast('reset');

            console.log('NLJ: New episode started (' + videoFile + ')');

            startTimer();
            return;
        }

        metaData.progress++;
        startTimer();
    }, 1000);
}

startTimer();

var server = createServer();
server.listen(port);

socket.on('connection', function connection(ws) {
    ws.send('p' + metaData.progress);
    socket.broadcast('w' + socket.clients.length);
});

