package main

import (
	"encoding/json"
	"time"
)

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	PasswordHash []byte    `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
}

type PublicUser struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

func NewPublicUser(user *User) PublicUser {
	if user == nil {
		return PublicUser{}
	}
	return PublicUser{
		ID:          user.ID,
		Email:       user.Email,
		Name:        user.Name,
		Description: user.Description,
		CreatedAt:   user.CreatedAt,
	}
}

type Session struct {
	Token     string    `json:"token"`
	UserID    string    `json:"userId"`
	CreatedAt time.Time `json:"createdAt"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type ResourceType string

const (
	ResourceTypeProject   ResourceType = "project"
	ResourceTypeComponent ResourceType = "component"
	ResourceTypeNodeGraph ResourceType = "nodegraph"
)

type Project struct {
	ID           string          `json:"id"`
	OwnerID      string          `json:"ownerId"`
	ResourceType ResourceType    `json:"resourceType"`
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	MIR          json.RawMessage `json:"mir"`
	IsPublic     bool            `json:"isPublic"`
	StarsCount   int             `json:"starsCount"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
}

type ProjectSummary struct {
	ID           string       `json:"id"`
	ResourceType ResourceType `json:"resourceType"`
	Name         string       `json:"name"`
	Description  string       `json:"description"`
	IsPublic     bool         `json:"isPublic"`
	StarsCount   int          `json:"starsCount"`
	CreatedAt    time.Time    `json:"createdAt"`
	UpdatedAt    time.Time    `json:"updatedAt"`
}

type CommunityProjectSummary struct {
	ID           string       `json:"id"`
	ResourceType ResourceType `json:"resourceType"`
	Name         string       `json:"name"`
	Description  string       `json:"description"`
	AuthorID     string       `json:"authorId"`
	AuthorName   string       `json:"authorName"`
	StarsCount   int          `json:"starsCount"`
	CreatedAt    time.Time    `json:"createdAt"`
	UpdatedAt    time.Time    `json:"updatedAt"`
}

type CommunityProjectDetail struct {
	Project
	AuthorName string `json:"authorName"`
}
