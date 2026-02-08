import {
    MdrAnchorNavigation,
    MdrBreadcrumb,
    MdrButton,
    MdrCollapse,
    MdrNav,
    MdrNavbar,
    MdrPagination,
    MdrSidebar,
    MdrTabs,
    MdrText,
} from '@mdr/ui';
import type { ComponentGroup } from '../../../BlueprintEditor.types';
import { buildVariants } from '../helpers';
import { NAV_COLUMNS, SIZE_OPTIONS } from '../options';
import {
    ANCHOR_ITEMS,
    BREADCRUMB_ITEMS,
    COLLAPSE_ITEMS,
    NAVBAR_ITEMS,
    SIDEBAR_ITEMS,
    TAB_ITEMS,
} from '../sampleData';

export const NAV_GROUP: ComponentGroup = {
    id: 'nav',
    title: '导航组件',
    items: [
        {
            id: 'nav',
            name: 'Nav',
            preview: (
                <MdrNav
                    columns={2}
                    backgroundStyle="Solid"
                    style={{ width: 180 }}
                >
                    <div className="MdrNavLeft">
                        <MdrText size="Tiny">Brand</MdrText>
                    </div>
                    <div className="MdrNavRight">
                        <MdrButton text="Login" size="Tiny" category="Ghost" />
                    </div>
                </MdrNav>
            ),
            variants: buildVariants(
                NAV_COLUMNS,
                (columns) => (
                    <MdrNav
                        columns={columns}
                        backgroundStyle="Solid"
                        style={{ width: 180 }}
                    >
                        <div className="MdrNavLeft">
                            <MdrText size="Tiny">Brand</MdrText>
                        </div>
                        <div className="MdrNavRight">
                            <MdrButton
                                text={columns === 2 ? 'Login' : 'Start'}
                                size="Tiny"
                                category="Ghost"
                            />
                        </div>
                    </MdrNav>
                ),
                (columns) => `${columns} Col`
            ),
            scale: 0.55,
        },
        {
            id: 'navbar',
            name: 'Navbar',
            preview: (
                <MdrNavbar size="Medium" brand="Mdr" items={NAVBAR_ITEMS} />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrNavbar
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    brand="Mdr"
                    items={NAVBAR_ITEMS}
                />
            ),
            scale: 0.5,
        },
        {
            id: 'sidebar',
            name: 'Sidebar',
            preview: (
                <MdrSidebar title="Menu" items={SIDEBAR_ITEMS} width={160} />
            ),
            scale: 0.5,
        },
        {
            id: 'breadcrumb',
            name: 'Breadcrumb',
            preview: <MdrBreadcrumb items={BREADCRUMB_ITEMS} />,
            scale: 0.7,
        },
        {
            id: 'pagination',
            name: 'Pagination',
            preview: <MdrPagination page={2} total={50} />,
            scale: 0.6,
        },
        {
            id: 'anchor-navigation',
            name: 'AnchorNav',
            preview: (
                <MdrAnchorNavigation
                    items={ANCHOR_ITEMS}
                    orientation="Vertical"
                />
            ),
            variants: buildVariants(
                ['Vertical', 'Horizontal'] as const,
                (orientation) => (
                    <MdrAnchorNavigation
                        items={ANCHOR_ITEMS}
                        orientation={orientation}
                    />
                )
            ),
            scale: 0.6,
        },
        {
            id: 'tabs',
            name: 'Tabs',
            preview: <MdrTabs items={TAB_ITEMS} />,
            scale: 0.55,
        },
        {
            id: 'collapse',
            name: 'Collapse',
            preview: (
                <MdrCollapse
                    items={COLLAPSE_ITEMS}
                    defaultActiveKeys={['panel-1']}
                />
            ),
            scale: 0.55,
        },
    ],
};
