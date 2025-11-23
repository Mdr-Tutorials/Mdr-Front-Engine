import './EditorBar.scss';
import { MdrButtonLink } from '@mdr/ui';
import { GoSignIn } from "react-icons/go";

function EditorBar({ state }: { state: 0 | 1 | 2 | 3 }) {
    return <nav className="EditorBar">
        <section className="EditorBarTop">
            {state === 0 && <div className="state-indicator state-0"></div>}
            <MdrButtonLink onlyIcon icon={<GoSignIn />} category='Primary' size='Big' to={"/"} style={{ color: "var(--color-subdanger)" }}></MdrButtonLink>
        </section>
        <section className="EditorBarBottom"></section>
    </nav>
}

export default EditorBar;