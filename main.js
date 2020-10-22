'use strict';

// https://github.com/Jey-Cee/iobroker-drones


/**********************************
 * Don't change any code below here
 **********************************/

const fs = require('fs');
const ioClient = require('socket.io-client');
const exec = require('child_process').exec;
const constants = require(__dirname + '/lib/constants');
const tools = require(__dirname + '/lib/tools.js');
require('dotenv').config();

// If last change of lib/system.json is older than this number of hours, file will be updated.
const systemJsonExpiration = 240; // in hours

//Load config into variables
let ip = process.env.IP;
let port = process.env.PORT;
let ns = process.env.NS;
let instance = process.env.INSTANCE;

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

    /**
     * Check if .env exists if it does ask the user for information and create it
     */
    try {
        if (!await tools.fileExistsAsync(__dirname + '/.env')) {
            let config = '';

            //Create CLI

            /**
             * Ask the user for data
             */
            console.log(`No configuration found! Please enter it now.\nWhere default is present you can leave empty to use that default value.\n`);

            // - IP address -
            let input_ip = '';
            let ipValid = 0; // -1 = invalid, 0 = unknown, 1 = valid )
            while (ipValid < 1) {
                switch (ipValid) {
                    case (0):
                        // status unknown (happens at first execution)
                        input_ip = await tools.readlineQuestionAsync('IP address of ioBroker (e.g. 192.168.10.10): ');
                        ipValid = (tools.validateIP(input_ip)) ? 1 : -1;
                        break;
                    case (-1):
                        // status invalid (user entered invalid IP address)
                        input_ip = await tools.readlineQuestionAsync('You have entered an invalid IP address, please try again: ');
                        ipValid = (tools.validateIP(input_ip)) ? 1 : -1;
                        break;
                    default:
                        break;
                }
            }
            config += `IP=${input_ip}\n`;
            ip = input_ip;

            // - Port - 
            let input_port = '';
            let portValid = 0; // -1 = invalid, 0 = unknown, 1 = valid )
            while (portValid < 1) {
                switch (portValid) {
                    case (0):
                        // status unknown (happens at first execution)
                        input_port = await tools.readlineQuestionAsync('Socketio port (default: 8084): ');
                        portValid = (tools.validatePort(input_port)) ? 1 : -1;
                        break;
                    case (-1):
                        // status invalid (user entered invalid Port)
                        input_port = await tools.readlineQuestionAsync('You have entered an invalid port, please try again: ');
                        portValid = (tools.validatePort(input_port)) ? 1 : -1;
                        break;
                    default:
                        break;
                }
            }
            config += `PORT=${input_port}\n`;
            port = input_port;

            // - Namespace -
            // !! TODO: Add input validation
            const input_ns = await tools.readlineQuestionAsync('Namespace for ioBroker you want to use (default: drones):');
            if (input_ns.length === 0) {
                config += `NS=drones\n`;
                ns = 'drones';
            } else {
                config += `NS=${input_ns}\n`;
                ns = input_ns;
            }

            // - Instance -
            let input_instance = '';
            let instanceValid = 0; // -1 = invalid, 0 = unknown, 1 = valid )
            while (instanceValid < 1) {
                switch (instanceValid) {
                    case (0):
                        // status unknown (happens at first execution)
                        input_instance = await tools.readlineQuestionAsync('Instance number for ioBroker (default: 0): ');
                        instanceValid = (tools.validateInstanceNo(input_instance)) ? 1 : -1;
                        break;
                    case (-1):
                        // status invalid (user entered invalid Port)
                        input_instance = await tools.readlineQuestionAsync('You have entered an invalid Instance number, please try again: ');
                        instanceValid = (tools.validateInstanceNo(input_instance)) ? 1 : -1;
                        break;
                    default:
                        break;
                }
            }
            config += `INSTANCE=${input_instance}\n`;
            instance = input_instance;

            // Finally set the config file
            fs.writeFileSync('.env', config);

        }
    } catch (error) {
        tools.dumpError(`check .env`, error);
    }

    try {

        /**
         * Get system info for global variable 'systemInfo'
         */
        if (await tools.fileExistsAsync(__dirname + '/lib/system.json', fs.constants.F_OK)) {
            // -- File 'system.json' exists

            // Check last modified date
            const fileStats = await tools.getFileStatsAsync(__dirname + '/lib/system.json'); //  instance of JavaScript Date
            if(fileStats===null) throw(`File 'lib/system.json' exists, but could not get any file information.`);
            console.log(`lib/system.json: Date last modified: ${fileStats.mtime}`);
            const lastModifiedTs = fileStats.mtime.getTime();
            // compare
            const hoursAgo = Date.now() - 1000*60*60*systemJsonExpiration;
            if (lastModifiedTs > hoursAgo) {
                // No update needed, so we read current config.
                console.log(`system.json is newer than than ${systemJsonExpiration} hours, so not being updated.`);
                // prepare current system
                const readFileRet = await tools.readFileAsync(__dirname + '/lib/system.json', 'utf8');
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
        if (await tools.fileExistsAsync(`${__dirname}/lib/${systemInfo.distribution}.js`, fs.constants.F_OK)) {
            funcs = require(`${__dirname}/lib/${systemInfo.distribution}.js`);
        } else {
            //console.warn(`No distribution specific module found for '${systemInfo.distribution}'`);
        }

        /**
         * createService
         * TODO: currently only covering ubuntu, requires extension.
         *       Also: looks like we need this as "await".
         */
        const createService = require(__dirname + '/lib/createService');
        await createService.register(systemInfo.distribution);

        /**
         * Connect with ioBroker socket-io adapter
         */
        conn = ioClient.connect(`http://${ip}:${port}`, {
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
                tools.setStateAsync(`${ns}.${instance}.${systemInfo.hostname}.info.connected`, {val: false, ack:true});
            });

            conn.on('error', (error) => {
                console.log('Error: ' + error);
            });

            conn.on('event', (data)=>{
                console.log('Data: ' + data);
            });

            conn.on('ping', () => {
                setStateAsync(`${ns}.${instance}.${systemInfo.hostname}.info.connected`, {val: true, ack:true, expire: 51});
            });

            conn.on('pong', (latency) => {
                //console.log('Pong: ' + latency);
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
                }
                if (state) console.log('stateChange: ' + id + ' ' + state);
            });

            process.on('SIGTERM', ()=>{
                console.log('System is shutting down');
                tools.setStateAsync(`${ns}.${instance}.${systemInfo.hostname}.info.connected`, {val: false, ack:true});
                process.exit();
            });

        });


    } catch (error) {
        tools.dumpError(`getSystemInformation()`, error);
    }

}

