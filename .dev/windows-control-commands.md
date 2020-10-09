## Windows Control Adapter states

All [Windows control adapter](https://github.com/Mic-M/ioBroker.windows-control) states (info states and for sending key/command):

| ID / Name              | Datatype | Type (Info/Command) | Description |
|------------------------|----------|---------------------| ------------|
| _connection            | boolean  | Info                | Status of connection to end device (boolean) - updated all 600s and if a new request is sent                                                                  |
| processGetStatus       | string   | Command             | returns process status for a given process name (e.g. "chrome", or "firefox") to _processGetStatusResult                                                      |
| processGetStatusResult | string   | Info                | Return value of "processGetStatus", e.g.: [{"process":"chrome","status":"true","ts":1586686959883},{"process":"firefox","status":"false","ts":1586686951131}] |
| sendKey                | string   | Command             | Sends a key to device: 'CTRL', 'RCTRL', 'ALT', 'RALT', 'SHIFT', 'RSHIFT', 'WIN', 'RWIN', 'ESC', 'ENT', 'DEL', 'INS', 'VOLUP', 'VOLDN', 'MUTE', 'NEXT', 'PREV', 'PLAY', 'STOP', 'BACK', 'SPACE', 'TAB', 'NUMP', 'NUMS', 'NUMD', 'NUM*', 'NUMM', 'NUML', 'CAPS', 'END', 'HOME', 'PGDN', 'PGUP', 'SCRL', 'PRNTSCR', 'SLEEP', 'DOWN', 'UP', 'LEFT', 'RIGHT', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20', 'F21', 'F22', 'F23', 'F24', 'NUM0', 'NUM1', 'NUM2', 'NUM3', 'NUM4', 'NUM5', 'NUM6', 'NUM7', 'NUM8', 'NUM9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' |
| forceifhung            | boolean  | Command             | Send command: forceifhung - Close waiting and crashed applications. Dangerous. |
| logoff                 | boolean  | Command             | Send command: log off |
| reboot | boolean | Command | Send command: reboot |
| shutdown | boolean | Command | Send command: shutdown |
| hibernate | boolean | Command | Send command: hibernate - Write memory to disk and fall into deep sleep. |
| sleep | boolean | Command | Send command: sleep - Let the machine fall asleep. |
| monitor1 | boolean | Command | Send command: monitor 1 (switch monitor, same as WIN+P) |
| monitor2 | boolean | Command | Send command: monitor 2 |
| poweroff | boolean | Command | Send command: power off |