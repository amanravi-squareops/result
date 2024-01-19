var express = require('express'),
    async = require('async'),
    { Pool } = require('pg'),
    cookieParser = require('cookie-parser'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    path = require('path'),
    dotenv = require('dotenv');

dotenv.config();

var port = process.env.PORT || 5432;
var dbHost = 'postgresql-ha-postgresql.app.svc'; // Updated DB host (hardcoded)
var dbName = process.env.DB_NAME || 'postgres';
var dbUser = process.env.DB_USER || 'postgres';
var dbPassword = process.env.DB_PASSWORD || 'postgres';
var dbConnectionString = 'postgres://' + dbUser + ':' + dbPassword + '@' + dbHost + '/' + dbName; // Updated connection string (hardcoded)

io.on('connection', function (socket) {
  socket.emit('message', { text: 'Welcome!' });
  socket.on('subscribe', function (data) {
    socket.join(data.channel);
  });
});

var pool = new Pool({
  connectionString: dbConnectionString
});

// Connect to the database and create 'votes' table if not exists
pool.connect(function (err, client, done) {
  if (err) {
    console.error("Error connecting to db: " + err);
    return process.exit(1);
  }

  client.query(
    `CREATE TABLE IF NOT EXISTS votes (
       id SERIAL PRIMARY KEY,
       vote VARCHAR(255) NOT NULL
     );`,
    function (err, result) {
      done(); // Release the client back to the pool

      if (err) {
        console.error("Error creating 'votes' table: " + err);
        return process.exit(1);
      }

      console.log("Table 'votes' created or already exists.");

      // Continue with fetching votes
      getVotes();
    }
  );
});

function getVotes() {
  pool.query('SELECT vote, COUNT(id) AS count FROM votes GROUP BY vote', function (err, result) {
    if (err) {
      console.error("Error performing query: " + err);
    } else {
      var votes = collectVotesFromResult(result);
      io.sockets.emit("scores", JSON.stringify(votes));
    }

    setTimeout(getVotes, 1000);
  });
}

function collectVotesFromResult(result) {
  var votes = { a: 0, b: 0 };

  result.rows.forEach(function (row) {
    votes[row.vote] = parseInt(row.count);
  });

  return votes;
}

app.use(cookieParser());
app.use(express.urlencoded());
app.use(express.static(__dirname + '/views'));

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname + '/views/index.html'));
});

server.listen(port, function () {
  var port = server.address().port;
  console.log('App running on port ' + port);
});
