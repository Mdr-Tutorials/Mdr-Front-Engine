import { describe, expect, it } from 'vitest';
import {
  createAuthoringDiagnosticProviderRegistry,
  createAuthoringEnvironment,
  createCodeArtifactProviderRegistry,
  createCodeSymbolProviderRegistry,
  createEmptyAuthoringEnvironment,
} from '@/authoring';
import { createDiagnostic, COD_DIAGNOSTIC_DEFINITIONS } from '@/diagnostics';
import type {
  AuthoringContext,
  AuthoringDiagnosticProvider,
  CodeArtifact,
  CodeArtifactProvider,
  CodeScope,
  CodeSymbol,
  CodeSymbolProvider,
} from '@/authoring';

describe('authoring environment contract', () => {
  it('keeps code artifacts, symbols, and scopes addressable by stable owners', () => {
    const artifact: CodeArtifact = {
      id: 'artifact-1',
      language: 'ts',
      owner: {
        kind: 'inspector-field',
        documentId: 'doc-1',
        nodeId: 'node-1',
        fieldPath: 'events.onClick',
      },
      source: 'return $state.count;',
      revision: 'rev-1',
    };

    const scope: CodeScope = {
      id: 'scope-node-1',
      kind: 'mir-node',
      ownerRef: {
        kind: 'mir-node',
        documentId: 'doc-1',
        nodeId: 'node-1',
      },
    };

    const symbol: CodeSymbol = {
      id: 'symbol-count',
      name: '$state.count',
      kind: 'state',
      source: { kind: 'mir', documentId: 'doc-1' },
      scopeId: scope.id,
      targetRef: scope.ownerRef,
    };

    expect(artifact.owner).toMatchObject({
      kind: 'inspector-field',
      fieldPath: 'events.onClick',
    });
    expect(symbol).toMatchObject({
      id: 'symbol-count',
      scopeId: 'scope-node-1',
      targetRef: { kind: 'mir-node', nodeId: 'node-1' },
    });
  });

  it('provides a safe empty implementation for early adapters', () => {
    const environment = createEmptyAuthoringEnvironment('rev-empty');
    const context = { surface: 'code-editor' as const };
    const reference = { name: '$state.count' };

    expect(environment.revision).toBe('rev-empty');
    expect(environment.querySymbols(context)).toEqual([]);
    expect(environment.resolveReference(reference, context)).toBeNull();
    expect(environment.getCompletions(context)).toEqual([]);
    expect(environment.getDiagnostics(context)).toEqual([]);
    expect(environment.getDefinition(reference, context)).toBeNull();
    expect(environment.getReferences('symbol-count', context)).toEqual([]);
  });

  it('registers code artifact providers without depending on editor internals', () => {
    const context: AuthoringContext = {
      surface: 'inspector',
      targetRef: {
        kind: 'inspector-field',
        documentId: 'doc-1',
        nodeId: 'node-1',
        fieldPath: 'events.onClick',
      },
    };
    const artifact: CodeArtifact = {
      id: 'artifact-inspector-on-click',
      language: 'ts',
      owner: context.targetRef,
      source: 'return true;',
      revision: 'rev-1',
    };
    const provider: CodeArtifactProvider = {
      id: 'test-provider',
      source: { kind: 'code', artifactId: artifact.id },
      listArtifacts: (inputContext) =>
        inputContext.surface === 'inspector' ? [artifact] : [],
      getArtifact: (id) => (id === artifact.id ? artifact : null),
    };
    const registry = createCodeArtifactProviderRegistry();

    registry.register(provider);

    expect(registry.listProviders()).toEqual([provider]);
    expect(registry.listArtifacts(context)).toEqual([artifact]);
    expect(registry.getArtifact(artifact.id)).toBe(artifact);
    expect(registry.getArtifact('missing-artifact')).toBeNull();

    registry.unregister(provider.id);

    expect(registry.listProviders()).toEqual([]);
    expect(registry.listArtifacts(context)).toEqual([]);
    expect(registry.getArtifact(artifact.id)).toBeNull();
  });

  it('registers code symbol providers without depending on editor internals', () => {
    const context: AuthoringContext = {
      surface: 'code-editor',
      scopeId: 'scope-doc-1',
    };
    const scope: CodeScope = {
      id: 'scope-doc-1',
      kind: 'document',
      ownerRef: { kind: 'document', documentId: 'doc-1' },
    };
    const symbol: CodeSymbol = {
      id: 'symbol-route-id',
      name: 'routeId',
      kind: 'route',
      source: { kind: 'route', routeId: 'route-1' },
      scopeId: scope.id,
      targetRef: { kind: 'route', routeId: 'route-1' },
    };
    const provider: CodeSymbolProvider = {
      id: 'test-symbol-provider',
      source: { kind: 'route', routeId: 'route-1' },
      listSymbols: (inputContext) =>
        inputContext.scopeId === scope.id ? [symbol] : [],
      listScopes: () => [scope],
      getSymbol: (id) => (id === symbol.id ? symbol : null),
    };
    const registry = createCodeSymbolProviderRegistry();

    registry.register(provider);

    expect(registry.listProviders()).toEqual([provider]);
    expect(registry.listSymbols(context)).toEqual([symbol]);
    expect(registry.listScopes(context)).toEqual([scope]);
    expect(registry.getSymbol(symbol.id)).toBe(symbol);
    expect(registry.getSymbol('missing-symbol')).toBeNull();

    registry.unregister(provider.id);

    expect(registry.listProviders()).toEqual([]);
    expect(registry.listSymbols(context)).toEqual([]);
    expect(registry.listScopes(context)).toEqual([]);
    expect(registry.getSymbol(symbol.id)).toBeNull();
  });

  it('registers diagnostic providers without deciding UI behavior', () => {
    const context: AuthoringContext = {
      surface: 'code-editor',
      artifactId: 'artifact-1',
    };
    const diagnostic = createDiagnostic({
      ...COD_DIAGNOSTIC_DEFINITIONS.COD_1001,
      message: 'Code parse failed.',
      sourceSpan: {
        artifactId: 'artifact-1',
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 4,
      },
    });
    const provider: AuthoringDiagnosticProvider = {
      id: 'test-diagnostic-provider',
      source: { kind: 'code', artifactId: 'artifact-1' },
      getDiagnostics: (inputContext) =>
        inputContext.artifactId === 'artifact-1' ? [diagnostic] : [],
    };
    const registry = createAuthoringDiagnosticProviderRegistry();

    registry.register(provider);

    expect(registry.listProviders()).toEqual([provider]);
    expect(registry.getDiagnostics(context)).toEqual([diagnostic]);
    expect(registry.getDiagnostics({ surface: 'code-editor' })).toEqual([]);

    registry.unregister(provider.id);

    expect(registry.listProviders()).toEqual([]);
    expect(registry.getDiagnostics(context)).toEqual([]);
  });

  it('composes symbol and diagnostic registries into an authoring environment', () => {
    const context: AuthoringContext = {
      surface: 'code-editor',
      scopeId: 'scope-doc-1',
      artifactId: 'artifact-1',
    };
    const symbol: CodeSymbol = {
      id: 'symbol-count',
      name: '$state.count',
      kind: 'state',
      source: { kind: 'mir', documentId: 'doc-1' },
      scopeId: 'scope-doc-1',
      typeRef: 'number',
    };
    const diagnostic = createDiagnostic({
      ...COD_DIAGNOSTIC_DEFINITIONS.COD_2001,
      message: 'Symbol cannot be resolved.',
    });
    const symbolRegistry = createCodeSymbolProviderRegistry();
    const diagnosticRegistry = createAuthoringDiagnosticProviderRegistry();

    symbolRegistry.register({
      id: 'test-symbol-provider',
      source: { kind: 'mir', documentId: 'doc-1' },
      listSymbols: (inputContext) =>
        inputContext.scopeId === 'scope-doc-1' ? [symbol] : [],
      listScopes: () => [],
      getSymbol: (id) => (id === symbol.id ? symbol : null),
    });
    diagnosticRegistry.register({
      id: 'test-diagnostic-provider',
      source: { kind: 'code', artifactId: 'artifact-1' },
      getDiagnostics: (inputContext) =>
        inputContext.artifactId === 'artifact-1' ? [diagnostic] : [],
    });

    const environment = createAuthoringEnvironment({
      revision: 'rev-1',
      symbolRegistry,
      diagnosticRegistry,
    });

    expect(environment.revision).toBe('rev-1');
    expect(environment.querySymbols(context)).toEqual([symbol]);
    expect(environment.getCompletions(context)).toEqual([
      {
        label: '$state.count',
        symbolId: 'symbol-count',
        detail: 'number',
      },
    ]);
    expect(environment.getDiagnostics(context)).toEqual([diagnostic]);
    expect(
      environment.resolveReference({ name: '$state.count' }, context)
    ).toBeNull();
    expect(
      environment.getDefinition({ name: '$state.count' }, context)
    ).toBeNull();
    expect(environment.getReferences(symbol.id, context)).toEqual([]);
  });
});
