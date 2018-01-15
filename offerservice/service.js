#!/usr/bin/env node

'use strict';

//
// Required modules and top-level constants
//

// Internal modules
const mHttp = require('http');

// External modules
const mExpress = require('express');
const mBodyParser = require('body-parser');
const mCors = require('cors');
const mNodemailer = require('nodemailer');

// Constants
const _supportedLanguages = ['hu', 'en'];
const _requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_ADDRESS'];

//
// The service
//

// Validate the environment.
let invalidEnv = false;
_requiredVars.forEach((requiredVar) => {
	if (!process.env[requiredVar]) {
		console.error(`The '${requiredVar}' environment variable needs to be set.`)
		invalidEnv = true;
	}
});
if (invalidEnv) process.exit(1);

// Get the port number.
const rawPort = process.argv[2];
if (!rawPort) {
	console.error('Specify the port number as the first argument.');
	process.exit(1);
}

const port = parseInt(rawPort);
if (!port || port < 0 || port > 65535) {
	console.error(`Invalid port number specified: ${rawPort}`);
	process.exit(1);
}

// Set up the mailer.
const transporter = mNodemailer.createTransport({
	pool: true,
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS
	}
});

// Start the server up and prepare it for JSON payloads.
const app = mExpress();
app.use(mBodyParser.json());
app.use(mCors());
app.use(function(err, req, res) {
	console.error(`Unhandled error: ${err.message}`);
	res.status(500).send();
});

// Listen for the service endpoint on the root.
const fromAddress = process.env.FROM_ADDRESS;
app.options('/', mCors());
app.post('/', mCors(), (req, res) => {
	// Parse the body.
	const offerRequest = req.body;
	res.set('Content-Type', 'text/plain');

	// Validate the payload.
	if (!offerRequest ||
		_supportedLanguages.indexOf(offerRequest.language) < 0 ||
		typeof offerRequest.emailAddress !== 'string' ||
		typeof offerRequest.reverseEngineering !== 'boolean' ||
		typeof offerRequest.software !== 'object' ||
		typeof offerRequest.software.mobile !== 'boolean' ||
		typeof offerRequest.software.web !== 'boolean' ||
		typeof offerRequest.software.database !== 'boolean' ||
		(typeof offerRequest.software.other !== 'string' && typeof offerRequest.software.other !== 'boolean')) {
		console.warn('Malformed request received.');
		res.status(400).send();
		return;
	}

	console.log(`Received request: ${req.body}`);

	// Send the email.
	transporter.sendMail({
		from: fromAddress,
		to: offerRequest.emailAddress,
		subject: 'Offer Request',
		html: '<b>Hello world?</b>'
	}, (error) => {
		// Send the response.
		if (!error) {
			res.status(200).send('ok');
		} else {
			console.error(error);
			res.status(500).send('fail');
		}
	});
});

// Prepare the server.
const server = mHttp.createServer(app);
server.on('error', (e) => {
	if (e.code === 'EADDRINUSE') {
		console.error(`Unable to start server on port ${port}. Stopping.`);
		process.exit(2);
	} else {
		console.error(`Stopping due to unexpected error occured when starting server: ${e.message}`);
		process.exit(255);
	}
});

// Listen for connections.
try {
	app.listen(port);
} catch (e) {
	console.error(`Error occured when attempting to listen on port ${port}: ${e.message}`);
	process.exit(255);
}
console.log(`Listening on port ${port}.`);