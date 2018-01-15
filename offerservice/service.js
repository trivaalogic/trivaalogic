#!/usr/bin/env node

'use strict';

//
// Required modules and top-level constants
//

// Built-in modules
const mHttp = require('http');

// External modules
const mExpress = require('express');
const mBodyParser = require('body-parser');
const mCors = require('cors');
const mNodemailer = require('nodemailer');

// Internal modules
const mMailFormatter = require('./mail-formatter.js');

// Constants
const __supportedLanguages = ['hu', 'en'];
const __requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_ADDRESS', 'REQUEST_TO_ADDRESS'];
const __corsOptions = {
	origin: ['http://trivaalogic.hu', 'http://trivaalogic.com'],
	optionsSuccessStatus: 200
};
const __fromAddress = process.env.FROM_ADDRESS;

if (process.env.NODE_ENV !== 'production') __corsOptions.origin.push('http://0.0.0.0:4100');

//
// The service
//

// Validate the environment.
let invalidEnv = false;
__requiredVars.forEach((requiredVar) => {
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
app.use(mCors(__corsOptions));
app.use(function (err, req, res, next) {
	console.error(`${new Date()} Unhandled error: ${err.message}`);
	res.status(500).send();
});

// Listen for the service endpoint on the root.
let __offerRequestCounter = 0;
app.options('/', mCors());
app.get('/', (req, res) => {
	res.status(200).send('ok');
});
app.post('/', mCors(), (req, res) => {
	const offerRequestCounter = ++__offerRequestCounter;
	console.log(`${new Date()} Received request #${offerRequestCounter} from ${req.ip}`);

	// Parse the body and set the response type immediately.
	const offerRequest = req.body;
	res.set('Content-Type', 'text/plain');

	// Validate the payload.
	if (!offerRequest ||
		__supportedLanguages.indexOf(offerRequest.language) < 0 ||
		typeof offerRequest.emailAddress !== 'string' ||
		typeof offerRequest.reverseEngineering !== 'boolean' ||
		typeof offerRequest.software !== 'object' ||
		typeof offerRequest.software.mobile !== 'boolean' ||
		typeof offerRequest.software.web !== 'boolean' ||
		typeof offerRequest.software.database !== 'boolean' ||
		(typeof offerRequest.software.other !== 'string' && typeof offerRequest.software.other !== 'boolean')) {
		console.warn(`${new Date()} Malformed request received.`);
		res.status(400).send();
		return;
	}

	// Send the offer request itself.
	transporter.sendMail({
		from: __fromAddress,
		to: process.env.REQUEST_TO_ADDRESS,
		subject: 'Ajánlatkérés',
		html: mMailFormatter.createRequestEmailBody(offerRequest)
	}, (error) => {
		if (!error) {
			console.log(`${new Date()} Successfully sent offer request #${offerRequestCounter} email.`);

			// Send the offer request confirmation email.
			transporter.sendMail({
				from: __fromAddress,
				to: offerRequest.emailAddress,
				subject: mMailFormatter.getSubject(offerRequest),
				html: mMailFormatter.createConfirmationEmailBody(offerRequest, true),
				text: mMailFormatter.createConfirmationEmailBody(offerRequest, false),
				attachments: [{
					filename: 'trivaalogic-logo.png',
					path: mMailFormatter.companyLogoLocation,
					cid: 'company-logo'
				}]
			}, (error) => {
				// Send the response.
				if (!error) {
					console.log(`${new Date()} Successfully sent offer request confirmation #${offerRequestCounter} email.`);
					res.status(200).send('ok');
				} else {
					console.error(`${new Date()} Error sending offer request confirmation #${offerRequestCounter}: ${error}`);
					res.status(500).send('fail');
				}
			});
		} else {
			// Send the error response.
			console.error(`${new Date()} Error sending offer request #${offerRequestCounter}: ${error}`);
			res.status(500).send('fail');
		}
	});
});

// Prepare the server.
console.log(`${new Date()} Starting server in ${process.env.NODE_ENV || 'development'} mode.`);
console.log(`${new Date()} Allowed CORS origins: ${__corsOptions.origin.join(', ')}`)
const server = mHttp.createServer(app);
server.on('error', (e) => {
	if (e.code === 'EADDRINUSE') {
		console.error(`${new Date()} Unable to start server on port ${port}. Stopping.`);
		process.exit(2);
	} else {
		console.error(`${new Date()} Stopping due to unexpected error occured when starting server: ${e.message}`);
		process.exit(255);
	}
});

// Listen for connections.
try {
	app.listen(port);
} catch (e) {
	console.error(`${new Date()} Error occured when attempting to listen on port ${port}: ${e.message}`);
	process.exit(255);
}
console.log(`${new Date()} Listening on port ${port}.`);