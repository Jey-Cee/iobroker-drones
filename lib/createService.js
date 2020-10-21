const exec = require('child_process').exec;
const tools = require(__dirname + '/tools.js');
const fs = require('fs');

const ubuntu = '[Unit]\n Description=makes this machine to a ioBroker drone\n After=network.target\n\n [Service]\n Type=simple\n User=root\n ExecStart=/usr/bin/node "' + __dirname + '/../main.js"\n Restart=on-failure\n\n [Install]\n WantedBy=multi-user.target';


async function register(distribution){

    switch (distribution) {
        case 'Zorin':
        case 'Debian':
        case 'Ubuntu':
            console.log('Register ioBroker drone as a service on ' + distribution);
            let exists = await tools.fileExistsAsync('/etc/systemd/system/iobroker-drone.service');
            console.log('service file exists: ' + exists);

            if (!exists) {
                fs.writeFile('/etc/systemd/system/iobroker-drone.service', ubuntu, 'utf8', (err) => {
                    if (err) console.log(err);
                    exec('systemctl enable iobroker-drone.service', (error, stdout, stderr) => {
                        if (stdout) console.log(stdout);
                        if (error) console.log(error);
                        if (stderr) console.log(stderr);
                        exec('systemctl start iobroker-drone', (error, stdout, stderr) => {
                            if (stdout) console.log(stdout);
                            if (error) console.log(error);
                            if (stderr) console.log(stderr);
                            console.log('Restarting as service');
                            process.exit();
                        })
                    });
                });
            }
            break;
    }

}


exports.register = register;
