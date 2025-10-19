import './MdrButton.css'

function MdrButton({ text, size, category }:
    {
        text: string,
        size?: 'Big' | 'Medium' | 'Small' | 'Tiny',
        category?: 'Primary' | 'Secondary' | 'Danger' | 'SubDanger' | 'Warning' | 'SubWarning' | 'Ghost'
    }
) {
    return <button className={'MdrButton ' + size + ' ' + category}>{text}</button>;
}

export default MdrButton;