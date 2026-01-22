// src/stores/useEditorStore.ts
import type { MIRDocument } from '@/core/types/engine.types';
import { create } from 'zustand';

// 1. 定义 Store 的接口
interface EditorStore {
    mirDoc: MIRDocument
    generatedCode: string;
    isExportModalOpen: boolean;

    // 方法
    setGeneratedCode: (code: string) => void;
    setExportModalOpen: (open: boolean) => void;
    // ... 其他方法
}

// 2. 将接口传递给 create<T>()
export const useEditorStore = create<EditorStore>()((set) => ({
    mirDoc: {
        version: "1.0",
        ui: {
            root: {
                id: "root",
                type: "container"
            }
        }
    },
    generatedCode: '',
    isExportModalOpen: false,

    setGeneratedCode: (code) => set({ generatedCode: code }),
    setExportModalOpen: (open) => set({ isExportModalOpen: open }),
}));