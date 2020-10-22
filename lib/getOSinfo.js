/* eslint-disable no-case-declarations */
'use strict';

const exec = require('child_process').exec;
const os = require('os');
const fs = require('fs');


/**
 * Get OS Information
 * @return (Promise<object|null>)
 */
async function getInfoAsync() {

    try {

        //get architecture like x64 or ARM
        const arch = os.arch();
        let hostname = os.hostname();
        if (arch === 'arm' || arch === 'arm64' && hostname === undefined || hostname === 'localhost') {
            console.log('hostname: ' + hostname);
            const execReturn = await _execAsync('getprop ro.product.device');
            if (execReturn) {
                hostname = execReturn.replace('\n', '');
            } else {
                throw(`No hostname found for arch '${arch}'`);
            }
        }
        const platform = os.platform();
        const type = os.type();
        //get total memory
        const ram = Math.round((os.totalmem() / 1000000) * 2) / 2;

        //get info for CPU and cores
        let cpu, n_cores = -1, cpu_speed;       // CPU Name, number of CPU cores, speed of slowest core

        const cpus = os.cpus();
        n_cores = cpus.length;

        const data = {
            'arch': arch,
            'hostname': hostname,
            'platform': platform,
            'distribution': '',
            'type': type,
            'memory': ram,
            'cpu': '',
            'cores': n_cores
        };

        for (let x = 0; x < n_cores; x++) {

            if (cpu === null || cpu === undefined || cpu === '') {
                data.cpu = cpus[x]['model'];
            }
            // (Mic-M) 10.Oct.20 - commented out since does not make sense in this context, as cpu_speed is undefined
            // if (cpu_speed > cpus[x]['speed'] || cpu_speed === null || cpu_speed === undefined || cpu_speed === '') {
            data[`cpu_core_${x}_speed`] = cpus[x]['speed'];
            //}
        }

        const dist = await _getDist(platform); //Distribution of OS
        if(!dist) throw(`No distribution found for platform '${platform}'`);
        data.distribution = dist[0];
        data.release = dist[1];

        const json = JSON.stringify(data);
        if (await _writeFileAsync(__dirname + '/system.json', json, { encoding: 'utf8', flag: 'w' })) {
            console.log(`File 'system.json' successfully created/updated.`);
            return data;
        } else {
            console.warn(`File 'system.json' could not be created/saved!`);
            return data;
        }

    } catch (error) {
        console.error(`getInfoAsync() - '${error}'`);
        return null;
    }


}

/**
 *
 * @param {string} path - File path
 * @param {string} data - Data to be written into file
 * @param {object|string} opt - Options, see https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback
 * @return {Promise<boolean>} true if successful, false if not.
 */
async function _writeFileAsync(path, data, opt) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, opt, (err) => {
            if (err) {
                console.error(`writeFileAsync(): ` + err);
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
  * @param {string} platform
  * @return {Promise<object|null>}
 */
async function _getDist(platform){

    try {

        switch (platform){

            case 'win32':
                return 'windows';
            case 'linux':
                let resLinux = await _execAsync('lsb_release -i -s');
                const resRelease = await _execAsync('lsb_release -r -s');
                if(!resLinux) throw(`error while executing 'lsb_release -i -s'`);
                if(!resRelease) throw(`error while executing 'lsb_release -r -s'`);
                resLinux = resLinux.replace('\n', '');
                const distris = ['Ubuntu', 'Debian', 'Zorin'];
                for(const lpDistri in distris){
                    const patt = new RegExp(distris[lpDistri], 'gmi');
                    if(patt.test(resLinux)){
                        return [distris[lpDistri], resRelease];
                    }
                }
                console.warn(`Could not get Linux distribution name (like 'Ubuntu' or 'Debian').`);
                return null;
            case 'android':
                const resAndroid = await _execAsync('getprop ro.build.version.release ');
                if(!resAndroid) throw(`error while executing 'getprop ro.build.version.release '`);
                let version = resAndroid.replace(/\.\d\.\d/g, '');
                version = version.replace('\n', '');
                return version;
            default:
                console.error(`No distribution found for platform '${platform}'`);
                return null;
        }
    } catch (error) {
        console.error(`_getDist() - Unexpected error: '${error}'`);
        return null;
    }
}



/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string|null>}
 */
function _execAsync(cmd) {
    return new Promise((resolve) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
                resolve(null);
            } else if (!error && stderr) {
                console.warn(stderr);
                resolve(null);
            } else {
                resolve(stdout);
            }
        });
    });
}


exports.getInfoAsync = getInfoAsync;
