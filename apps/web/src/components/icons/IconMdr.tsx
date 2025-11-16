interface IconMdrProps {
  size?: number;
  color?: string;
  className?: string;
}

export const IconMdr = ({ 
  size = 30, 
  color = "currentColor",
  className = "" 
}: IconMdrProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 701 615" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M50 564C50 564 50 480.791 50 398M350 140L200 50L50 140C50 140 50 315.209 50 398M350 140L500 50L650 140M350 140V352M50 398L200 321M350 352V564L500 519L650 564M350 352L500 282L650 352" 
      stroke={color}
      strokeWidth="100" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);
