#!/bin/bash
cd "${0%/*}"
cd "../"
go run go/piframe.go web ~/gdrive/FamilyPictureFrame
