import type { MdrComponent } from '@mdr/shared';
import './MdrNav.scss'

interface MdrNavSpecificProps {
  columes?: 2 | 3, // 2: 左右 3: 左中右
  canHide: boolean,
  isFloat: boolean,
  backgroundStyle: 'Transparent' | 'Solid' | 'Blurred',
  childrens?: React.ReactNode
}

interface MdrNavProps extends MdrComponent, MdrNavSpecificProps { }

function MdrNav({
  canHide,
  isFloat,
  backgroundStyle = 'Solid',
  childrens,
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
  as: Component = 'nav', }: MdrNavProps) {

  const fullClassName = `MdrNav ${isFloat ? 'Float' : ''} ${canHide ? 'CanHide' : ''} ${backgroundStyle} ${className || ''}`.trim();
  const dataProps = { ...dataAttributes }
  const Element = Component as React.ElementType
  return (
    <Element className={fullClassName} style={style} id={id} onClick={onClick} {...dataProps} >{childrens}</Element>
  )
}

function MdrNavLeft() {
  return (
    <div className="MdrNavLeft">
    </div>
  )
}


function MdrNavCenter() {
  return (
    <div className="MdrNavCenter">
    </div>
  )
}

function MdrNavRight() {
  return (
    <div className="MdrNavRight">
    </div>
  )
}

MdrNav.Left = MdrNavLeft;
MdrNav.Center = MdrNavCenter;
MdrNav.Right = MdrNavRight;

export default MdrNav;