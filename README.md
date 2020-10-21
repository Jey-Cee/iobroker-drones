The AIM of this module is to control Linux and Windows devices via ioBroker.

*Note:* Support for Apple, Android and likely other operating systems is within the future scope as well.

Goal of this module is also to replace ioBroker's [Windows Control Adapter](https://github.com/Mic-M/ioBroker.windows-control) by a reliable, slim, open source, secure and scalable solution, and to get rid of the "GetAdmin.exe" tool dependence.

This module is in an early development phase; please stay tuned and follow our progress.


## Installation
The socketio adapter has to be installed on your ioBroker system.
Make sure nodejs v12.x is installed on your system.

### Windows
**TO DO:** Describe installation windows

### Ubuntu, Debian and derivates
Open a Terminal and past this code into it:
`cd /opt && sudo wget --no-cache "https://raw.githubusercontent.com/Jey-Cee/iobroker-drones/master/install.sh" -O install.sh && sudo chmod +x install.sh && sudo ./install.sh`

This will download and install the drone, during the installation process you have to enter some things.
Now the drone is installed as a sevice and starts on boot.

## ioBroker Objects to control the end devices

**TO DO:** Describe the objects / states. Also, describe "native" for device information, ref. https://forum.iobroker.net/topic/36837/das-volle-potential-der-objekte-nutzen


## Changelog

**TO DO:** Changelog documentation


## License
MIT License

Copyright (c) 2020 Jey Cee <jey-cee@live.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
