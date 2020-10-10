const exec = require('child_process').exec;
const os = require('os');
const fs = require('fs');

function get(callback) {

    //get architecture like x64 or ARM
    const arch = os.arch();
    let hostname = os.hostname();
    if(arch === 'arm' || arch === 'arm64' && hostname === undefined || hostname === 'localhost'){
        console.log('hostname: ' + hostname);
        const x = exec('getprop ro.product.device', (error, stdout, stderr)=>{
            if(error){console.log(error)}
            if(stderr){console.log(stderr)}
            hostname = stdout.replace('\n', '');
            return stdout;
        });
    }
    const platform = os.platform();
    const type = os.type();
    //get total memory
    const ram = Math.round((os.totalmem() / 1000000) * 2) / 2;


    //get infos for CPU and cores
    let cpu, n_cores, cpu_speed;       //CPU Name, number of CPU cores, speed of slowest core

    const cpus = os.cpus();
    n_cores = cpus.length;

    for (let x = 0; x < n_cores; x++) {

        if (cpu === null || cpu === undefined || cpu === '') {
            cpu = cpus[x]['model'];
        }
        if (cpu_speed > cpus[x]['speed'] || cpu_speed === null || cpu_speed === undefined || cpu_speed === '') {
            cpu_speed = cpus[x]['speed'];
        }
    }

    let dist;   //Distribution of OS

    getDist(platform, (result) => {
        dist = result;

        const data = {
            'arch': arch,
            'hostname': hostname,
            'platform': platform,
            'distribution': dist,
            'type': type,
            'memory': ram,
            'cpu': cpu,
            'n_cores': n_cores,
            'cpu_speed': cpu_speed
        };

        const json = JSON.stringify(data);
        fs.writeFile(__dirname + '/system.json', json, { 'encoding': 'utf8', 'flag': 'w' }, (err) => {
            if (err) console.log(err);
            console.log('The file has been saved!');
            callback('Ready');
        });

    });


}

function getDist(platform, callback){

    console.log('getDist: ' + platform);
    switch (platform){

        case 'win32':
            callback('windows');
            break;

        case 'linux':

            test = exec('uname -v', (error, stdout, stderr)=>{

                if(error){
                    console.log(error);
                    return;
                }
                if(stderr){
                    console.log(stderr);
                }

                const distris = ['ubuntu', 'debian'];
                for(const x in distris){
                    const patt = new RegExp(distris[x], 'gmi');
                    if(patt.test(stdout)){
                        callback(distris[x]);
                        break;
                    }
                }


            });
            break;
        case 'android':
            test = exec('getprop ro.build.version.release ', (error, stdout, stderr)=>{
                if(error){
                    console.log(error);
                    return;
                }
                if(stderr){
                    console.log(stderr);
                }

                let version = stdout.replace(/\.\d\.\d/g, '');
                version = version.replace('\n', '');
                callback(version);

            });
            break;
    }
}

exports.get = get;