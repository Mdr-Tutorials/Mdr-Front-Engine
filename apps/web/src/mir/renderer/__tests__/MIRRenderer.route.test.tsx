import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentNode, MIRDocument } from '@/core/types/engine.types';
import { MIRRenderer } from '../MIRRenderer';

const createDoc = (root: ComponentNode): MIRDocument => ({
  version: '1.0',
  ui: { root },
});

describe('MIRRenderer route matching', () => {
  it('keeps non-route content visible and supports nested route prefix match', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'MdrDiv',
      children: [
        {
          id: 'always-visible',
          type: 'MdrText',
          text: 'Always visible',
        },
        {
          id: 'route-shell',
          type: 'MdrRoute',
          props: {
            currentPath: { $param: 'currentPath' },
          },
          children: [
            {
              id: 'about-shell',
              type: 'MdrDiv',
              props: { 'data-route-path': '/about' },
              children: [
                {
                  id: 'nested-route',
                  type: 'MdrRoute',
                  props: {
                    currentPath: { $param: 'currentPath' },
                  },
                  children: [
                    {
                      id: 'about-team',
                      type: 'MdrText',
                      text: 'About team',
                      props: { 'data-route-path': '/about/team' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        overrides={{ currentPath: '/about/team' }}
      />
    );

    expect(screen.getByText('Always visible')).toBeTruthy();
    expect(screen.getByText('About team')).toBeTruthy();
  });

  it('injects editor currentPath into MdrRoute when currentPath prop is absent', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'MdrRoute',
      children: [
        {
          id: 'route-a',
          type: 'MdrText',
          text: 'Route A',
          props: { 'data-route-path': '/a' },
        },
      ],
    };

    render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        overrides={{ currentPath: '/a' }}
      />
    );

    expect(screen.getByText('Route A')).toBeTruthy();
  });

  it('supports relative child route paths with index route', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'MdrRoute',
      children: [
        {
          id: 'user-layout',
          type: 'MdrDiv',
          props: { 'data-route-path': '/users/:userId' },
          children: [
            {
              id: 'nested-route',
              type: 'MdrRoute',
              children: [
                {
                  id: 'user-index',
                  type: 'MdrText',
                  text: 'User index',
                  props: { 'data-route-index': true },
                },
                {
                  id: 'user-settings',
                  type: 'MdrText',
                  text: 'User settings',
                  props: { 'data-route-path': 'settings' },
                },
              ],
            },
          ],
        },
      ],
    };

    const { rerender } = render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        overrides={{ currentPath: '/users/42' }}
      />
    );

    expect(screen.getByText('User index')).toBeTruthy();

    rerender(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        overrides={{ currentPath: '/users/42/settings' }}
      />
    );

    expect(screen.getByText('User settings')).toBeTruthy();
  });

  it('supports wildcard routes and keeps ranking stable', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'MdrRoute',
      children: [
        {
          id: 'users-new',
          type: 'MdrText',
          text: 'Users new',
          props: { 'data-route-path': '/users/new' },
        },
        {
          id: 'users-param',
          type: 'MdrText',
          text: 'Users param',
          props: { 'data-route-path': '/users/:id' },
        },
        {
          id: 'users-wildcard',
          type: 'MdrText',
          text: 'Users wildcard',
          props: { 'data-route-path': '/users/*' },
        },
      ],
    };

    const { rerender } = render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        overrides={{ currentPath: '/users/new' }}
      />
    );

    expect(screen.getByText('Users new')).toBeTruthy();

    rerender(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        overrides={{ currentPath: '/users/100' }}
      />
    );

    expect(screen.getByText('Users param')).toBeTruthy();

    rerender(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        overrides={{ currentPath: '/users/100/profile' }}
      />
    );

    expect(screen.getByText('Users wildcard')).toBeTruthy();
  });
});
