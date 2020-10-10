'use strict';

module.exports = {

    distris: ['ubuntu', 'debian', 'android', 'windows'],

    commands: {
        shutdown: {name: 'Shutdown', debian:'shutdown now', ubuntu:'shutdown now', windows:'shutdown'},
        reboot: {name: 'Reboot', debian:'shutdown -r now', ubuntu:'shutdown -r now', windows:'shutdown /r'},
        hibernate: {name: 'Hibernate', debian:'systemctl hibernate', ubuntu:'systemctl hibernate', windows:'shutdown -h'},
        sleep: {name: 'Sleep', windows:'rundll32.exe powrprof.dll,SetSuspendState'},
        lockScreen: {name: 'Lock Screen', windows:'rundll32.exe user32.dll,LockWorkStation'},
        logoff: {name: 'Logoff', windows:'logoff'},
    }
     
};