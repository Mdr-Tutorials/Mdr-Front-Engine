import './MdrButton.scss'

function MdrButton({ text, size = 'Medium', category = 'Secondary', disabled = false, onlyIcon = false, icon, iconPosition = 'Right' }:
    {
        text?: string,
        size?: 'Big' | 'Medium' | 'Small' | 'Tiny',
        category?: 'Primary' | 'Secondary' | 'Danger' | 'SubDanger' | 'Warning' | 'SubWarning' | 'Ghost',
        disabled?: boolean,
        icon?: React.ReactNode,
        onlyIcon?: boolean,
        iconPosition?: 'Left' | 'Right',
        onClick?: () => void,
    }
) {
    if (onlyIcon && icon) {
        return <button className={`MdrButton ${size} ${category} ${disabled ? 'Disabled' : ''}`}>{icon}</button>;
    }
    if (icon && iconPosition === 'Left') {
        return <button className={`MdrButton ${size} ${category} ${disabled ? 'Disabled' : ''}`}>{icon}<span>{text}</span></button>;
    }
    if (icon && iconPosition === 'Right') {
        return <button className={`MdrButton ${size} ${category} ${disabled ? 'Disabled' : ''}`}><span>{text}</span>{icon}</button>;
    }
    return <button className={`MdrButton ${size} ${category} ${disabled ? 'Disabled' : ''}`}>{text}</button>;
}

export default MdrButton;