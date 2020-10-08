const os = require('os');
const fs = require('fs');
const ioClient = require('socket.io-client');
const exec = require('child_process').exec;

const ns = 'drones';
let funcs;

//some information
let arch, hostname, platform, type, distribution, memory, cpu, cores, cpu_speed;
let ip = '192.168.0.220';
let port = 8084;


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
    let sysinfo = fs.readFile(__dirname + '/lib/system.json', 'utf8', (err, data)=>{
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

            }
            return('Ready');
        });
    });
    if(typeof callback === 'function'){
        callback(sysinfo);
    }

}

function sysInfo(data, callback){
    let json = JSON.parse(data);
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

let conn = ioClient.connect('http://' + ip + ':' + port, {
        query:  'key=nokey'
    });


conn.on('connect', ()=>{
    init();
})

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
    //console.log('Pong: ' + latency);
});

conn.on('objectChange', (id, obj)=>{
    console.log('objectChange: ' + id + ' ' + obj);
})

conn.on('stateChange', (id, state)=>{
    let path = ns + '.0.' + hostname + '.';
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
            command('shutdown -r now', (result)=>{
                if(result === 'Error'){
                    command('reboot')
                }
            });
            }
            break;
        case path + 'audio.mute':
            mute();
            break;

    }
    console.log('stateChange: ' + id + ' ' + state);
})



function init(){
    conn.emit('name', hostname);

    conn.emit('subscribe', ns +'.0.' + hostname);

    conn.emit('getObject', ns +'.0.' + hostname, (err, data)=>{
        if(data === null){
            createObjects();
        }else{
            conn.emit('setState', ns +'.0.' + hostname + '.info.connected', {val: true, expire: 51});
        }
    })

}

function createObjects(){
    conn.emit('setObject', ns + '.0.' + hostname, {"type": "device", "common": {"name": hostname, "role": "drone"}, "native": {}} );
    conn.emit('setObject', ns +'.0.' + hostname + '.info.connected', {"type": "state", "common": {"name": "Connected", "role": "indicator.state", "type": "boolean", "read": true, "write": false}, "native": {}});
    conn.emit('setObject', ns + '.0.' + hostname + '.command', {"type": "state", "common": {"name": "Command", "role": "indicator.state", "type": "string", "read": true, "write": true}, "native": {}});
    conn.emit('setObject', ns + '.0.' + hostname + '.shutdown', {"type": "state", "common": {"name": "Shutdown", "role": "indicator.state", "type": "boolean", "read": true, "write": true, "def": false}, "native": {}});
    conn.emit('setObject', ns + '.0.' + hostname + '.reboot', {"type": "state", "common": {"name": "Reboot", "role": "indicator.state", "type": "boolean", "read": true, "write": true, "def": false}, "native": {}});
    conn.emit('setObject', ns + '.0.' + hostname + '.cmd_answer', {"type": "state", "common": {"name": "Command", "role": "indicator.state", "type": "string", "read": true, "write": false}, "native": {}});
}


function command(cmd, callback){
    exec(cmd, (error, stdout, stderr)=>{
        if (error){console.log(error)};
        if(stdout){
            let answer = stdout.trim();
            console.log('stdout: ' + answer);
            conn.emit('setState', ns +'.0.' + hostname + '.cmd_answer', answer);
        }else if(stderr){
            console.log('stderr: ' + stderr);
            callback('Error');
            conn.emit('setState', ns +'.0.' + hostname + '.cmd_answer', 'Error: ' + stderr);
        }
    });
}


