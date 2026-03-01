import { describe, expect, it, beforeEach } from 'vitest';
import { getComponentGroups } from '@/editor/features/design/BlueprintEditor.data';
import { createNodeFromPaletteItem } from '@/editor/features/design/BlueprintEditor';

/**
 * 基于组件注册机制的拖拽测试
 *
 * 优势：
 * 1. 自动测试所有注册的组件，无需为每个组件单独编写测试
 * 2. 新增组件时，测试自动覆盖
 * 3. 统一的测试标准，确保所有组件行为一致
 */

describe('Blueprint Drag and Drop - Registry Based Tests', () => {
  const componentGroups = getComponentGroups();
  const allItems = componentGroups.flatMap((group) => group.items);

  describe('Component Registry Validation', () => {
    it('has registered component groups', () => {
      expect(componentGroups.length).toBeGreaterThan(0);
    });

    it('all groups have valid items', () => {
      componentGroups.forEach((group) => {
        expect(group.id).toBeTruthy();
        expect(group.title).toBeTruthy();
        expect(Array.isArray(group.items)).toBe(true);
      });
    });

    it('all items have required drag properties', () => {
      allItems.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(typeof item.id).toBe('string');
      });
    });
  });

  describe('Node Creation from Palette Items', () => {
    it('creates correct node types for all registered components', () => {
      const createId = (type: string) => `${type}-1`;
      let testedCount = 0;

      allItems.forEach((item) => {
        const node = createNodeFromPaletteItem(item.id, createId);
        expect(node).toBeTruthy();
        expect(node.type).toBeTruthy();
        expect(node.id).toBeTruthy();
        expect(node.id).toBe(`${node.type}-1`);
        testedCount++;
      });

      // 验证确实测试了所有组件
      console.log(`✅ Tested ${testedCount} components`);
      expect(testedCount).toBeGreaterThan(0);
    });

    it('handles variants for all components with variants', () => {
      const createId = (type: string) => `${type}-variant`;
      let componentsWithVariants = 0;
      let totalVariants = 0;

      allItems.forEach((item) => {
        if (item.variants && item.variants.length > 0) {
          componentsWithVariants++;
          item.variants.forEach((variant) => {
            const node = createNodeFromPaletteItem(
              item.id,
              createId,
              variant.props
            );
            expect(node).toBeTruthy();
            expect(node.type).toBeTruthy();
            totalVariants++;
          });
        }
      });

      console.log(
        `✅ Tested ${componentsWithVariants} components with variants (${totalVariants} total variants)`
      );
    });

    it('handles size options for all components with sizes', () => {
      const createId = (type: string) => `${type}-sized`;
      let componentsWithSizes = 0;
      let totalSizeOptions = 0;

      allItems.forEach((item) => {
        if (item.sizeOptions && item.sizeOptions.length > 0) {
          componentsWithSizes++;
          totalSizeOptions += item.sizeOptions.length;
          const selectedSize = item.sizeOptions[0].value;
          const node = createNodeFromPaletteItem(
            item.id,
            createId,
            undefined,
            selectedSize
          );
          expect(node).toBeTruthy();
          expect(node.type).toBeTruthy();
        }
      });

      console.log(
        `✅ Tested ${componentsWithSizes} components with size options (${totalSizeOptions} total size options)`
      );
    });
  });
});
