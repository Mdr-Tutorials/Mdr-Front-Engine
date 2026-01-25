package main

import "log"

func main() {
	cfg := LoadConfig()
	server := NewServer(cfg)
	if err := server.Run(); err != nil {
		log.Fatal(err)
	}
}
