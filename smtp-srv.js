const SMTPServer = require("smtp-server").SMTPServer;
const simpleParser = require('mailparser').simpleParser;

const server = new SMTPServer({
  authOptional: true,
  onData(stream, session, callback) {
    //stream.pipe(process.stdout); // print message to console
    //console.log(stream);
    //console.log(session);
    simpleParser(stream, {})
    .then(parsed => console.log(parsed))
    .catch(err => console.log(err));
    stream.on("end", callback);
  }
});
server.listen(25);