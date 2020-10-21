#!/bin/bash

wget "https://github.com/Jey-Cee/iobroker-drones/archive/0.0.1.tar.gz" -O temp.tar.gz
tar -xzf temp.tar.gz
rm temp.tar.gz
mv iobroker-drones-0.0.2 iobroker-drones
cd iobroker-drones
npm install
node main.js

