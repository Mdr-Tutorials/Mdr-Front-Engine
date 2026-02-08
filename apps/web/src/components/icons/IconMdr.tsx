interface IconMdrProps {
    size?: number;
    color?: string;
    className?: string;
}

export const IconMdr = ({
    size = 30,
    color = 'currentColor',
    className = '',
}: IconMdrProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 498 490"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M35 454.5V259.5M35 259.5V35H249M35 259.5H249M463 259.5H249M249 259.5V35M249 259.5V454.5H463M249 35H463V109.5"
            stroke={color}
            strokeWidth="70"
            strokeLinecap="square"
        />
    </svg>
);
