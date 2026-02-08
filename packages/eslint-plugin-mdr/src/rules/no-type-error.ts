import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'detect type mismatches in MIR operations',
        },
        messages: {
            mismatch:
                'Type mismatch: expected {{ expected }}, got {{ actual }}',
        },
    },

    create(context): Rule.RuleListener {
        return {
            CallExpression(node: any) {
                // 检查函数调用参数类型
                // 类型推断
            },

            BinaryExpression(node: any) {
                // 检查二元操作数类型兼容
            },
        };
    },
};

export = rule;
