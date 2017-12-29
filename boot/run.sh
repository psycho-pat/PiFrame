#!/bin/bash
cd ~/gdrive/FamilyPictureFrame
exifautotran *
cd "${0%/*}"
cd "../"
go run go/piframe.go web ~/gdrive/FamilyPictureFrame
