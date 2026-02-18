package config

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
	DatabaseURL    string
	DBMaxOpenConns int
	DBMaxIdleConns int
	DBMaxLifetime  time.Duration
}

func LoadConfig() Config {
	address := getEnv("BACKEND_ADDR", ":8080")
	tokenTTL := getEnvDuration("BACKEND_TOKEN_TTL", 24*time.Hour)
	allowed := parseCSV(getEnv("BACKEND_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174"))
	databaseURL := getEnv("BACKEND_DB_URL", "postgres://postgres:postgres@localhost:5432/mdr_front_engine?sslmode=disable")
	dbMaxOpenConns := getEnvInt("BACKEND_DB_MAX_OPEN_CONNS", 10)
	dbMaxIdleConns := getEnvInt("BACKEND_DB_MAX_IDLE_CONNS", 5)
	dbMaxLifetime := getEnvDuration("BACKEND_DB_MAX_LIFETIME", 30*time.Minute)
	return Config{
		Address:        address,
		TokenTTL:       tokenTTL,
		AllowedOrigins: allowed,
		DatabaseURL:    databaseURL,
		DBMaxOpenConns: dbMaxOpenConns,
		DBMaxIdleConns: dbMaxIdleConns,
		DBMaxLifetime:  dbMaxLifetime,
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

func getEnvInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}
