import type { Rule } from 'eslint';
import type { Node } from 'estree';

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'disallow unused MIR variables',
            category: 'Best Practices',
            recommended: true,
        },
        schema: [],
        messages: {
            unused: 'Variable "{{ name }}" is declared but never used.',
        },
    },

    create(context): Rule.RuleListener {
        const sourceCode = context.sourceCode;
        const declaredVars = new Map<string, Node>();
        const usedVars = new Set<string>();

        return {
            VariableDeclarator(node: any) {
                if (node.id.type === 'Identifier') {
                    declaredVars.set(node.id.name, node);
                }
            },

            Identifier(node: any) {
                usedVars.add(node.name);
            },

            'Program:exit'() {
                for (const [name, node] of declaredVars) {
                    if (!usedVars.has(name)) {
                        context.report({
                            node,
                            messageId: 'unused',
                            data: { name },
                        });
                    }
                }
            },
        };
    },
};

export = rule;
