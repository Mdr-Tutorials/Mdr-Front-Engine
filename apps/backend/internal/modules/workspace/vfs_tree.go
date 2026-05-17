package workspace

import (
	"encoding/json"
	"fmt"
	"path"
	"regexp"
	"sort"
	"strings"
)

type workspaceVFSNode struct {
	ID       string   `json:"id"`
	Kind     string   `json:"kind"`
	Name     string   `json:"name"`
	ParentID *string  `json:"parentId"`
	Children []string `json:"children,omitempty"`
	DocID    string   `json:"docId,omitempty"`
}

type workspaceVFSTree struct {
	TreeRootID string                      `json:"treeRootId"`
	TreeByID   map[string]workspaceVFSNode `json:"treeById"`
}

type codeDocumentMount struct {
	DocumentID string
	NodeID     string
	Path       string
	Name       string
}

var nonIdentifierPathChars = regexp.MustCompile(`[^a-zA-Z0-9_-]+`)

func normalizeWorkspacePath(value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", fmt.Errorf("%w: workspace document path is required", ErrWorkspaceVFSInvalid)
	}
	normalized := path.Clean("/" + strings.TrimLeft(strings.ReplaceAll(trimmed, "\\", "/"), "/"))
	if normalized == "/" {
		return "", fmt.Errorf("%w: workspace document path must include a file name", ErrWorkspaceVFSInvalid)
	}
	return normalized, nil
}

func normalizeComparablePath(value string) string {
	normalized, err := normalizeWorkspacePath(value)
	if err != nil {
		return strings.TrimSpace(value)
	}
	return normalized
}

func workspacePathName(value string) string {
	name := path.Base(value)
	if name == "." || name == "/" {
		return ""
	}
	return name
}

func makeTreeString(value string) *string {
	result := value
	return &result
}

func makePathNodeID(prefix string, segments []string) string {
	if len(segments) == 0 {
		return prefix
	}
	parts := make([]string, 0, len(segments))
	for _, segment := range segments {
		clean := strings.Trim(nonIdentifierPathChars.ReplaceAllString(segment, "_"), "_")
		if clean == "" {
			clean = "item"
		}
		parts = append(parts, clean)
	}
	return prefix + "_" + strings.Join(parts, "_")
}

func defaultWorkspaceVFSTree(rootID string) workspaceVFSTree {
	if strings.TrimSpace(rootID) == "" {
		rootID = "root"
	}
	return workspaceVFSTree{
		TreeRootID: rootID,
		TreeByID: map[string]workspaceVFSNode{
			rootID: {
				ID:       rootID,
				Kind:     "dir",
				Name:     "/",
				ParentID: nil,
				Children: []string{},
			},
		},
	}
}

func parseWorkspaceVFSTree(
	treeJSON json.RawMessage,
	rootID string,
	existingDocuments []WorkspaceDocumentRecord,
) (workspaceVFSTree, error) {
	var decoded struct {
		TreeRootID string                      `json:"treeRootId"`
		TreeByID   map[string]workspaceVFSNode `json:"treeById"`
	}
	if len(treeJSON) > 0 && strings.TrimSpace(string(treeJSON)) != "" {
		if err := json.Unmarshal(treeJSON, &decoded); err != nil {
			return workspaceVFSTree{}, err
		}
	}

	if strings.TrimSpace(decoded.TreeRootID) != "" && len(decoded.TreeByID) > 0 {
		tree := workspaceVFSTree{
			TreeRootID: strings.TrimSpace(decoded.TreeRootID),
			TreeByID:   decoded.TreeByID,
		}
		if _, ok := tree.TreeByID[tree.TreeRootID]; !ok {
			return workspaceVFSTree{}, fmt.Errorf("%w: treeRootId does not exist in treeById", ErrWorkspaceVFSInvalid)
		}
		return tree, nil
	}

	tree := defaultWorkspaceVFSTree(rootID)
	documents := append([]WorkspaceDocumentRecord(nil), existingDocuments...)
	sort.Slice(documents, func(left, right int) bool {
		return documents[left].Path < documents[right].Path
	})
	for _, document := range documents {
		normalizedPath, err := normalizeWorkspacePath(document.Path)
		if err != nil {
			return workspaceVFSTree{}, err
		}
		nodeID := makePathNodeID("doc", []string{document.ID})
		if err := tree.addDocument(codeDocumentMount{
			DocumentID: document.ID,
			NodeID:     nodeID,
			Path:       normalizedPath,
			Name:       workspacePathName(normalizedPath),
		}); err != nil {
			return workspaceVFSTree{}, err
		}
	}
	return tree, nil
}

