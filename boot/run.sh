#!/bin/bash
cd "${0%/*}"
PATH=$PATH:/home/pi/gopath/bin
go run pf.go "${0%/*}" $1