async function ioBrokerInit(){
    try {

        conn.emit('name', systemInfo.hostname);

        // create and update ioBroker objects, and get array of states paths to subscribe to
        const statesToSubscribe = await createObjectsAsync();
        setStateAsync(`${ns}.${instance}.${systemInfo.hostname}.info.connected`, {val: true, ack:true, expire: 51});

        /**
         * Update native key of ioBroker device object - see https://forum.iobroker.net/topic/36837/das-volle-potential-der-objekte-nutzen
         *
         * !! This is a workaround until PR #35 is in stable - https://github.com/ioBroker/ioBroker.socketio/pull/35
         * Once in stable of socketio adapter, let's use: extendObjectAsync(`${ns}.${instance}.${systemInfo.hostname}`, updateNative);
         * TODO: check if this is really needed after every restart, or only if lib/system.json was updated
         */
        const obj = await getObjectAsync(`${ns}.${instance}.${systemInfo.hostname}`);
        if(!obj) throw(`Could not get object '${ns}.${instance}.${systemInfo.hostname}'`);
        for (const key in systemInfo) {
            const stateValObj = tools.getStateValueType(key, systemInfo[key]);
            if (stateValObj.type !== null) {
                obj.native[key] = stateValObj.val;
            }
        }
        if (!await setObjectAsync(`${ns}.${instance}.${systemInfo.hostname}`, obj)) {
            throw(`Could not set object '${ns}.${instance}.${systemInfo.hostname}'`);
        }


        /**
         * Subscribe to states
         */
        for (const path of statesToSubscribe) {
            conn.emit('subscribe', path);
        }

    } catch (error) {
        tools.dumpError(`init() Unexpected error`, error);
    }
}

/**
 * @return {Promise<array>} - returns states we need to subscribe to on changes
 */