func (tree workspaceVFSTree) marshal() (json.RawMessage, error) {
	payload, err := json.Marshal(tree)
	if err != nil {
		return nil, err
	}
	return json.RawMessage(payload), nil
}

func (tree workspaceVFSTree) addDocument(mount codeDocumentMount) error {
	normalizedPath, err := normalizeWorkspacePath(mount.Path)
	if err != nil {
		return err
	}
	segments := strings.Split(strings.Trim(normalizedPath, "/"), "/")
	fileName := strings.TrimSpace(mount.Name)
	if fileName == "" {
		fileName = segments[len(segments)-1]
	}
	if fileName != segments[len(segments)-1] {
		return fmt.Errorf("%w: document name must match path base name", ErrWorkspaceVFSInvalid)
	}

	parentID, err := tree.ensureDirectories(segments[:len(segments)-1])
	if err != nil {
		return err
	}
	parent := tree.TreeByID[parentID]
	if parent.Kind != "dir" {
		return fmt.Errorf("%w: parent node must be a directory", ErrWorkspaceVFSInvalid)
	}
	for _, childID := range parent.Children {
		child := tree.TreeByID[childID]
		if child.Name == fileName {
			return fmt.Errorf("%w: workspace path already exists", ErrWorkspaceVFSInvalid)
		}
	}
	nodeID := strings.TrimSpace(mount.NodeID)
	if nodeID == "" {
		nodeID = makePathNodeID("doc", segments)
	}
	if _, exists := tree.TreeByID[nodeID]; exists {
		return fmt.Errorf("%w: node id already exists", ErrWorkspaceVFSInvalid)
	}
	tree.TreeByID[nodeID] = workspaceVFSNode{
		ID:       nodeID,
		Kind:     "doc",
		Name:     fileName,
		ParentID: makeTreeString(parentID),
		DocID:    strings.TrimSpace(mount.DocumentID),
	}
	parent.Children = append(parent.Children, nodeID)
	tree.TreeByID[parentID] = parent
	return nil
}

func (tree workspaceVFSTree) ensureDirectories(segments []string) (string, error) {
	currentID := tree.TreeRootID
	for index, segment := range segments {
		name := strings.TrimSpace(segment)
		if name == "" {
			return "", fmt.Errorf("%w: directory name is required", ErrWorkspaceVFSInvalid)
		}
		current := tree.TreeByID[currentID]
		if current.Kind != "dir" {
			return "", fmt.Errorf("%w: parent node must be a directory", ErrWorkspaceVFSInvalid)
		}
		var nextID string
		for _, childID := range current.Children {
			child := tree.TreeByID[childID]
			if child.Name != name {
				continue
			}
			if child.Kind != "dir" {
				return "", fmt.Errorf("%w: path segment already exists as a document", ErrWorkspaceVFSInvalid)
			}
			nextID = childID
			break
		}
		if nextID == "" {
			nextID = makePathNodeID("dir", segments[:index+1])
			if _, exists := tree.TreeByID[nextID]; exists {
				return "", fmt.Errorf("%w: directory node id already exists", ErrWorkspaceVFSInvalid)
			}
			tree.TreeByID[nextID] = workspaceVFSNode{
				ID:       nextID,
				Kind:     "dir",
				Name:     name,
				ParentID: makeTreeString(currentID),
				Children: []string{},
			}
			current.Children = append(current.Children, nextID)
			tree.TreeByID[currentID] = current
		}
		currentID = nextID
	}
	return currentID, nil
}
