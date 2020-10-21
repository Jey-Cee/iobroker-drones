#!/bin/bash

rm -R /opt/iobroker-drones
systemctl stop iobroker-drones
rm /etc/systemd/system/iobroker-drones.service
systemctl daemon-reload
