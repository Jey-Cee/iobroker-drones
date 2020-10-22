const readline = require('readline');
const fs = require('fs');

/**
 * Checks a given state value, and returns the corrected value and the associated type
 * @param {string} state - for logging only
 * @param {*} value - state value to check
 * @return {object} - {val:<state value>, type:<type or null in case of errors>}
 */
function getStateValueType(state, value) {

    let valueType;
    if (value===undefined || value===null) {
        console.warn(`State value of '${state}' is undefined or null.`);
        valueType = null;
    } else if (['boolean','string','number'].indexOf(typeof value) !== -1) {
        valueType = typeof value;
    } else if (typeof value === 'object') {
        value = JSON.stringify(value);
        valueType = 'string';
    } else {
        console.warn(`Type '${typeof value}' of state '${state}' is not supported.`);
        valueType = null;
    }
    return {val:value, type:valueType};

}

/**
 * Validates an IP address
 * Source: https://www.w3resource.com/javascript/form/ip-address-validation.php
 * @param {string} ip - IP address to validate
 * @return {boolean} - true if IP is valid, false if not
 */
function validateIP(ip) {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
        return true;
    } else {
        return false;
    }
}

/**
 * Validates a Port ()
 * (Mic-M) - 22-Oct-2020
 * @param {*} port - Port
 * @return {boolean} - true if port is valid, false if not
 */
function validatePort(port) {

    if(!port) return false;

    let num = 0;
    if (typeof port === 'string') {
        num = parseInt(port);
    } else if (typeof port !== 'number') {
        return false; // go out since we have neither number nor string
    }
    if ( isNaN(num) || num < 1 || num > 65536 ) {
        return false;
    } else {
        return true;
    }

}

/**
 * Validates an ioBroker Namespace
 * (Mic-M) - 22-Oct-2020
 * @param {string} ns - namespace
 * @return {boolean} - true if namespace is valid, false if not
 */
/*
function validateNamespace(port) {

    // TODO: Add here

}
*/

/**
 * Validates an ioBroker Instance number
 * (Mic-M) - 22-Oct-2020
 * @param {string|number} instance - Instance number
 * @return {boolean} - true if instance number is valid, false if not
 */
function validateInstanceNo(instance) {

    if(!instance) return false;

    let num = 0;
    if (typeof instance === 'string') {
        num = parseInt(instance);
    } else if (typeof instance !== 'number') {
        return false; // go out since we have neither number nor string
    }
    if ( isNaN(num) || num < 1 || num > 9 ) { // to be verified what the upper limit is -- see https://discordapp.com/channels/743167951875604501/743171252377616476/768919782372147252
        return false;
    } else {
        return true;
    }



}






/**
 * Promise Wrapping
 */


/**
 * @param {string} path - File path
 * @param {object|string} opt - Options, see https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback
 * @return {Promise<string|null>} string if successful, null if not.
 */
function readFileAsync(path, opt) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, opt, (err, data) => {
            if (err) {
                dumpError('readFileAsync()', err);
                reject(null);
            } else {
                resolve(data.toString());
            }
        });
    });
}

/**
 * @param {string} path - File path
 * @return {Promise<object|null>} object with states if successful, null if not.
 */
function getFileStatsAsync(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                dumpError('getFileStats()', err);
                reject(null);
            } else {
                resolve(stats);
            }
        });
    });
}


function fileExistsAsync(path, opt) {
    return new Promise((resolve) => {
        fs.access(path, opt, (err) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}


/**
 * Waiting for user input on CLI
 * @param {string} query
 * @returns {Promise<unknown>}
 */
function readlineQuestionAsync(query) {
    return new Promise( (resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(query, (answer) => {
            resolve(answer);
            rl.close();
        });
    });
}

/**
 * Error Message to Log. Handles error object being provided.
 *
 * @param {string} msg               - (intro) message of the error
 * @param {*}      [error=undefined] - Optional: Error object or string
 */
function dumpError(msg, error=undefined) {
    if (!error) {
        console.error(msg);
    } else {
        if (typeof error === 'object') {
            if (error.stack) {
                console.error(`${msg} – ${error.stack}`);
            } else if (error.message) {
                console.error(`${msg} – ${error.message}`);
            } else {
                console.error(`${msg} – ${JSON.stringify(error)}`);
            }
        } else if (typeof error === 'string') {
            console.error(`${msg} – ${error}`);
        } else {
            console.error(`[dumpError()] : wrong error argument: ${JSON.stringify(error)}`);
        }
    }
}


module.exports = {
    getStateValueType,
    validateIP,
    validatePort,
    validateInstanceNo,
    readFileAsync,
    getFileStatsAsync,
    fileExistsAsync,
    readlineQuestionAsync,
    dumpError
};
