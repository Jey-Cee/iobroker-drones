const exec = require('child_process').exec;
const fs = require('fs');

let ubuntu = '[Unit]\n Description=makes this machine to a ioBroker drone\n After=network.target\n\n [Service]\n Type=simple\n User=root\n ExecStart=/usr/bin/node "' + __dirname + '/../main.js"\n Restart=on-failure\n\n [Install]\n WantedBy=multi-user.target';


function register(distribution){
        console.log('register ' + distribution);
        switch(distribution){
        case 'ubuntu':

            let check = exec('systemctl status iobroker-drone.service', (error, stdout, stderr)=>{
                if (error){console.log(error)};
                if(stderr){console.log(stderr)};
                let patt = new RegExp('not-found', 'gmi');
                let res = patt.test(stdout);
                if(res){
                    fs.writeFile('/etc/systemd/system/iobroker-drone.service', ubuntu,'utf8', (err)=>{
                        if (err){console.log(err)};
                        let enable = exec('systemctl enable iobroker-drone.service', (error, stdout, stderr)=>{
                            if (error){console.log(error)};
                            if(stderr){console.log(error)};
                        })
                    })
                }
            });
            break;
    }
}

exports.register = register;