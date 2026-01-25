package main

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Address        string
	TokenTTL       time.Duration
	AllowedOrigins []string
}

func LoadConfig() Config {
	address := getEnv("BACKEND_ADDR", ":8080")
	tokenTTL := getEnvDuration("BACKEND_TOKEN_TTL", 24*time.Hour)
	allowed := parseCSV(getEnv("BACKEND_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174"))
	return Config{
		Address:        address,
		TokenTTL:       tokenTTL,
		AllowedOrigins: allowed,
	}
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	if parsed, err := time.ParseDuration(value); err == nil {
		return parsed
	}
	if seconds, err := strconv.Atoi(value); err == nil {
		return time.Duration(seconds) * time.Second
	}
	return fallback
}

func parseCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
