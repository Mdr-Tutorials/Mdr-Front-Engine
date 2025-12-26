import './EditorBar.scss';
import { MdrIconLink } from '@mdr/ui';
import { LogIn } from "lucide-react";

function EditorBar({ state }: { state: 0 | 1 | 2 | 3 }) {
    return <nav className="EditorBar">
        <section className="EditorBarTop">
            {state === 0 && <div className="state-indicator state-0"></div>}
            <MdrIconLink icon={<LogIn size={32} />} size={32} to={"/"} />
        </section>
        <section className="EditorBarBottom"></section>
    </nav>
}

export default EditorBar;