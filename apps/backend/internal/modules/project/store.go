package project

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

var defaultMIRDocument = json.RawMessage(`{"version":"1.0","ui":{"root":{"id":"root","type":"container"}}}`)

type ProjectStore struct {
	db *sql.DB
}

type CommunityListOptions struct {
	Keyword      string
	ResourceType ResourceType
	Sort         string
	Page         int
	PageSize     int
}

func NewProjectStore(db *sql.DB) *ProjectStore {
	return &ProjectStore{db: db}
}

func (store *ProjectStore) Create(ownerID, name, description string, resourceType ResourceType, isPublic bool, mir json.RawMessage) (*Project, error) {
	resourceType = normalizeResourceType(resourceType)
	if !isValidResourceType(resourceType) {
		return nil, ErrInvalidResourceType
	}

	normalizedMir, err := normalizeMIR(mir)
	if err != nil {
		return nil, err
	}

	project := &Project{
		ID:           newID("prj"),
		OwnerID:      ownerID,
		ResourceType: resourceType,
		Name:         strings.TrimSpace(name),
		Description:  strings.TrimSpace(description),
		MIR:          normalizedMir,
		IsPublic:     isPublic,
		StarsCount:   0,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `INSERT INTO projects (id, owner_id, resource_type, name, description, mir_json, is_public, stars_count, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, 0, $8, $9)`
	_, err = store.db.ExecContext(ctx, query,
		project.ID,
		project.OwnerID,
		project.ResourceType,
		project.Name,
		project.Description,
		string(project.MIR),
		project.IsPublic,
		project.CreatedAt,
		project.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return project, nil
}

func (store *ProjectStore) ListByOwner(ownerID string) ([]ProjectSummary, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `SELECT id, resource_type, name, description, is_public, stars_count, created_at, updated_at
FROM projects
WHERE owner_id = $1
ORDER BY updated_at DESC, created_at DESC`

	rows, err := store.db.QueryContext(ctx, query, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := make([]ProjectSummary, 0)
	for rows.Next() {
		var summary ProjectSummary
		if err := rows.Scan(
			&summary.ID,
			&summary.ResourceType,
			&summary.Name,
			&summary.Description,
			&summary.IsPublic,
			&summary.StarsCount,
			&summary.CreatedAt,
			&summary.UpdatedAt,
		); err != nil {
			return nil, err
		}
		projects = append(projects, summary)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return projects, nil
}

func (store *ProjectStore) GetByID(ownerID, projectID string) (*Project, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `SELECT id, owner_id, resource_type, name, description, mir_json, is_public, stars_count, created_at, updated_at
FROM projects
WHERE owner_id = $1 AND id = $2`

	row := store.db.QueryRowContext(ctx, query, ownerID, projectID)
	project, err := scanProject(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return project, nil
}

func (store *ProjectStore) SaveMIR(ownerID, projectID string, mir json.RawMessage) (*Project, error) {
	normalizedMir, err := normalizeMIR(mir)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `UPDATE projects
SET mir_json = $3::jsonb, updated_at = NOW()
WHERE owner_id = $1 AND id = $2
RETURNING id, owner_id, resource_type, name, description, mir_json, is_public, stars_count, created_at, updated_at`

	row := store.db.QueryRowContext(ctx, query, ownerID, projectID, string(normalizedMir))
	project, err := scanProject(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return project, nil
}

func (store *ProjectStore) SetPublic(ownerID, projectID string, isPublic bool) (*Project, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `UPDATE projects
SET is_public = $3, updated_at = NOW()
WHERE owner_id = $1 AND id = $2
RETURNING id, owner_id, resource_type, name, description, mir_json, is_public, stars_count, created_at, updated_at`

	row := store.db.QueryRowContext(ctx, query, ownerID, projectID, isPublic)
	project, err := scanProject(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return project, nil
}

func (store *ProjectStore) Delete(ownerID, projectID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `DELETE FROM projects WHERE owner_id = $1 AND id = $2`
	result, err := store.db.ExecContext(ctx, query, ownerID, projectID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrProjectNotFound
	}
	return nil
}

func scanProject(scanner interface{ Scan(dest ...any) error }) (*Project, error) {
	project := &Project{}
	var mirBytes []byte
	err := scanner.Scan(
		&project.ID,
		&project.OwnerID,
		&project.ResourceType,
		&project.Name,
		&project.Description,
		&mirBytes,
		&project.IsPublic,
		&project.StarsCount,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if len(mirBytes) == 0 {
		project.MIR = defaultMIRDocument
	} else {
		project.MIR = json.RawMessage(mirBytes)
	}
	return project, nil
}

func (store *ProjectStore) ListPublic(options CommunityListOptions) ([]CommunityProjectSummary, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if options.Page <= 0 {
		options.Page = 1
	}
	if options.PageSize <= 0 {
		options.PageSize = 20
	}
	if options.PageSize > 100 {
		options.PageSize = 100
	}

	sortOrder := "p.updated_at DESC, p.created_at DESC"
	if strings.EqualFold(strings.TrimSpace(options.Sort), "popular") {
		sortOrder = "p.stars_count DESC, p.updated_at DESC, p.created_at DESC"
	}

	clauses := []string{"p.is_public = TRUE"}
	args := make([]any, 0, 4)
	argIndex := 1

	if keyword := strings.TrimSpace(options.Keyword); keyword != "" {
		pattern := "%" + keyword + "%"
		clauses = append(
			clauses,
			fmt.Sprintf("(p.name ILIKE $%d OR p.description ILIKE $%d OR u.name ILIKE $%d)", argIndex, argIndex, argIndex),
		)
		args = append(args, pattern)
		argIndex++
	}

	resourceType := normalizeResourceType(options.ResourceType)
	if resourceType != "" {
		if !isValidResourceType(resourceType) {
			return nil, ErrInvalidResourceType
		}
		clauses = append(clauses, fmt.Sprintf("p.resource_type = $%d", argIndex))
		args = append(args, resourceType)
		argIndex++
	}

	limitArg := fmt.Sprintf("$%d", argIndex)
	offsetArg := fmt.Sprintf("$%d", argIndex+1)
	args = append(args, options.PageSize, (options.Page-1)*options.PageSize)

	query := `SELECT p.id, p.resource_type, p.name, p.description, p.owner_id, u.name, p.stars_count, p.created_at, p.updated_at
FROM projects p
JOIN users u ON u.id = p.owner_id
WHERE ` + strings.Join(clauses, " AND ") + `
ORDER BY ` + sortOrder + `
LIMIT ` + limitArg + ` OFFSET ` + offsetArg

	rows, err := store.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := make([]CommunityProjectSummary, 0)
	for rows.Next() {
		var summary CommunityProjectSummary
		if err := rows.Scan(
			&summary.ID,
			&summary.ResourceType,
			&summary.Name,
			&summary.Description,
			&summary.AuthorID,
			&summary.AuthorName,
			&summary.StarsCount,
			&summary.CreatedAt,
			&summary.UpdatedAt,
		); err != nil {
			return nil, err
		}
		projects = append(projects, summary)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return projects, nil
}

func (store *ProjectStore) GetPublicByID(projectID string) (*CommunityProjectDetail, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	const query = `SELECT p.id, p.owner_id, p.resource_type, p.name, p.description, p.mir_json, p.is_public, p.stars_count, p.created_at, p.updated_at, u.name
FROM projects p
JOIN users u ON u.id = p.owner_id
WHERE p.id = $1 AND p.is_public = TRUE`

	var detail CommunityProjectDetail
	var mirBytes []byte
	err := store.db.QueryRowContext(ctx, query, projectID).Scan(
		&detail.ID,
		&detail.OwnerID,
		&detail.ResourceType,
		&detail.Name,
		&detail.Description,
		&mirBytes,
		&detail.IsPublic,
		&detail.StarsCount,
		&detail.CreatedAt,
		&detail.UpdatedAt,
		&detail.AuthorName,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	if len(mirBytes) == 0 {
		detail.MIR = defaultMIRDocument
	} else {
		detail.MIR = json.RawMessage(mirBytes)
	}
	return &detail, nil
}

func ParsePositiveInt(value string, fallback int) int {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(trimmed)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func normalizeMIR(mir json.RawMessage) (json.RawMessage, error) {
	if len(mir) == 0 || strings.TrimSpace(string(mir)) == "" {
		return defaultMIRDocument, nil
	}
	var payload map[string]any
	if err := json.Unmarshal(mir, &payload); err != nil {
		return nil, err
	}
	normalized, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return normalized, nil
}

func normalizeResourceType(resourceType ResourceType) ResourceType {
	return ResourceType(strings.TrimSpace(strings.ToLower(string(resourceType))))
}

func isValidResourceType(resourceType ResourceType) bool {
	switch resourceType {
	case ResourceTypeProject, ResourceTypeComponent, ResourceTypeNodeGraph:
		return true
	default:
		return false
	}
}
