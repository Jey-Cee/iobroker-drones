'use strict';

// https://github.com/Jey-Cee/iobroker-drones


/******************************
 * Set ip address and port from ioBroker socket-io adapter instance settings
 ******************************/
const ip = '10.10.0.165';
const port = 9090;

/**********************************
 * Don't change any code below here
 **********************************/

const fs = require('fs');
const ioClient = require('socket.io-client');
const exec = require('child_process').exec;
const constants = require(__dirname + '/lib/constants');

const ns = 'drones';  // Namespace for ioBroker objects
const instance = '0'; // ioBroker objects instance number

// If last change of lib/system.json is older than this number of hours, file will be updated.
const systemJsonExpiration = 240; // in hours


/**
 * System information, which is also kept in /lib/system.json
 * Example: {arch: "x64", hostname: "XYZ", platform: "win32", distribution: "windows", type: "Windows_NT", 
 *           memory: 15000.5, cpu: "Intel(R) Core(TM) ..", cores: 4, cpu_speed: 2500}
 */
let systemInfo = {}; 

// Distribution specific functions, from /lib/ubuntu.js, /lib/windows.js, etc.
let funcs;

// ioBroker socket io connection
let conn;


init();
async function init() {

    try {

        /**
         * Get system info for global variable 'systemInfo'
         */
        if (await fileExistsAsync(__dirname + '/lib/system.json', fs.constants.F_OK)) {
            // -- File 'system.json' exists
        
            // Check last modified date
            const fileStats = await getFileStatsAsync(__dirname + '/lib/system.json'); //  instance of JavaScript Date
            if(fileStats===null) throw(`File 'lib/system.json' exists, but could not get any file information.`);
            console.log(`lib/system.json: Date last modified: ${fileStats.mtime}`);
            const lastModifiedTs = fileStats.mtime.getTime();
            // compare
            const hoursAgo = Date.now() - 1000*60*60*systemJsonExpiration;
            if (lastModifiedTs > hoursAgo) {
                // No update needed, so we read current config.
                console.log(`system.json is newer than than ${systemJsonExpiration} hours, so not being updated.`);
                // prepare current system
                const readFileRet = await readFileAsync(__dirname + '/lib/system.json', 'utf8');
                if (!readFileRet) {
                    throw('Could not get /lib/system.json contents');
                } else {
                    systemInfo = JSON.parse(readFileRet);
                }
            } else {
                // We need to update
                // TODO: this is redundant to }else{ below
                console.log(`Update system.json, since file is older than ${systemJsonExpiration} hours.`);
                const sys = require(__dirname + '/lib/getOSinfo');
                const res = await sys.getInfoAsync();
                if (!res) throw(`Could not get system information.`);
                systemInfo = res;                
            }

        } else {
            // -- File 'system.json' does not exist.

            // Get current system config and create a new system.json
            console.log('system.json does not exist, so we create it.');
            const sys = require(__dirname + '/lib/getOSinfo');
            const res = await sys.getInfoAsync();
            if (!res) throw(`Could not get system information.`);
            systemInfo = res;
        }

        /**
         * Get distribution specific functions for global variable 'funcs'
         */
        if (await fileExistsAsync(`${__dirname}/lib/${systemInfo.distribution}.js`, fs.constants.F_OK)) {
            funcs = require(`${__dirname}/lib/${systemInfo.distribution}.js`);
        } else {
            console.warn(`No distribution specific module found for '${systemInfo.distribution}'`);
        }

        /**
         * createService
         * TODO: currently only covering ubuntu, requires extension.
         *       Also: looks like we need this as "await".
         */
        const createService = require(__dirname + '/lib/createService');
        createService.register(systemInfo.distribution);

        /**
         * Connect with ioBroker socket-io adapter
         */
        conn = ioClient.connect('http://' + ip + ':' + port, {
            query: 'key=nokey',
            'reconnection limit': 10000,
            'max reconnection attempts': Infinity
        });        
        
        /**
         * Once connected:
         */        
        conn.on('connect', ()=>{

            ioBrokerInit();

            conn.on('connect_error', (error)=>{
                console.error(`Error: ${error} - Please check if ip ('${ip}') and port('${port}') matches with socketio adapter settings.`);
                conn.emit('setState', ns + '.0.' + systemInfo.hostname + '.info.connected', false);
            });
            
            conn.on('error', (error) => {
                console.log('Error: ' + error);
            });
            
            conn.on('event', (data)=>{
                console.log('Data: ' + data);
            });
            
            conn.on('ping', () => {
                conn.emit('setState', ns +'.0.' + systemInfo.hostname + '.info.connected', {val: true, expire: 51});
            });
            
            conn.on('pong', (latency) => {
                console.log('Pong: ' + latency);
            });
            
            conn.on('objectChange', (id, obj)=>{
                console.log('objectChange: ' + id + ' ' + obj);
            });
            
            conn.on('stateChange', (id, state)=>{
                console.log(id);
                const path = ns + '.0.' + systemInfo.hostname + '.';
            
                for (const cmd in constants.commands) {
                    if (systemInfo.distribution in constants.commands[cmd]) {
                        if(path + cmd === id && state.val === true) {
                            const osCommand = constants.commands[cmd][systemInfo.distribution];
                            command(osCommand);
                        }
                    }
                }
            
                switch(id){
                    case path + 'command':
                        command(state.val);
                        break;
                    /*
                    case path + 'shutdown':
                        if(state.val === true){
                            command('shutdown now');
                        }
                        break;
                    case path + 'reboot':
                        if(state.val === true){
                            command('shutdown -r now', (result) => {
                                if (result === 'Error') {
                                    command('reboot');
                                }
                            });
                        }
                        break;
                    */
                    case path + 'audio.mute':
                        // mute();
                        break;
                }
                if (state) console.log('stateChange: ' + id + ' ' + state);
            });
            
            process.on('SIGTERM', ()=>{
                console.log('System is shutting down');
                conn.emit('setState', ns + '.0.' + systemInfo.hostname + '.info.connected', false);
                process.exit();
            });
            
        });


    } catch (error) {
        dumpError(`getSystemInformation()`, error);
    }

}

