const exec = require('child_process').exec;
const fs = require('fs');

const ubuntu = '[Unit]\n Description=makes this machine to a ioBroker drone\n After=network.target\n\n [Service]\n Type=simple\n User=root\n ExecStart=/usr/bin/node "' + __dirname + '/../main.js"\n Restart=on-failure\n\n [Install]\n WantedBy=multi-user.target';


function register(distribution){

    switch (distribution) {
        case 'ubuntu':
            console.log('register ' + distribution);
            exec('systemctl status iobroker-drone.service', (error, stdout, stderr) => {
                if (error)  console.log(error);
                if (stderr) console.log(stderr);
                const patt = new RegExp('not-found', 'gmi');
                const res = patt.test(stdout);
                if (res) {
                    fs.writeFile('/etc/systemd/system/iobroker-drone.service', ubuntu, 'utf8', (err) => {
                        if (err) console.log(err);
                        exec('systemctl enable iobroker-drone.service', (error, stdout, stderr) => {
                            if (error) console.log(error);
                            if (stderr) console.log(error);
                        });
                    });
                }
            });
            break;
    }

}

exports.register = register;