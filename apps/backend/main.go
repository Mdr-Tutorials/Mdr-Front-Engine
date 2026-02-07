package main

import "log"

func main() {
	cfg := LoadConfig()
	server, err := NewServer(cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if closeErr := server.Close(); closeErr != nil {
			log.Printf("close database: %v", closeErr)
		}
	}()
	if runErr := server.Run(); runErr != nil {
		log.Fatal(runErr)
	}
}
