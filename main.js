'use strict';

// https://github.com/Jey-Cee/iobroker-drones

//const os = require('os');
const fs = require('fs');
const ioClient = require('socket.io-client');
const exec = require('child_process').exec;

const ns = 'drones';
const instance = '0';
let funcs;

//some information
let arch, hostname, platform, type, distribution, memory, cpu, cores, cpu_speed;
const ip = '10.10.0.165';
const port = 9090;


fs.open(__dirname + '/lib/system.json', 'r', (err, fd) => {
    if(err){
        const sys = require(__dirname + '/lib/getOSinfo');
        sys.get((result)=>{

            if(result === 'Ready'){
                readSystem((result)=>{
                    const createService = require(__dirname + '/lib/createService');
                    createService.register(distribution);
                });

            }

        });
    }else{
        readSystem();
    }
});

function readSystem(callback){
    const sysinfo = fs.readFile(__dirname + '/lib/system.json', 'utf8', (err, data)=>{
        if(err){
            console.log(err);
        }
        sysInfo(data, (result)=>{
            switch(distribution){
                case 'ubuntu':
                    funcs = require(__dirname + '/lib/ubuntu');
                    break;
                case 'debian':
                    funcs = require(__dirname + '/lib/debian');
                    break;
                case '7':
                    funcs = require(__dirname + '/lib/android_7');
                    break;
                case 'windows':
                    funcs = require(__dirname + '/lib/windows');
                    break;

            }
            return('Ready');
        });
    });
    if(typeof callback === 'function'){
        callback(sysinfo);
    }

}

function sysInfo(data, callback){
    const json = JSON.parse(data);
    arch = json['arch'];
    hostname = json['hostname'];
    platform = json['platform'];
    type = json['type'];
    distribution = json['distribution'];
    memory = json['memory'];
    cpu = json['cpu'];
    cores = json['n_cores'];
    cpu_speed = json['cpu_speed'];
    callback('Ready');
}

process.on('SIGTERM', ()=>{
    console.log('System is shutting down');
    conn.emit('setState', ns + '.0.' + hostname + '.info.connected', false);
    process.exit();
});

const conn = ioClient.connect('http://' + ip + ':' + port, {
    query: 'key=nokey',
    'reconnection limit': 10000,
    'max reconnection attempts': Infinity
});

conn.on('connect', ()=>{
    init();
});

conn.on('connect_error', (error)=>{
    console.error(`Error: ${error} - Please check if ip ('${ip}') and port('${port}') matches with socketio adapter settings.`);
    conn.emit('setState', ns + '.0.' + hostname + '.info.connected', false);
});

conn.on('error', (error) => {
    console.log('Error: ' + error);
});

conn.on('event', (data)=>{
    console.log('Data: ' + data);
});



conn.on('ping', () => {
    conn.emit('setState', ns +'.0.' + hostname + '.info.connected', {val: true, expire: 51});
});

conn.on('pong', (latency) => {
    console.log('Pong: ' + latency);
});

conn.on('objectChange', (id, obj)=>{
    console.log('objectChange: ' + id + ' ' + obj);
})

conn.on('stateChange', (id, state)=>{
    console.log(id);
    const path = ns + '.0.' + hostname + '.';
    switch(id){
        case path + 'command':
            command(state.val);
            break;
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
        case path + 'audio.mute':
            // mute();
            break;
        case path + 'hibernate':
            if (distribution==='windows') command('shutdown -h'); // Windows command
            break;
    }
    if (state) console.log('stateChange: ' + id + ' ' + state);
});



async function init(){

    try {

        const path = `${ns}.${instance}.${hostname}`;

        conn.emit('name', hostname);

        const data = await getObjectAsync(path);
        if (data === null) await createObjectsAsync();

        conn.emit('setState', path + '.info.connected', {val: true, expire: 51});

        conn.emit('subscribe', `${path}.*`);

    } catch (error) {
        console.error(`init() Unexpected error: '${error}'`);
    }

}

async function createObjectsAsync() {
    const path = `${ns}.${instance}.${hostname}`;
    await setObjectAsync(path, {'type': 'device', 'common': {'name': hostname, 'role': 'drone'}, 'native': {}} );
    await setObjectAsync(path + '.info.connected', {'type': 'state', 'common': {'name': 'Connected', 'role': 'indicator.state', 'type': 'boolean', 'read': true, 'write': false}, 'native': {}});
    await setObjectAsync(path + '.command', {'type': 'state', 'common': {'name': 'Command', 'role': 'indicator.state', 'type': 'string', 'read': true, 'write': true}, 'native': {}});
    await setObjectAsync(path + '.shutdown', {'type': 'state', 'common': {'name': 'Shutdown', 'role': 'indicator.state', 'type': 'boolean', 'read': true, 'write': true, 'def': false}, 'native': {}});
    await setObjectAsync(path + '.reboot', {'type': 'state', 'common': {'name': 'Reboot', 'role': 'indicator.state', 'type': 'boolean', 'read': true, 'write': true, 'def': false}, 'native': {}});
    await setObjectAsync(path + '.cmd_answer', {'type': 'state', 'common': {'name': 'Command', 'role': 'indicator.state', 'type': 'string', 'read': true, 'write': false}, 'native': {}});

    switch(distribution){
        case 'ubuntu':
            //
            break;
        case 'debian':
            //
            break;
        case '7':
            //
            break;
        case 'windows':
            await setObjectAsync(path + '.hibernate', {'type': 'state', 'common': {'name': 'Hibernate', 'role': 'button', 'type': 'boolean', 'read': true, 'write': true, 'def': false}, 'native': {}});
            break;
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
            conn.emit('setState', ns +'.0.' + hostname + '.cmd_answer', answer);
        }else if(stderr){
            console.log('stderr: ' + stderr);
            callback && callback('Error');
            conn.emit('setState', ns +'.0.' + hostname + '.cmd_answer', 'Error: ' + stderr);
        }
    });
}


function getObjectAsync(path) {
    return new Promise(resolve => {
        conn.emit('getObject', path, (err, data)=>{
            resolve(data);
        });
    });
}

function setObjectAsync(path, obj) {
    return new Promise(resolve => {
        conn.emit('setObject', path, obj, ()=>{
            resolve();
        });
    });
}