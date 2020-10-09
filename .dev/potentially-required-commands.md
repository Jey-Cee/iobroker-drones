## Potentially required commands

| ID / Name              | Description | Linux | Windows | 
|----------------------- | ------------| ----- | ------- |
| logoff                 | log off     | ✓ | ✓ |
| reboot | reboot | ✓ | ✓ |
| shutdown | shutdown | ✓ | ✓ |
| hibernate | write memory to disk and fall into deep sleep. - equal to `shutdown -h` in Windows console | - | ✓ |
| sleep | Let the machine fall asleep. | ✓ | ✓ |
| isProcessAlive | returns alive status of a process (true/false) (note: return written into an ioBroker state as JSON, like: `[{"process":"chrome","isAlive":"true","ts":1586686959883},{"process":"firefox","isAlive":"false","ts":1586686951131}]` |  ✓ | ✓ |
| sendKey | Sends a key to the device. **TODO:** Review following keys and add/delete/change keys: 'CTRL', 'RCTRL', 'ALT', 'RALT', 'SHIFT', 'RSHIFT', 'WIN', 'RWIN', 'ESC', 'ENT', 'DEL', 'INS', 'VOLUP', 'VOLDN', 'MUTE', 'NEXT', 'PREV', 'PLAY', 'STOP', 'BACK', 'SPACE', 'TAB', 'NUMP', 'NUMS', 'NUMD', 'NUM*', 'NUMM', 'NUML', 'CAPS', 'END', 'HOME', 'PGDN', 'PGUP', 'SCRL', 'PRNTSCR', 'SLEEP', 'DOWN', 'UP', 'LEFT', 'RIGHT', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20', 'F21', 'F22', 'F23', 'F24', 'NUM0', 'NUM1', 'NUM2', 'NUM3', 'NUM4', 'NUM5', 'NUM6', 'NUM7', 'NUM8', 'NUM9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' |

