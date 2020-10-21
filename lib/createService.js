const exec = require('child_process').exec;
const tools = require(__dirname + '/tools.js');
const fs = require('fs');

const ubuntu = '[Unit]\n Description=Makes this machine to a ioBroker drone\n After=network.target\n\n [Service]\n Type=simple\n User=root\n ExecStart=/usr/bin/node "/opt/iobroker-drones/main.js"\n Group=nogroup\n Environment=PATH=/usr/bin:/usr/local/bin:/usr/local/sbin:/usr/bin:/sbin:/bin:\n Environment=NODE_ENV=production\n WorkingDirectory=/opt/iobroker-drones\n Restart=always\n\n [Install]\n WantedBy=multi-user.target';


async function register(distribution){

    switch (distribution) {
        case 'Zorin':
        case 'Debian':
        case 'Ubuntu':
            console.log('Register ioBroker drones as a service on ' + distribution);
            let exists = await tools.fileExistsAsync('/etc/systemd/system/iobroker-drones.service');
            console.log('service file exists: ' + exists);

            if (!exists) {
                fs.writeFile('/etc/systemd/system/iobroker-drones.service', ubuntu, 'utf8', (err) => {
                    if (err) console.log(err);
                    exec('systemctl enable iobroker-drone.service', (error, stdout, stderr) => {
                        if (stdout) console.log(stdout);
                        if (error) console.log(error);
                        if (stderr) console.log(stderr);
                        exec('systemctl start iobroker-drones', (error, stdout, stderr) => {
                            if (stdout) console.log(stdout);
                            if (error) console.log(error);
                            if (stderr) console.log(stderr);
                            console.log('Restarting as services');
                            process.exit();
                        })
                    });
                });
            }
            break;
    }

}


exports.register = register;