async function createObjectsAsync() {

    const path = `${ns}.${instance}.${systemInfo.hostname}`;
    const statePaths = [];
    const objectsToProcess = [];
    const statesToSubscribe = [];

    // create top level device object
    if (! await getObjectAsync(path)) {
        await setObjectAsync(path, {'type': 'device', 'common': {'name': systemInfo.hostname, 'role': 'drone'}, 'native': {}});
    }

    /**
     * Prepare states.
     * subscribe:true = we need to subscribe to that state and will be returned (as array of state paths)
     */
    // info.connected
    objectsToProcess.push({id: path + '.info.connected', obj:{'type': 'state', 'common': {'name': 'Connected', 'role': 'indicator.state', 'type': 'boolean', 'read': true, 'write': false}, 'native': {}} });

    // state for sending user command and state cmd_answer for receiving result
    objectsToProcess.push({id: path + '.command', subscribe:true, obj:{'type': 'state', 'common': {'name': 'Command', 'role': 'indicator.state', 'type': 'string', 'read': true, 'write': true}, 'native': {}} });
    objectsToProcess.push({id: path + '.cmd_answer', obj:{'type': 'state', 'common': {'name': 'Command', 'role': 'indicator.state', 'type': 'string', 'read': true, 'write': false}, 'native': {}} });

    // commands
    for (const cmd in constants.commands) {
        const obj = constants.commands[cmd];
        if (systemInfo.distribution in obj) {
            objectsToProcess.push({id: path + '.' + cmd, subscribe:true, obj:{'type': 'state', 'common': {'name': obj.name, 'role': 'button', 'type': 'boolean', 'read': true, 'write': true, 'def': false}, 'native': {}}});
        }
    }

    // System info states
    for (const key in systemInfo) {
        const stateValObj = tools.getStateValueType(key, systemInfo[key]);
        if (stateValObj.type !== null) objectsToProcess.push({id: path + '.info.' + key, obj:{type:'state', common: {name: key, role:'state', type: stateValObj.type, read: true, write: false, def:stateValObj.val}, native: {}}});
    }

    // create objects
    for (const stateObj of objectsToProcess) {
        statePaths.push(stateObj.id);
        if (! await getObjectAsync(stateObj.id)) {
            await setObjectAsync(stateObj.id, stateObj.obj);
        }
        // for subscriptions
        if (stateObj.subscribe) statesToSubscribe.push(stateObj.id);
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

    // Update system info states.
    // TODO: check if this is really needed after every restart, or only if lib/system.json was updated
    for (const key in systemInfo) {
        const stateValObj = tools.getStateValueType(key, systemInfo[key]);
        if (stateValObj.type !== null) await setStateAsync(path + '.info.' + key, {val: stateValObj.val, ack:true});
    }

    return statesToSubscribe;

}


/**
 * @param {string} path - File path
 * @return {Promise<object|null>} object if successful, null if not.
 */
function getObjectAsync(path) {
    return new Promise((resolve, reject) => {
        conn.emit('getObject', path, (err, data)=>{
            if (err) {
                tools.dumpError('getObjectAsync()', err);
                reject(null);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * extendObjectAsync - this will also update existing key values, so not only "extending".
 * TODO: Activate once PR #35 is implemented and in stable - https://github.com/ioBroker/ioBroker.socketio/pull/35
 * @param {string} path - Object path
 * @param {object} objPart - object part to be set into object, like: {common:{name:'XYZ'}
 * @return {Promise<true|false>} true if successful, false if not
 */
/*
async function extendObjectAsync(path, objPart) {
    return new Promise((resolve, reject) => {
        // https://discordapp.com/channels/743167951875604501/743171252377616476/762360203878072391
        conn.emit('extendObject', path, objPart, (err)=>{
            if (err) {
                dumpError('extendObjectAsync()', err);
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
}
*/

/**
 * Set ioBroker state object
 * @param {string} path - object path
 * @param {object} obj - object to be set
 * @return {Promise<boolean>} - true if successful, false if not
 */
function setObjectAsync(path, obj) {
    return new Promise((resolve, reject) => {
        conn.emit('setObject', path, obj, (err)=>{
            if (err) {
                tools.dumpError('setObjectAsync()', err);
                reject(false);
            } else {
                resolve(true);
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
 * Set new value to a ioBroker state object
 * @param {string} path - state path
 * @param {*} val - state val to be set - https://github.com/ioBroker/ioBroker.socketio#setstate
 * @return {Promise<boolean>} - true if successful, false if not
 */
function setStateAsync(path, val) {
    return new Promise((resolve, reject) => {
        conn.emit('setState', path, val, (err)=>{
            if (err) {
                tools.dumpError('setStateAsync()', err);
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
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
            //TODO: remove log for stable release
            console.log('stdout: ' + answer);
            setStateAsync(`${ns}.${instance}.${systemInfo.hostname}.cmd_answer`, {val: answer, ack:true});
        }else if(stderr){
            console.log('stderr: ' + stderr);
            callback && callback('Error');
            setStateAsync(`${ns}.${instance}.${systemInfo.hostname}.cmd_answer`, {val: 'Error: ' + stderr, ack:true});
        }
    });
}


