package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	//"os/dir"
	"path/filepath"
	//"io/ioutil"
)

var webImagePath = "/images/"
var path = os.Args[1]
var picturePath = os.Args[2]

func shutDownPframe(w http.ResponseWriter, r *http.Request) {
	//cmd := exec.Command("poweroff")
	cmd := exec.Command("sudo", "poweroff")
	//cmd.Dir = picturePath
	err := cmd.Start()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Shutdown via interface")
	err = cmd.Wait()
}

func pullDrive() {
	cmd := exec.Command("drive", "pull", "-quiet")
	//cmd := exec.Command("gdrive", "download", "--recursive", "0B6PafHSZe3PRZ2xxbTRuZ3FMeUk", "--skip")
	cmd.Dir = picturePath
	err := cmd.Start()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Pulling new files")
	err = cmd.Wait()
	fmt.Println("Finished pulling")
}

func updateAndGetImages(w http.ResponseWriter, r *http.Request) {
	pullDrive()
	getImages(w, r)
}

func getImages(w http.ResponseWriter, r *http.Request) {
	keys, _ := r.URL.Query()["folder"]
	folder := keys[0]
	pictureList, _ := filepath.Glob(picturePath + "/" + folder + "/*")
	//fmt.Println(pictureList)
	pics := make([]string, len(pictureList))
	for i := range pictureList {
		pics[i] = webImagePath + "/" + folder + "/" + filepath.Base(pictureList[i])
	}
	res, _ := json.Marshal(pics)

	fmt.Fprintf(w, string(res))
}

func main() {
	http.Handle(webImagePath, http.StripPrefix(webImagePath, http.FileServer(http.Dir(picturePath))))
	http.Handle("/", http.FileServer(http.Dir(path)))
	http.Handle("/getImages", http.HandlerFunc(getImages))
	http.Handle("/shutDownPframe", http.HandlerFunc(shutDownPframe))
	http.Handle("/updateAndGetImages", http.HandlerFunc(updateAndGetImages))
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
