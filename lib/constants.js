'use strict';

module.exports = {

    distris: ['Ubuntu', 'Debian', 'Zorin', 'android', 'windows'],

    commands: {
        shutdown: {
            name: 'Shutdown',
            Debian: 'shutdown now',
            Ubuntu: 'shutdown now',
            Zorin: 'shutdown now',
            windows: 'shutdown'
        },
        reboot: {
            name: 'Reboot',
            Debian: 'shutdown -r now',
            Ubuntu: 'shutdown -r now',
            Zorin: 'shutdown -r now',
            windows: 'shutdown /r'
        },
        hibernate: {
            name: 'Hibernate',
            Debian: 'systemctl hibernate',
            Ubuntu: 'systemctl hibernate',
            Zorin: 'systemctl hibernate',
            windows: 'shutdown -h'
        },
        sleep: {name: 'Sleep', windows: 'rundll32.exe powrprof.dll,SetSuspendState'},
        lockScreen: {name: 'Lock Screen', windows: 'rundll32.exe user32.dll,LockWorkStation'},
        logoff: {name: 'Logoff', windows: 'logoff'},
    }

};
