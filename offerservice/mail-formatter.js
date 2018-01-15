'use strict';

//
// Required modules and top-level constants
//

// Built-in modules
const mFs = require('fs');
const mPath = require('path');

// External modules
const mEscapeHtml = require('escape-html');
const mYaml = require('js-yaml');

// Constants.
const __mailAssetsDir = mPath.resolve(__dirname, 'mail-assets');
const __localizedTexts = mYaml.safeLoad(mFs.readFileSync(mPath.resolve(__mailAssetsDir, 'mail-texts.yml')));

const __confirmationHtml = mFs.readFileSync(mPath.resolve(__mailAssetsDir, 'req-confirm_tmpl.html'), 'utf8')
const __confirmationTxt = mFs.readFileSync(mPath.resolve(__mailAssetsDir, 'req-confirm_tmpl.txt'), 'utf8')
const __requestHtml = mFs.readFileSync(mPath.resolve(__mailAssetsDir, 'offer-request_tmpl.html'), 'utf8');

//
// Formatter functions
//

/**
 * Replaces the key with the given value in the template.
 * 
 * @param {string} template the template
 * @param {string} key the key to replace, enclosed in the text by @ symbols
 * @param {string} value the value to put in place of the key
 * @param {boolean} isHtml true to perform html escaping, false to insert the value as is
 */
function instantiate(template, key, value, isHtml) {
	return template.replace(`@${key}@`, isHtml ? mEscapeHtml(value) : value);
}

module.exports = {
	/**
	 * Creates the confirmation email body.
	 * 
	 * @param {object} offerRequest the offer request object
	 * @param {boolean} isHtml true if HTML formatting should be used, false to use plain-text
	 * @return {string} the created email body
	 */
	createConfirmationEmailBody: function (offerRequest, isHtml) {
		// Get the template.
		const template = isHtml ? __confirmationHtml : __confirmationTxt;

		// Get the appropriate localized texts.
		const texts = __localizedTexts[offerRequest.language];

		// Fill in the template with static texts first.
		let emailBody = template;
		emailBody = instantiate(emailBody, 'title', texts.subject, isHtml);
		emailBody = instantiate(emailBody, 'addressText', texts.addressText, isHtml);
		emailBody = instantiate(emailBody, 'mainText1', texts.mainText1, isHtml);
		emailBody = instantiate(emailBody, 'mainText2', texts.mainText2, isHtml);
		emailBody = instantiate(emailBody, 'farewellText', texts.farewellText, isHtml);

		// Add the selected software kinds.
		let softwareKinds;
		const software = offerRequest.software;
		if (isHtml) {
			softwareKinds = '<ul>';

			if (software.mobile) softwareKinds += instantiate('<li>@text@</li>', 'text', texts.mobile, true);
			if (software.web) softwareKinds += instantiate('<li>@text@</li>', 'text', texts.web, true);
			if (software.database) softwareKinds += instantiate('<li>@text@</li>', 'text', texts.database, true);
			if (software.other) softwareKinds += instantiate('<li>@text@</li>', 'text', `${texts.other}: ${software.other}`, true);

			softwareKinds += '</ul>';
		} else {
			softwareKinds = '';

			if (software.mobile) softwareKinds += `\t- ${texts.mobile}\n`;
			if (software.web) softwareKinds += `\t- ${texts.web}\n`;
			if (software.database) softwareKinds += `\t- ${texts.database}\n`;
			if (software.other) softwareKinds += `\t- ${texts.other}: ${software.other}\n`;
		}

		emailBody = instantiate(emailBody, 'softwareKinds', softwareKinds, false);

		// Return results.
		return emailBody;
	},

	/**
	 * Creates the email body for the offer request itself.
	 * 
	 * @param {object} offerRequest the offer request object
	 * @return {string} the HTML email body
	 */
	createRequestEmailBody: function (offerRequest) {
		// Initialize the body.
		let emailBody = __requestHtml;

		// Add the header fields.
		emailBody = instantiate(emailBody, 'dateReceived', `${new Date()}`);
		emailBody = instantiate(emailBody, 'emailAddress', offerRequest.emailAddress);

		// Add the selected software kinds.
		const software = offerRequest.software;
		emailBody = instantiate(emailBody, 'mobile', software.mobile ? 'checked' : '');
		emailBody = instantiate(emailBody, 'web', software.web ? 'checked' : '');
		emailBody = instantiate(emailBody, 'database', software.database ? 'checked' : '');
		emailBody = instantiate(emailBody, 'other', software.other);

		// Add if reverse engineering is selected.
		emailBody = instantiate(emailBody, 'reverseEngineering', offerRequest.reverseEngineering ? 'checked' : '');

		// Return the body.
		return emailBody;
	},

	/**
	 * Returns the email subject for the given request.
	 * 
	 * @param {object} offerRequest the offer request object
	 * @return {string} the email subject
	 */
	getSubject: function (offerRequest) {
		return __localizedTexts[offerRequest.language].subject;
	},

	/**
	 * Location of the company logo image.
	 */
	companyLogoLocation: mPath.resolve(__mailAssetsDir, 'company-logo.png')
}