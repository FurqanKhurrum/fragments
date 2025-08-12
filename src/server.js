// src/server.js

const logger = require('./logger');
const stoppable = require('stoppable');
const app = require('./app');

// get port number. default to 3000
const port = parseInt(process.env.PORT || '3000', 10);

// start the server, and wrap it with stoppable to gracefully shutdown our server
const server = stoppable(
  app.listen(port, () => {
    // log a message that server has started on the set port
    logger.info({ port }, 'Server Started');
  })
);

// export our server instance to be accessed by other parts of the code if necessary
module.exports = server;
