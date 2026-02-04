import type { Meta, StoryObj } from '@storybook/react';
import MdrNav from './MdrNav';
import MdrButton from '../button/MdrButton';
import MdrLink from '../link/MdrLink';
import MdrIcon from '../icon/MdrIcon';

const meta: Meta<typeof MdrNav> = {
  title: 'Components/Nav',
  component: MdrNav,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'select',
      options: [2, 3],
      description: '布局列数',
    },
    canHide: {
      control: 'boolean',
      description: '是否可收起',
    },
    isFloat: {
      control: 'boolean',
      description: '是否浮动',
    },
    backgroundStyle: {
      control: 'select',
      options: ['Transparent', 'Solid', 'Blurred'],
      description: '背景样式',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MdrNav>;

const MenuIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export const Default: Story = {
  render: () => (
    <MdrNav>
      <MdrNav.Left>
        <MdrLink to="/" text="Logo" />
      </MdrNav.Left>
      <MdrNav.Center>
        <MdrLink to="/products" text="Products" />
        <MdrLink to="/about" text="About" />
        <MdrLink to="/contact" text="Contact" />
      </MdrNav.Center>
      <MdrNav.Right>
        <MdrIcon icon={SearchIcon} />
        <MdrButton text="Sign Up" size="Small" />
      </MdrNav.Right>
    </MdrNav>
  ),
};

export const TwoColumns: Story = {
  render: () => (
    <MdrNav columns={2}>
      <MdrNav.Left>
        <MdrLink to="/" text="Logo" />
      </MdrNav.Left>
      <MdrNav.Right>
        <MdrLink to="/login" text="Login" />
        <MdrButton text="Get Started" size="Small" />
      </MdrNav.Right>
    </MdrNav>
  ),
};

export const ThreeColumns: Story = {
  render: () => (
    <MdrNav columns={3}>
      <MdrNav.Left>
        <MdrLink to="/" text="Logo" />
      </MdrNav.Left>
      <MdrNav.Center>
        <MdrLink to="/nav1" text="Nav Item 1" />
        <MdrLink to="/nav2" text="Nav Item 2" />
        <MdrLink to="/nav3" text="Nav Item 3" />
      </MdrNav.Center>
      <MdrNav.Right>
        <MdrIcon icon={SearchIcon} />
        <MdrButton text="Action" size="Small" />
      </MdrNav.Right>
    </MdrNav>
  ),
};

export const WithHeading: Story = {
  render: () => (
    <MdrNav>
      <MdrNav.Left>
        <MdrNav.Heading heading="My App" />
      </MdrNav.Left>
      <MdrNav.Center>
        <MdrLink to="/page1" text="Page 1" />
        <MdrLink to="/page2" text="Page 2" />
      </MdrNav.Center>
      <MdrNav.Right>
        <MdrButton
          text="Menu"
          size="Small"
          icon={<MdrIcon icon={MenuIcon} />}
          iconPosition="Left"
        />
      </MdrNav.Right>
    </MdrNav>
  ),
};

export const TransparentBackground: Story = {
  render: () => (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <MdrNav backgroundStyle="Transparent">
        <MdrNav.Left>
          <MdrLink to="/" text="Logo" style={{ color: 'white' }} />
        </MdrNav.Left>
        <MdrNav.Center>
          <MdrLink to="/products" text="Products" style={{ color: 'white' }} />
          <MdrLink to="/about" text="About" style={{ color: 'white' }} />
        </MdrNav.Center>
        <MdrNav.Right>
          <MdrButton text="Sign Up" size="Small" category="Primary" />
        </MdrNav.Right>
      </MdrNav>
    </div>
  ),
};

export const BlurredBackground: Story = {
  render: () => (
    <MdrNav backgroundStyle="Blurred">
      <MdrNav.Left>
        <MdrLink to="/" text="Logo" />
      </MdrNav.Left>
      <MdrNav.Center>
        <MdrLink to="/nav1" text="Navigation 1" />
        <MdrLink to="/nav2" text="Navigation 2" />
        <MdrLink to="/nav3" text="Navigation 3" />
      </MdrNav.Center>
      <MdrNav.Right>
        <MdrButton text="Action" size="Small" />
      </MdrNav.Right>
    </MdrNav>
  ),
};

export const Float: Story = {
  render: () => (
    <div style={{ height: '200px', position: 'relative' }}>
      <MdrNav isFloat={true}>
        <MdrNav.Left>
          <MdrLink to="/" text="Floating Nav" />
        </MdrNav.Left>
        <MdrNav.Right>
          <MdrLink to="/about" text="About" />
        </MdrNav.Right>
      </MdrNav>
    </div>
  ),
};

export const CanHide: Story = {
  render: () => (
    <MdrNav canHide={true}>
      <MdrNav.Left>
        <MdrLink to="/" text="Collapsible Nav" />
      </MdrNav.Left>
      <MdrNav.Center>
        <MdrLink to="/item1" text="Item 1" />
        <MdrLink to="/item2" text="Item 2" />
        <MdrLink to="/item3" text="Item 3" />
      </MdrNav.Center>
      <MdrNav.Right>
        <MdrButton text="Menu" size="Small" />
      </MdrNav.Right>
    </MdrNav>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Solid Background</h3>
        <MdrNav backgroundStyle="Solid">
          <MdrNav.Left>
            <MdrLink to="/" text="Logo" />
          </MdrNav.Left>
          <MdrNav.Center>
            <MdrLink to="/nav" text="Nav" />
          </MdrNav.Center>
          <MdrNav.Right>
            <MdrButton text="Action" size="Small" />
          </MdrNav.Right>
        </MdrNav>
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Blurred Background</h3>
        <MdrNav backgroundStyle="Blurred">
          <MdrNav.Left>
            <MdrLink to="/" text="Logo" />
          </MdrNav.Left>
          <MdrNav.Center>
            <MdrLink to="/nav" text="Nav" />
          </MdrNav.Center>
          <MdrNav.Right>
            <MdrButton text="Action" size="Small" />
          </MdrNav.Right>
        </MdrNav>
      </div>
    </div>
  ),
};