async function ioBrokerInit(){
    try {
        const path = `${ns}.${instance}.${systemInfo.hostname}`;
        conn.emit('name', systemInfo.hostname);
        await createObjectsAsync(); // create and update ioBroker objects
        conn.emit('setState', path + '.info.connected', {val: true, expire: 51});
        conn.emit('subscribe', `${path}.*`); // TODO: Exclude objects: info.connected and cmd_answer
    } catch (error) {
        dumpError(`init() Unexpected error`, error);
    }
}



async function createObjectsAsync() {

    const path = `${ns}.${instance}.${systemInfo.hostname}`;
    const statePaths = [];
    if (! await getObjectAsync(path)) {
        await setObjectAsync(path, {'type': 'device', 'common': {'name': systemInfo.hostname, 'role': 'drone'}, 'native': {}});
    }

    const objectsToProcess = [
        {id: path + '.info.connected', obj:{'type': 'state', 'common': {'name': 'Connected', 'role': 'indicator.state', 'type': 'boolean', 'read': true, 'write': false}, 'native': {}} },
        {id: path + '.command', obj:{'type': 'state', 'common': {'name': 'Command', 'role': 'indicator.state', 'type': 'string', 'read': true, 'write': true}, 'native': {}} },
        {id: path + '.cmd_answer', obj:{'type': 'state', 'common': {'name': 'Command', 'role': 'indicator.state', 'type': 'string', 'read': true, 'write': false}, 'native': {}} },
    ];
    for (const cmd in constants.commands) {
        const obj = constants.commands[cmd];
        if (systemInfo.distribution in obj) {
            objectsToProcess.push({id: path + '.' + cmd, obj:{'type': 'state', 'common': {'name': obj.name, 'role': 'button', 'type': 'boolean', 'read': true, 'write': true, 'def': false}, 'native': {}}});
        }
    }

    for (const stateObj of objectsToProcess) {
        statePaths.push(stateObj.id);
        if (! await getObjectAsync(stateObj.id)) {
            await setObjectAsync(stateObj.id, stateObj.obj);
        }
    }

    // Delete all objects which are no longer used.
    const x = await getStatesAsync(path + '.*');
    for (const statePath in x) {
        if ( statePaths.indexOf(statePath) == -1 ) {
            // State is no longer used.
            conn.emit('delObject', statePath, (error)=>{
                if(error) {
                    console.error(`Error deleting object '${statePath}': ${error}`);
                } else {
                    console.log(`Object '${statePath}' deleted, since command or option does no longer exist.'`);                    
                }
            });
        }
    }
}


/**
 * Execute a command
 * @param {string} cmd
 * @param {object} [callback=undefined] 
 */
function command(cmd, callback=undefined) {
    exec(cmd, (error, stdout, stderr)=>{
        if (error){console.log(error);}
        if(stdout){
            const answer = stdout.trim();
            console.log('stdout: ' + answer);
            conn.emit('setState', ns +'.0.' + systemInfo.hostname + '.cmd_answer', answer);
        }else if(stderr){
            console.log('stderr: ' + stderr);
            callback && callback('Error');
            conn.emit('setState', ns +'.0.' + systemInfo.hostname + '.cmd_answer', 'Error: ' + stderr);
        }
    });
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
                console.error(`readFileAsync(): ` + err);
                reject(null);
            } else {
                resolve(data.toString());
            }
        });            
    });
}

/**
 * @param {string} path - File path
 * @return {Promise<object|null>} object with stats if successful, null if not.
 */
function getFileStatsAsync(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                console.error(`getFileStats(): ` + err);
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

function getObjectAsync(path) {
    return new Promise((resolve, reject) => {
        conn.emit('getObject', path, (err, data)=>{
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function setObjectAsync(path, obj) {
    return new Promise((resolve, reject) => {
        conn.emit('setObject', path, obj, (err)=>{
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function getStatesAsync(path) {
    return new Promise((resolve, reject) => {
        conn.emit('getStates', path, (err, data)=>{
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
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